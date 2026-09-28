package cafe.community.backend.filter;

import cafe.community.backend.model.AdminRole;
import cafe.community.backend.model.AdminUser;
import cafe.community.backend.service.AdminUserService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit-tests the role enrichment and the backend staff-group check. The SecurityContextHolder is
 * thread-local, so it is cleared before and after each test to keep a JWT from leaking into
 * whichever test runs next on the same thread.
 */
class RoleAuthorizationFilterTest {

    private static final String STAFF_GROUP = "7f3c1a2e-staff-group";
    private static final String OID = "d7795f0e-32fd-4618-b5da-bf2c0079dd4a";

    private final AdminUserService adminUserService = mock(AdminUserService.class);
    private final FilterChain filterChain = mock(FilterChain.class);
    private final MockHttpServletRequest request = new MockHttpServletRequest();
    private final MockHttpServletResponse response = new MockHttpServletResponse();

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void skipsNonAdminPaths() throws Exception {
        RoleAuthorizationFilter filter = new RoleAuthorizationFilter(adminUserService, "");
        request.setRequestURI("/api/public/menu");

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(adminUserService, never()).getOrCreateUser(anyString(), anyString(), anyString());
    }

    @Test
    void withoutGroupRestrictionAnyTokenIsEnriched() throws Exception {
        RoleAuthorizationFilter filter = new RoleAuthorizationFilter(adminUserService, "");
        request.setRequestURI("/api/admin/menu");
        setupJwtAuth(AdminRole.EDITOR, List.of());

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(authorities()).containsExactlyInAnyOrder("ROLE_VIEWER", "ROLE_DDD_POSTER", "ROLE_EDITOR");
    }

    @Test
    void withGroupRestrictionAStaffGroupMemberIsEnriched() throws Exception {
        RoleAuthorizationFilter filter = new RoleAuthorizationFilter(adminUserService, STAFF_GROUP);
        request.setRequestURI("/api/admin/menu");
        setupJwtAuth(AdminRole.VIEWER, List.of("some-other-group", STAFF_GROUP));

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(authorities()).containsExactly("ROLE_VIEWER");
    }

    @Test
    void withGroupRestrictionATokenWithoutTheStaffGroupIsRejectedBeforeProvisioning() throws Exception {
        RoleAuthorizationFilter filter = new RoleAuthorizationFilter(adminUserService, STAFF_GROUP);
        request.setRequestURI("/api/admin/users/me");
        setJwt(Map.of("oid", OID, "sub", OID, "groups", List.of("some-other-group")));

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("NOT_IN_STAFF_GROUP");
        verify(filterChain, never()).doFilter(any(), any());
        // No admin_user row may be created for someone outside the staff group.
        verify(adminUserService, never()).getOrCreateUser(anyString(), anyString(), anyString());
    }

    @Test
    void withGroupRestrictionATokenWithoutAnyGroupsClaimIsRejected() throws Exception {
        // Also the shape of an Entra "overage" token, where the groups claim is left out.
        RoleAuthorizationFilter filter = new RoleAuthorizationFilter(adminUserService, STAFF_GROUP);
        request.setRequestURI("/api/admin/events");
        setJwt(Map.of("oid", OID, "sub", OID));

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(403);
        verify(filterChain, never()).doFilter(any(), any());
        verify(adminUserService, never()).getOrCreateUser(anyString(), anyString(), anyString());
    }

    @Test
    void withGroupRestrictionPublicPathsAreNotAffected() throws Exception {
        RoleAuthorizationFilter filter = new RoleAuthorizationFilter(adminUserService, STAFF_GROUP);
        request.setRequestURI("/api/public/menu");

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void blankGroupSettingMeansNoRestriction() throws Exception {
        RoleAuthorizationFilter filter = new RoleAuthorizationFilter(adminUserService, "   ");
        request.setRequestURI("/api/admin/menu");
        setupJwtAuth(AdminRole.VIEWER, List.of());

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    private void setupJwtAuth(AdminRole role, List<String> groups) {
        setJwt(Map.of("oid", OID, "preferred_username", "staff@hubble.cafe", "name", "Staff", "sub", OID,
                "groups", groups));

        AdminUser user = new AdminUser();
        user.setAzureOid(OID);
        user.setEmail("staff@hubble.cafe");
        user.setDisplayName("Staff");
        user.setRole(role);
        when(adminUserService.getOrCreateUser(OID, "staff@hubble.cafe", "Staff")).thenReturn(user);
    }

    private void setJwt(Map<String, Object> claims) {
        Jwt jwt = new Jwt("token", Instant.now(), Instant.now().plusSeconds(3600),
                Map.of("alg", "RS256"), claims);
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }

    private List<String> authorities() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
    }
}
