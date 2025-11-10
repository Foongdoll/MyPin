package com.foongdoll.server.auth.service;

import com.foongdoll.server.auth.dto.JoinRequest;
import com.foongdoll.server.auth.dto.LoginRequest;
import com.foongdoll.server.auth.dto.LoginResponse;
import com.foongdoll.server.auth.dto.RefreshResponse;
import com.foongdoll.server.auth.dto.UserSummary;
import com.foongdoll.server.security.jwt.JwtUtils;
import com.foongdoll.server.user.domain.User;
import com.foongdoll.server.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public LoginResponse join(JoinRequest request) {
        if (userRepository.existsByUserId(request.getUserId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        User user = userRepository.save(
                User.builder()
                        .userId(request.getUserId().trim())
                        .password(passwordEncoder.encode(request.getPassword()))
                        .name(request.getName().trim())
                        .email(StringUtils.hasText(request.getEmail()) ? request.getEmail().trim() : null)
                        .build()
        );

        String accessToken = jwtUtils.generateAccessToken(user.getUserId());
        String refreshToken = refreshTokenService.issueToken(user);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserSummary.from(user))
                .build();
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUserId(), request.getUserPw())
        );

        String username = authentication.getName();
        User user = userRepository.findByUserId(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        String accessToken = jwtUtils.generateAccessToken(user.getUserId());
        String refreshToken = refreshTokenService.issueToken(user);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserSummary.from(user))
                .build();
    }

    @Transactional
    public RefreshResponse refresh(String refreshToken) {
        User user = refreshTokenService.validateAndGetUser(refreshToken);
        String newAccessToken = jwtUtils.generateAccessToken(user.getUserId());
        return RefreshResponse.builder()
                .accessToken(newAccessToken)
                .build();
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.revokeToken(refreshToken);
    }
}
