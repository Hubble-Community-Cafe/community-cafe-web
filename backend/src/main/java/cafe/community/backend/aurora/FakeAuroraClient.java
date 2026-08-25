package cafe.community.backend.aurora;

import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * In-memory stand-in for Aurora, active <strong>only</strong> in the {@code e2e} Spring profile.
 *
 * <p>The Playwright suite needs the screen panel to be operable without a real Aurora. Swapping
 * the client keeps that stub out of the HTTP path entirely: no mock container, no security hole
 * for the backend to call itself. The real wire format is covered by {@code AuroraClientTest}
 * against {@code MockRestServiceServer}.
 *
 * <p>Screens and posters mirror the live instance so the suite exercises realistic names.
 */
@Component
@Primary
@Profile("e2e")
public class FakeAuroraClient extends AuroraClient {

    private static final String CAROUSEL = "CarouselPosterHandler";

    private final Map<Long, String> handlerByScreen = new LinkedHashMap<>();
    private final Map<Long, String> screenNames = new LinkedHashMap<>();
    private Long activePosterId;

    public FakeAuroraClient() {
        super(RestClient.builder().build(), false, "", "");
        screenNames.put(1L, "HubbleGeneralScreen");
        screenNames.put(2L, "PlazaScreen");
        screenNames.put(3L, "FoyerScreen");
        reset();
    }

    /**
     * Back to every screen on the carousel with no poster showing. Called by the e2e reset
     * endpoint, because this bean outlives an individual spec.
     */
    public void reset() {
        handlerByScreen.clear();
        screenNames.keySet().forEach(id -> handlerByScreen.put(id, CAROUSEL));
        activePosterId = null;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public List<Aurora.ScreenHandler> getScreenHandlers() {
        Map<String, List<Aurora.Screen>> byHandler = new LinkedHashMap<>();
        byHandler.put(CAROUSEL, new ArrayList<>());
        byHandler.put("StaticPosterHandler", new ArrayList<>());
        handlerByScreen.forEach((id, handler) ->
                byHandler.computeIfAbsent(handler, h -> new ArrayList<>())
                        .add(new Aurora.Screen(id, screenNames.get(id))));

        List<Aurora.ScreenHandler> handlers = new ArrayList<>();
        byHandler.forEach((name, screens) ->
                handlers.add(new Aurora.ScreenHandler("fake-" + name, name, screens)));
        return handlers;
    }

    @Override
    public void setScreenHandler(long screenId, String handlerName) {
        if (!handlerByScreen.containsKey(screenId)) {
            throw new AuroraException("Aurora returned 404");
        }
        handlerByScreen.put(screenId, handlerName);
    }

    @Override
    public List<Aurora.Poster> getStaticPosters() {
        return List.of(
                new Aurora.Poster(3, null, null,
                        new Aurora.PosterFile("/static/local-posters/closed.png", "Closed slide.png"), null),
                new Aurora.Poster(4, null, null,
                        new Aurora.PosterFile("/static/local-posters/last-call.png", "Last Call slide.png"), null));
    }

    @Override
    public Aurora.StaticPosterState getStaticPosterState() {
        if (activePosterId == null) {
            return new Aurora.StaticPosterState(null, true);
        }
        Aurora.Poster active = getStaticPosters().stream()
                .filter(p -> p.id() == activePosterId)
                .findFirst()
                .orElse(null);
        return new Aurora.StaticPosterState(active, true);
    }

    @Override
    public void showStaticPoster(long posterId) {
        this.activePosterId = posterId;
    }
}
