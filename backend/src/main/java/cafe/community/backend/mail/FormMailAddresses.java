package cafe.community.backend.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Who the public forms mail, and from which address: {@code app.mail.from.*} and
 * {@code app.mail.forms.*} in application.properties, each overridable by its APP_MAIL_*
 * environment variable. The defaults live there only, not repeated in code.
 */
@ConfigurationProperties("app.mail")
public record FormMailAddresses(From from, Forms forms) {

    /** The sender per site: a form on the Meteor site mails from Meteor's address. */
    public record From(String hubble, String meteor) {}

    /**
     * The mailing list each form notifies. Declarations go per company (Hubble and Meteor are
     * separate legal entities), each with an optional CC.
     */
    public record Forms(String complaints, String screens, String declarations, String declarationsCc,
                        String declarationsMeteor, String declarationsMeteorCc, String information,
                        String loan) {}
}
