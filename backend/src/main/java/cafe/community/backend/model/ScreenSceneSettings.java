package cafe.community.backend.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Which Aurora static poster each scene shows.
 *
 * <p>Aurora gives static posters no name of their own, only an id and the original upload
 * filename, so a scene has to be pinned to a poster id. Keeping that mapping here rather than in
 * an environment variable means the board can re-point a scene after re-uploading a poster
 * without a redeploy.
 *
 * <p>Single row, fixed id 1: there is one Aurora instance and one set of screens.
 */
@Data
@Entity
@Table(name = "screen_scene_settings")
public class ScreenSceneSettings {

    /** The only row's id. */
    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    /** Aurora static poster id shown for {@link ScreenScene#CLOSED}; null until configured. */
    @Column(name = "closed_poster_id")
    private Long closedPosterId;

    /** Aurora static poster id shown for {@link ScreenScene#LAST_CALL}; null until configured. */
    @Column(name = "last_call_poster_id")
    private Long lastCallPosterId;

    /** The configured poster for a scene, or null when the scene needs none or none is set. */
    public Long posterIdFor(ScreenScene scene) {
        return switch (scene) {
            case CLOSED -> closedPosterId;
            case LAST_CALL -> lastCallPosterId;
            case OPEN -> null;
        };
    }
}
