package cafe.community.backend.mail;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The form addresses come from application.properties, and a deployment changes one through its
 * APP_MAIL_* environment variable, as before they were bound as one record.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "APP_MAIL_FORMS_LOAN=uitleen@hubble.cafe")
class FormMailAddressesTest {

    @Autowired FormMailAddresses addresses;

    @Test
    void takesTheDefaultsFromApplicationProperties() {
        assertThat(addresses.from().hubble()).isEqualTo("noreply@hubble.cafe");
        assertThat(addresses.from().meteor()).isEqualTo("noreply@meteor.cafe");
        assertThat(addresses.forms().complaints()).isEqualTo("nuisance@hubble.cafe");
        assertThat(addresses.forms().declarations()).isEqualTo("finance@hubble.cafe");
        assertThat(addresses.forms().declarationsMeteor()).isEqualTo("finance@meteor.cafe");
        assertThat(addresses.forms().declarationsCc()).isNullOrEmpty();
    }

    @Test
    void letsADeploymentOverrideOneThroughItsEnvironmentVariable() {
        assertThat(addresses.forms().loan()).isEqualTo("uitleen@hubble.cafe");
        assertThat(addresses.forms().information()).isEqualTo("info@hubble.cafe");
    }
}
