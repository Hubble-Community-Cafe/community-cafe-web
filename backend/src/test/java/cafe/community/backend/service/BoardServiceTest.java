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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
    void reorderTerms_appliesTheGivenOrder() {
        BoardTermDto first = service.createTerm(execReq("2023-2024", false));
        BoardTermDto second = service.createTerm(execReq("2024-2025", true));

        service.reorderTerms(List.of(second.id(), first.id()));

        assertThat(service.getAll()).extracting(BoardTermDto::label)
                .containsExactly("2024-2025", "2023-2024");
    }

    @Test
    void reorderTerms_rejectsAnOrderMissingATerm() {
        BoardTermDto first = service.createTerm(execReq("2023-2024", false));
        service.createTerm(execReq("2024-2025", true));

        assertThatThrownBy(() -> service.reorderTerms(List.of(first.id())))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void reorderMembers_appliesTheGivenOrderWithinTheTerm() {
        BoardTermDto term = service.createTerm(execReq("2024-2025", true));
        BoardMemberDto chair = service.createMember(term.id(), new BoardMemberRequest("Ada", "Chair", null, 0));
        BoardMemberDto treasurer = service.createMember(term.id(), new BoardMemberRequest("Bo", "Treasurer", null, 1));

        service.reorderMembers(term.id(), List.of(treasurer.id(), chair.id()));

        assertThat(service.getAll().get(0).members()).extracting(BoardMemberDto::name)
                .containsExactly("Bo", "Ada");
    }

    @Test
    void createTerm_withoutASortOrder_landsLast() {
        service.createTerm(new BoardTermRequest("2023-2024", "EXECUTIVE", null, false, 2, null, null));

        BoardTermDto appended = service.createTerm(
                new BoardTermRequest("2024-2025", "EXECUTIVE", null, true, null, null, null));

        assertThat(appended.sortOrder()).isEqualTo(3);
    }

    @Test
    void createMember_withoutASortOrder_landsLastInTheTerm() {
        BoardTermDto term = service.createTerm(execReq("2024-2025", true));
        service.createMember(term.id(), new BoardMemberRequest("Ada", "Chair", null, 0));

        BoardMemberDto appended = service.createMember(term.id(),
                new BoardMemberRequest("Bo", "Treasurer", null, null));

        assertThat(appended.sortOrder()).isEqualTo(1);
        assertThat(service.getAll().get(0).members()).extracting(BoardMemberDto::name)
                .containsExactly("Ada", "Bo");
    }

    /** Editing a member must not drag them to the bottom of the term. */
    @Test
    void updateMember_withoutASortOrder_staysPut() {
        BoardTermDto term = service.createTerm(execReq("2024-2025", true));
        BoardMemberDto ada = service.createMember(term.id(), new BoardMemberRequest("Ada", "Chair", null, 0));
        service.createMember(term.id(), new BoardMemberRequest("Bo", "Treasurer", null, 1));

        BoardMemberDto updated = service.updateMember(ada.id(),
                new BoardMemberRequest("Ada Lovelace", "Chair", null, null));

        assertThat(updated.sortOrder()).isZero();
    }

    @Test
    void supervisoryTermScoped() {
        BoardTermDto dto = service.createTerm(
                new BoardTermRequest("Supervisory 2024", "SUPERVISORY", "HUBBLE", true, 0, null, null));
        assertThat(dto.type()).isEqualTo("SUPERVISORY");
        assertThat(dto.bar()).isEqualTo("HUBBLE");
    }
}
