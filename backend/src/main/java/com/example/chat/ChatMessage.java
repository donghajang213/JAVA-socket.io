package com.example.chat;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatMessage {
    private String type; // "CHAT", "JOIN", "LEAVE"
    private String sender;
    private String content;
    private String roomId;
    private String receiver; // 수신자 (1:1 채팅용)


    public ChatMessage() {}
    // getters & setters 생략 (Lombok 쓰셔도 됩니다)
}
