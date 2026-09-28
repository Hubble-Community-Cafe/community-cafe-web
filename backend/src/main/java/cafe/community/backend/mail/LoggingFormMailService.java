package cafe.community.backend.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Default mail provider: logs the notification instead of sending it. Active unless
 * {@code app.mail.provider} is set, so local dev and tests work without mail config.
 */
@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "log", matchIfMissing = true)
public class LoggingFormMailService implements FormMailService {

    private static final Logger log = LoggerFactory.getLogger(LoggingFormMailService.class);

    @Override
    public void send(FormEmail email) {
        // No recipients, reply-to or subject: they can be a visitor's address or name, and this
        // provider may also be switched on in production while mail is being set up.
        log.info("[mail:log] would send form email from={} cc={} replyTo={} attachments={}",
                email.from(), email.cc() != null && !email.cc().isBlank(),
                email.replyTo() != null && !email.replyTo().isBlank(),
                email.attachments() == null ? 0 : email.attachments().size());
    }
}
