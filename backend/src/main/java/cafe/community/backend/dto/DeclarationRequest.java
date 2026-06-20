package cafe.community.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

/**
 * Hubble "Online Declarations" (e-declaration) request. Multipart (the receipt is required).
 * Amount and IBAN are normalised/validated in the service; here we cover the field shape.
 */
@Data
public class DeclarationRequest {

    @NotBlank
    @Size(max = 200)
    private String fullName;

    @NotBlank
    @Email
    @Size(max = 200)
    private String email;

    @Size(max = 40)
    private String phone;

    @NotBlank
    @Pattern(regexp = "^[A-Za-z]{2}[0-9]{2}[A-Za-z0-9 ]{8,34}$", message = "must be a valid IBAN")
    private String iban;

    @NotBlank
    @Size(max = 20)
    private String dateOfPurchase;

    /** Euro amount as typed (comma or dot decimal); parsed and checked positive in the service. */
    @NotBlank
    @Size(max = 20)
    private String amount;

    @NotBlank
    @Size(max = 100)
    private String category;

    @Size(max = 5000)
    private String description;

    private MultipartFile file;

    private String honeypot;
}
