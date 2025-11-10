package com.foongdoll.server.auth.service;

import com.foongdoll.server.auth.domain.RefreshToken;
import com.foongdoll.server.auth.repository.RefreshTokenRepository;
import com.foongdoll.server.user.domain.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    @Transactional
    public String issueToken(User user) {
        RefreshToken refreshToken = refreshTokenRepository.findByUser(user)
                .map(existing -> {
                    existing.renew(refreshTokenExpirationMs);
                    return existing;
                })
                .orElseGet(() -> RefreshToken.create(user, refreshTokenExpirationMs));
        return refreshTokenRepository.save(refreshToken).getToken();
    }

    @Transactional
    public User validateAndGetUser(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다."));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new IllegalArgumentException("리프레시 토큰이 만료되었습니다.");
        }

        return refreshToken.getUser();
    }

    @Transactional
    public void revokeToken(String token) {
        if (!StringUtils.hasText(token)) {
            return;
        }
        refreshTokenRepository.deleteByToken(token);
    }
}
