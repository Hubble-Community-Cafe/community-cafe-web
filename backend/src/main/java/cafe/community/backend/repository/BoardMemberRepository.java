package cafe.community.backend.repository;

import cafe.community.backend.model.BoardMember;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardMemberRepository extends JpaRepository<BoardMember, Long> {
}
