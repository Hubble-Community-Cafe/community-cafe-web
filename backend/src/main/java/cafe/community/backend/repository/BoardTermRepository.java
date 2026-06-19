package cafe.community.backend.repository;

import cafe.community.backend.model.BoardTerm;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoardTermRepository extends JpaRepository<BoardTerm, Long> {

    @EntityGraph(attributePaths = "members")
    List<BoardTerm> findAll(Sort sort);
}
