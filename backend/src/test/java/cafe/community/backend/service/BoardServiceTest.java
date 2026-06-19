package cafe.community.backend.service;

import cafe.community.backend.dto.BoardMemberDto;
import cafe.community.backend.dto.BoardMemberRequest;
import cafe.community.backend.dto.BoardTermDto;
import cafe.community.backend.dto.BoardTermRequest;
import cafe.community.backend.repository.BoardMemberRepository;
import cafe.community.backend.repository.BoardTermRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BoardServiceTest {

    @Autowired BoardService service;
    @Autowired BoardTermRepository termRepo;
    @Autowired BoardMemberRepository memberRepo;

    @BeforeEach
    void clean() {
        memberRepo.deleteAll();
        termRepo.deleteAll();
    }

    private BoardTermRequest execReq(String label, boolean current) {
        return new BoardTermRequest(label, "EXECUTIVE", null, current, 0, null, null);
    }

    @Test
    void createTerm_persistsAndReturns() {
        BoardTermDto dto = service.createTerm(execReq("2024-2025", true));
        assertThat(dto.id()).isNotNull();
        assertThat(dto.label()).isEqualTo("2024-2025");
        assertThat(dto.type()).isEqualTo("EXECUTIVE");
        assertThat(dto.bar()).isNull();
        assertThat(dto.current()).isTrue();
    }

    @Test
    void updateTerm_changesFields() {
        BoardTermDto created = service.createTerm(execReq("Old", false));
        BoardTermDto updated = service.updateTerm(created.id(), execReq("New", true));
        assertThat(updated.label()).isEqualTo("New");
        assertThat(updated.current()).isTrue();
    }

    @Test
    void deleteTerm_removesFromDb() {
        BoardTermDto created = service.createTerm(execReq("To delete", false));
        service.deleteTerm(created.id());
        assertThat(termRepo.findById(created.id())).isEmpty();
    }

    @Test
    void createMember_appearsInGetAll() {
        BoardTermDto term = service.createTerm(execReq("2024-2025", true));
        BoardMemberDto member = service.createMember(term.id(),
                new BoardMemberRequest("Alice", "President", null, 0));

        assertThat(member.name()).isEqualTo("Alice");
        assertThat(member.role()).isEqualTo("President");

        var all = service.getAll();
        assertThat(all).hasSize(1);
        assertThat(all.get(0).members()).hasSize(1);
        assertThat(all.get(0).members().get(0).name()).isEqualTo("Alice");
    }

    @Test
    void deleteMember_removedFromTerm() {
        BoardTermDto term = service.createTerm(execReq("2024-2025", true));
        BoardMemberDto member = service.createMember(term.id(),
                new BoardMemberRequest("Bob", "Treasurer", null, 0));
        service.deleteMember(member.id());

        assertThat(memberRepo.findById(member.id())).isEmpty();
    }

    @Test
    void getAll_orderedBySortOrder() {
        service.createTerm(new BoardTermRequest("B", "EXECUTIVE", "HUBBLE", false, 2, null, null));
        service.createTerm(new BoardTermRequest("A", "EXECUTIVE", null, true, 1, null, null));
        var all = service.getAll();
        assertThat(all.get(0).label()).isEqualTo("A");
        assertThat(all.get(1).label()).isEqualTo("B");
    }

    @Test
    void supervisoryTermScoped() {
        BoardTermDto dto = service.createTerm(
                new BoardTermRequest("Supervisory 2024", "SUPERVISORY", "HUBBLE", true, 0, null, null));
        assertThat(dto.type()).isEqualTo("SUPERVISORY");
        assertThat(dto.bar()).isEqualTo("HUBBLE");
    }
}
