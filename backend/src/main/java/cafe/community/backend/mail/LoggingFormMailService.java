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
        log.info("[mail:log] would send form notification to={} cc={} replyTo={} subject='{}' attachments={}",
                email.to(), email.cc(), email.replyTo(), email.subject(),
                email.attachments() == null ? 0 : email.attachments().size());
    }
}
