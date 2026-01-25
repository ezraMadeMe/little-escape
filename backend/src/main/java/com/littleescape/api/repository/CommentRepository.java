package com.littleescape.api.repository;

import com.littleescape.api.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByAppointmentIdOrderByCreatedAtDesc(Long appointmentId);
    Long countByAppointmentId(Long appointmentId);
    void deleteByAppointmentId(Long appointmentId);
}
