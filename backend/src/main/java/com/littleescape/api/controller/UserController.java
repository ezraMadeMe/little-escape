package com.littleescape.api.controller;

import com.littleescape.api.domain.User;
import com.littleescape.api.dto.UserDto;
import com.littleescape.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal String oauthId) {
        if (oauthId == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository.findByOauthId(oauthId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(UserDto.from(user));
    }
}
