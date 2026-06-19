package cafe.community.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/** Serves uploaded media files from the configured directory at GET /media/**. */
@Configuration
public class MediaConfig implements WebMvcConfigurer {

    @Value("${app.media-dir:/data/media}")
    private String mediaDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = "file:" + Paths.get(mediaDir).toAbsolutePath() + "/";
        registry.addResourceHandler("/media/**")
                .addResourceLocations(location);
    }
}
