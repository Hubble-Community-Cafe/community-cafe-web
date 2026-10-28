package cafe.community.backend.service.audit;

import cafe.community.backend.model.Association;
import cafe.community.backend.model.BoardMember;
import cafe.community.backend.model.BoardTerm;
import cafe.community.backend.model.DailyDish;
import cafe.community.backend.model.Event;
import cafe.community.backend.model.HoursOverride;
import cafe.community.backend.model.MenuCategory;
import cafe.community.backend.model.MenuItem;
import cafe.community.backend.model.OpeningHours;
import cafe.community.backend.model.Vacancy;

/**
 * What the audit log records of each kind of content, with the names staff see in the admin.
 * Positions are left out: reordering is audited on its own.
 */
public final class AuditSnapshots {

    private AuditSnapshots() {
    }

    public static Snapshot of(MenuCategory c) {
        return new Snapshot()
                .text("Name", c.getName())
                .choice("Kind", c.getKind())
                .text("Tab", c.getParent() == null ? null : c.getParent().getName())
                .bar("Bar", c.getBar())
                .text("Availability note", c.getAvailabilityNote())
                .yesNo("Visible", c.isActive());
    }

    public static Snapshot of(MenuItem i) {
        return new Snapshot()
                .text("Name", i.getName())
                .text("Category", i.getCategory() == null ? null : i.getCategory().getName())
                .text("Description", i.getDescription())
                .money("Regular price", i.getRegularPrice())
                .money("TU/e student price", i.getStudentPrice())
                .text("Sizes", i.getSizeOptions())
                .text("Dietary tags", i.getDietaryTags())
                .text("Allergens", i.getAllergens())
                .image("Image", i.getImage())
                .yesNo("Visible", i.isActive());
    }

    public static Snapshot of(DailyDish d) {
        return new Snapshot()
                .value("Date", d.getDate())
                .text("Name", d.getName())
                .text("Description", d.getDescription())
                .money("Price", d.getPrice())
                .image("Photo", d.getImage());
    }

    public static Snapshot of(Event e) {
        return new Snapshot()
                .text("Title", e.getTitle())
                .bar("Bar", e.getBar())
                .value("Date", e.getDate())
                .value("Start time", e.getStartTime())
                .text("Price", e.getPrice())
                .text("Description", e.getDescription())
                .text("Sign-up link", e.getSubscribeLink())
                .image("Image", e.getImage())
                .yesNo("Published", e.isPublished());
    }

    public static Snapshot of(BoardTerm t) {
        return new Snapshot()
                .text("Label", t.getLabel())
                .choice("Type", t.getType())
                .bar("Bar", t.getBar())
                .yesNo("Current board", t.isCurrent())
                .image("Group photo", t.getGroupPhoto())
                .text("Photo credit", t.getPhotoCredit());
    }

    public static Snapshot of(BoardMember m) {
        return new Snapshot()
                .text("Name", m.getName())
                .text("Role", m.getRole())
                .image("Photo", m.getPhoto());
    }

    public static Snapshot of(Vacancy v) {
        return new Snapshot()
                .text("Title", v.getTitle())
                .bar("Bar", v.getBar())
                .text("Hours", v.getHours())
                .text("Type", v.getType())
                .text("Description", v.getDescription())
                .text("Apply email", v.getApplyEmail())
                .text("Apply link", v.getApplyLink())
                .image("Image", v.getImage())
                .yesNo("Visible", v.isActive());
    }

    public static Snapshot of(Association a) {
        return new Snapshot()
                .text("Name", a.getName())
                .bar("Bar", a.getBar())
                .image("Logo", a.getLogo());
    }

    public static Snapshot of(HoursOverride o) {
        String status = o.isClosed() ? "Closed"
                : o.getOpen() != null ? "Open " + o.getOpen() + " to " + o.getClose()
                : "Open";
        return new Snapshot()
                .value("Date", o.getDate())
                .text("Status", status)
                .text("Note", o.getNote());
    }

    public static Snapshot of(OpeningHours h) {
        return new Snapshot()
                .value("Open", h.getOpen())
                .value("Close", h.getClose())
                .value("Kitchen open", h.getKitchenOpen())
                .value("Kitchen close", h.getKitchenClose());
    }
}
