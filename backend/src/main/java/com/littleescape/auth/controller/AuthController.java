package com.littleescape.auth.controller;

import com.littleescape.common.api.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @PostMapping("/login/kakao")
    public ApiResponse<Object> loginKakao() {
        // TODO: 카카오 OAuth 연동 + JWT 발급
        return ApiResponse.ok(null);
    }
}