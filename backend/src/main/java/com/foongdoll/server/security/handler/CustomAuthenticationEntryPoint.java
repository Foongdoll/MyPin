package com.foongdoll.server.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {

        // ★ 예외 응답에도 CORS 헤더 강제 부착
        applyCorsHeaders(request, response);

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
        response.setContentType("application/json;charset=UTF-8");

        Map<String, Object> body = new HashMap<>();
        body.put("status", 401);
        body.put("error", "Unauthorized");
        body.put("message", "인증이 필요합니다."); // 원하면 "TOKEN_EXPIRED" 같은 코드도 추가
        body.put("path", request.getRequestURI());

        response.getWriter().write(objectMapper.writeValueAsString(body));
        response.getWriter().flush();
    }

    private void applyCorsHeaders(HttpServletRequest req, HttpServletResponse res) {
        String origin = req.getHeader("Origin");
        if (origin != null && !res.containsHeader("Access-Control-Allow-Origin")) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Vary", "Origin");
            res.setHeader("Access-Control-Allow-Credentials", "true"); // 쿠키/자격증명 쓰면 필수
            res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type,X-Requested-With,Accept,Origin");
            res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        }
    }
}
