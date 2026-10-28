package cafe.community.backend.service.audit;

import cafe.community.backend.dto.FieldChange;
import cafe.community.backend.model.BarLocation;
import cafe.community.backend.model.BoardType;
import cafe.community.backend.model.MediaAsset;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class SnapshotTest {

    @Test
    void formatsValuesTheWayStaffReadThem() {
        MediaAsset photo = new MediaAsset();
        photo.setFilename("quiz.jpg");

        assertThat(new Snapshot()
                .money("Price", new BigDecimal("7.5"))
                .yesNo("Visible", false)
                .bar("Bar", null)
                .bar("Other bar", BarLocation.METEOR)
                .choice("Type", BoardType.SUPERVISORY)
                .image("Image", photo)
                .asCreated())
                .containsExactly(
                        new FieldChange("Price", null, "7.50"),
                        new FieldChange("Visible", null, "No"),
                        new FieldChange("Bar", null, "Both"),
                        new FieldChange("Other bar", null, "Meteor"),
                        new FieldChange("Type", null, "Supervisory"),
                        new FieldChange("Image", null, "quiz.jpg"));
    }

    @Test
    void listsOnlyTheFieldsThatChanged() {
        Snapshot before = new Snapshot().text("Name", "Mojito").money("Price", new BigDecimal("7.00"));
        Snapshot after = new Snapshot().text("Name", "Mojito").money("Price", new BigDecimal("7.50"));

        assertThat(before.changesTo(after)).containsExactly(new FieldChange("Price", "7.00", "7.50"));
    }

    @Test
    void treatsTheSamePriceAtAnotherScaleAsUnchanged() {
        Snapshot before = new Snapshot().money("Price", new BigDecimal("7.00"));
        Snapshot after = new Snapshot().money("Price", new BigDecimal("7"));

        assertThat(before.changesTo(after)).isEmpty();
    }

    @Test
    void treatsBlankTextAsNoValue() {
        Snapshot before = new Snapshot().text("Note", null);
        Snapshot after = new Snapshot().text("Note", "  ");

        assertThat(before.changesTo(after)).isEmpty();
        assertThat(after.asCreated()).isEmpty();
    }

    @Test
    void recordsAClearedFieldAsRemoved() {
        Snapshot before = new Snapshot().text("Description", "With lime");
        Snapshot after = new Snapshot().text("Description", "");

        assertThat(before.changesTo(after)).containsExactly(new FieldChange("Description", "With lime", null));
    }

    @Test
    void keepsTheLastValuesOnDelete() {
        assertThat(new Snapshot().text("Name", "Mojito").text("Description", null).asDeleted())
                .containsExactly(new FieldChange("Name", "Mojito", null));
    }
}
