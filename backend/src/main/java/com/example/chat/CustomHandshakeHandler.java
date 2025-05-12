package com.example.chat;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

public class CustomHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(ServerHttpRequest request,
                                      WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {
        // nickname 세션에서 꺼내서 Principal 이름으로 사용
        String nickname = (String) attributes.get("nickname");
        if (nickname == null || nickname.trim().isEmpty()) {
            nickname = "anonymous-" + System.currentTimeMillis();
        }

        final String finalName = nickname;
        return () -> finalName; // 람다 방식 Principal 구현
    }
}
