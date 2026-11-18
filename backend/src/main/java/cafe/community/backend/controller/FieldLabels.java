package cafe.community.backend.controller;

import java.util.Map;

/**
 * Turns a request field's code name into the words people see on the form, for validation
 * messages: "Sign-up link must start with https://", not "subscribeLink must start with https://".
 * Admin staff and the public sites both show these messages as they are.
 */
final class FieldLabels {

    /** Fields whose form label is not simply their name split into words. */
    private static final Map<String, String> LABELS = Map.ofEntries(
            Map.entry("subscribeLink", "Sign-up link"),
            Map.entry("applyEmail", "Apply e-mail"),
            Map.entry("studentPrice", "TU/e student price"),
            Map.entry("open", "Opens"),
            Map.entry("close", "Closes"),
            Map.entry("kitchenOpen", "Kitchen opens"),
            Map.entry("kitchenClose", "Kitchen closes"),
            Map.entry("iban", "IBAN"),
            Map.entry("hexColor", "Clock / progress colour"),
            Map.entry("pickupDate", "Pick-up date"),
            Map.entry("pickupTime", "Pick-up time"));

    private FieldLabels() {}

    /** The label for a field path such as "startTime" or "permissions[EVENTS]". */
    static String of(String field) {
        String name = field.replaceAll("\\[.*?]", "");
        name = name.substring(name.lastIndexOf('.') + 1);
        String label = LABELS.get(name);
        if (label != null) {
            return label;
        }
        String words = name.replaceAll("([a-z0-9])([A-Z])", "$1 $2").toLowerCase();
        return words.isEmpty() ? field : Character.toUpperCase(words.charAt(0)) + words.substring(1);
    }
}
