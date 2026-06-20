package cafe.community.backend.mail;

/**
 * Sends a {@link FormEmail}. Implementations are selected by {@code app.mail.provider}:
 * {@code smtp} (e2e/dev via Mailpit, or any SMTP server), {@code log} (default no-op that
 * just logs), and later {@code graph} (Microsoft Graph in production, once mail is set up).
 */
public interface FormMailService {
    void send(FormEmail email);
}
