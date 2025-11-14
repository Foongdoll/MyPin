package com.foongdoll.server.websocket.config;

import com.foongdoll.server.security.jwt.JwtUtils;
import com.foongdoll.server.user.domain.User;
import com.foongdoll.server.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        String token = resolveToken(request);
        if (token == null) {
            log.warn("WebSocket token missing");
            return false;
        }

        try {
            String username = jwtUtils.extractUsername(token);
            User user = userRepository.findByUserId(username)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            attributes.put("userId", user.getId());
            attributes.put("userName", user.getName());
            return true;
        } catch (Exception e) {
            log.warn("Invalid WebSocket token", e);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // no-op
    }

    private String resolveToken(ServerHttpRequest request) {
        HttpHeaders headers = request.getHeaders();
        List<String> authorization = headers.get(HttpHeaders.AUTHORIZATION);
        if (authorization != null) {
            Optional<String> bearer = authorization.stream()
                    .filter(h -> h.startsWith("Bearer "))
                    .findFirst();
            if (bearer.isPresent()) {
                return bearer.get().substring(7);
            }
        }

        URI uri = request.getURI();
        String query = uri.getQuery();
        if (query != null) {
            for (String pair : query.split("&")) {
                String[] kv = pair.split("=");
                if (kv.length == 2 && kv[0].equals("token")) {
                    return kv[1];
                }
            }
        }

        if (request instanceof ServletServerHttpRequest servletRequest) {
            String token = servletRequest.getServletRequest().getParameter("token");
            if (token != null) {
                return token;
            }
        }
        return null;
    }
}
