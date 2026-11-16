package cafe.community.backend.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BarLocationTest {

    @Test
    void parsesEitherBarAndTreatsBlankAsShared() {
        assertThat(BarLocation.parseOrShared("HUBBLE")).isEqualTo(BarLocation.HUBBLE);
        assertThat(BarLocation.parseOrShared("METEOR")).isEqualTo(BarLocation.METEOR);
        assertThat(BarLocation.parseOrShared(null)).isNull();
        assertThat(BarLocation.parseOrShared("")).isNull();
        assertThat(BarLocation.parseOrShared("  ")).isNull();
    }

    @Test
    void anUnknownBarGetsAMessageForPeopleNotAJavaClassName() {
        assertThatThrownBy(() -> BarLocation.parseOrShared("hubble"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Unknown bar: hubble. Use HUBBLE or METEOR.");
    }
}
