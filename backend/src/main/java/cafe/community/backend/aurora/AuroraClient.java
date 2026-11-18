package cafe.community.backend.aurora;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The calls the website makes to Aurora, the narrowcasting system behind the bar's screens.
 * {@link HttpAuroraClient} makes them for real; under the {@code e2e} profile
 * {@link FakeAuroraClient} answers them in memory, so the screen panel works without Aurora.
 */
public interface AuroraClient {

    /**
     * Whether Aurora is configured at all. False in local dev unless wired up, which lets the admin
     * show a clear "not configured" state instead of failing calls.
     */
    boolean isEnabled();

    List<Aurora.ScreenHandler> getScreenHandlers();

    /**
     * Every screen Aurora knows about, flattened across all handlers and de-duplicated by id.
     * Aurora exposes no plain screen list to an integration user, so this is the way to enumerate
     * them.
     */
    default List<Aurora.Screen> getScreens() {
        Map<Long, Aurora.Screen> byId = new LinkedHashMap<>();
        for (Aurora.ScreenHandler handler : getScreenHandlers()) {
            if (handler.entities() == null) {
                continue;
            }
            for (Aurora.Screen screen : handler.entities()) {
                byId.putIfAbsent(screen.id(), screen);
            }
        }
        return new ArrayList<>(byId.values());
    }

    /**
     * Move one screen onto the named handler. Aurora matches {@code handlerName} against the
     * handler's class name and answers 400 if it does not resolve.
     */
    void setScreenHandler(long screenId, String handlerName);

    List<Aurora.Poster> getPosters();

    Aurora.StaticPosterState getStaticPosterState();

    void showStaticPoster(long posterId);

    Aurora.CreatedPosterRequest createPosterRequest(Aurora.PosterRequest request);
}
