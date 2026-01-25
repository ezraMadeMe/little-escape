package com.littleescape.api.service;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.Comment;
import com.littleescape.api.domain.User;
import com.littleescape.api.dto.CommentResponse;
import com.littleescape.api.repository.AppointmentRepository;
import com.littleescape.api.repository.CommentRepository;
import com.littleescape.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public CommentResponse createComment(Long userId, Long appointmentId, String content) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("약속을 찾을 수 없습니다."));

        Comment comment = new Comment(content, user, appointment);
        Comment savedComment = commentRepository.save(comment);

        return CommentResponse.from(savedComment, userId);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long userId, Long appointmentId) {
        return commentRepository.findByAppointmentIdOrderByCreatedAtDesc(appointmentId)
                .stream()
                .map(comment -> CommentResponse.from(comment, userId))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 댓글만 삭제할 수 있습니다.");
        }

        commentRepository.delete(comment);
    }
}
