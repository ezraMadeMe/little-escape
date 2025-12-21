package com.littleescape.user.controller;

import com.littleescape.common.api.ApiResponse;
import com.littleescape.user.dto.UserDtos;
import com.littleescape.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ApiResponse<UserDtos.MeResponse> me(@RequestHeader("X-USER-ID") Long userId) {
        return ApiResponse.ok(userService.me(userId));
    }

    @PutMapping("/me/preferences")
    public ApiResponse<Void> updatePreferences(
            @RequestHeader("X-USER-ID") Long userId,
            @Valid @RequestBody UserDtos.UpdatePreferenceRequest req
    ) {
        userService.updatePreferences(userId, req);
        return ApiResponse.ok(null);
    }
}