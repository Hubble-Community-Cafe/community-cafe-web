package cafe.community.backend.config;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtValidationException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The checks {@link SecurityConfig#jwtDecoder()} puts on an Entra token beyond its signature:
 * issuer of our tenant (v1 or v2 form), our app as audience, and not expired. Uses a real Nimbus
 * decoder with a locally generated key, so the claims go through the same conversion as in
 * production, only the key source differs.
 */
class SecurityConfigTokenValidationTest {

    private static final String TENANT = "11111111-2222-3333-4444-555555555555";
    private static final String CLIENT = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    private static final String ISSUER_V1 = "https://sts.windows.net/" + TENANT + "/";
    private static final String ISSUER_V2 = "https://login.microsoftonline.com/" + TENANT + "/v2.0";

    private final KeyPair keys = rsaKeys();
    private final NimbusJwtDecoder decoder = decoder(CLIENT);

    @Test
    void acceptsBothIssuerFormsAndBothAudienceForms() throws JOSEException {
        assertThat(decoder.decode(token(ISSUER_V2, "api://" + CLIENT, 3600)).getSubject()).isEqualTo("staff");
        assertThat(decoder.decode(token(ISSUER_V1, CLIENT, 3600)).getSubject()).isEqualTo("staff");
    }

    @Test
    void acceptsOurAppAmongSeveralAudiences() throws JOSEException {
        Jwt jwt = decoder.decode(token(ISSUER_V2, List.of("https://graph.microsoft.com", "api://" + CLIENT), 3600));

        assertThat(jwt.getAudience()).contains("api://" + CLIENT);
    }

    @Test
    void rejectsATokenFromAnotherTenant() throws JOSEException {
        String otherTenant = "https://login.microsoftonline.com/99999999-0000-0000-0000-000000000000/v2.0";

        assertThatThrownBy(() -> decoder.decode(token(otherTenant, "api://" + CLIENT, 3600)))
                .isInstanceOf(JwtValidationException.class)
                .hasMessageContaining("iss");
    }

    @Test
    void rejectsATokenForAnotherApp() throws JOSEException {
        String otherApp = token(ISSUER_V2, "api://00000000-1111-2222-3333-444444444444", 3600);

        assertThatThrownBy(() -> decoder.decode(otherApp))
                .isInstanceOf(JwtValidationException.class)
                .hasMessageContaining("aud");
    }

    @Test
    void rejectsAnExpiredToken() throws JOSEException {
        String expired = token(ISSUER_V2, "api://" + CLIENT, -3600);

        assertThatThrownBy(() -> decoder.decode(expired))
                .isInstanceOf(JwtValidationException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void withoutAClientIdAnyAudienceIsAcceptedButTheIssuerStillCounts() throws JOSEException {
        NimbusJwtDecoder noClient = decoder("");

        assertThat(noClient.decode(token(ISSUER_V2, "api://whatever", 3600))).isNotNull();
        assertThatThrownBy(() -> noClient.decode(token("https://evil.example/", "api://whatever", 3600)))
                .isInstanceOf(JwtValidationException.class);
    }

    private NimbusJwtDecoder decoder(String clientId) {
        NimbusJwtDecoder nimbus = NimbusJwtDecoder.withPublicKey((RSAPublicKey) keys.getPublic()).build();
        nimbus.setJwtValidator(SecurityConfig.tokenValidator(TENANT, clientId));
        return nimbus;
    }

    private String token(String issuer, Object audience, long secondsValid) throws JOSEException {
        Instant now = Instant.now();
        JWTClaimsSet.Builder claims = new JWTClaimsSet.Builder()
                .subject("staff")
                .issuer(issuer)
                .issueTime(Date.from(now.minusSeconds(Math.max(0, -secondsValid) + 60)))
                .expirationTime(Date.from(now.plusSeconds(secondsValid)));
        if (audience instanceof String single) {
            claims.audience(single);
        } else {
            @SuppressWarnings("unchecked")
            List<String> many = (List<String>) audience;
            claims.audience(many);
        }
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims.build());
        jwt.sign(new RSASSASigner((RSAPrivateKey) keys.getPrivate()));
        return jwt.serialize();
    }

    private static KeyPair rsaKeys() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
