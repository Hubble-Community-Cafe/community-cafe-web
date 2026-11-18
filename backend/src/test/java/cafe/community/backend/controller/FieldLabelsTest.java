package cafe.community.backend.controller;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FieldLabelsTest {

    @Test
    void splitsACodeNameIntoWords() {
        assertThat(FieldLabels.of("startTime")).isEqualTo("Start time");
        assertThat(FieldLabels.of("dateOfPurchase")).isEqualTo("Date of purchase");
        assertThat(FieldLabels.of("name")).isEqualTo("Name");
    }

    @Test
    void usesTheFormLabelWhereItDiffersFromTheName() {
        assertThat(FieldLabels.of("subscribeLink")).isEqualTo("Sign-up link");
        assertThat(FieldLabels.of("iban")).isEqualTo("IBAN");
        assertThat(FieldLabels.of("kitchenOpen")).isEqualTo("Kitchen opens");
    }

    @Test
    void namesTheFieldItselfInANestedPath() {
        assertThat(FieldLabels.of("permissions[EVENTS]")).isEqualTo("Permissions");
        assertThat(FieldLabels.of("items[0].regularPrice")).isEqualTo("Regular price");
    }
}
