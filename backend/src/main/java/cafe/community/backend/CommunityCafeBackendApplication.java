package cafe.community.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@ConfigurationPropertiesScan
@SpringBootApplication
public class CommunityCafeBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(CommunityCafeBackendApplication.class, args);
    }
}
