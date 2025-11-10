package com.foongdoll.server.auth.controller;

import com.foongdoll.server.auth.dto.JoinRequest;
import com.foongdoll.server.auth.dto.LoginRequest;
import com.foongdoll.server.auth.dto.LoginResponse;
import com.foongdoll.server.auth.dto.RefreshRequest;
import com.foongdoll.server.auth.dto.RefreshResponse;
import com.foongdoll.server.auth.service.AuthService;
import com.foongdoll.server.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<LoginResponse>> join(@Valid @RequestBody JoinRequest request) {
        LoginResponse response = authService.join(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshResponse>> refresh(@Valid @RequestBody RefreshRequest request) {
        RefreshResponse response = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
