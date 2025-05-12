package com.example.chat;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class ChatController {

    private final SimpMessagingTemplate template;
    private final Map<String, String> connectedUsers = new ConcurrentHashMap<>();

    public ChatController(SimpMessagingTemplate template) {
        this.template = template;
    }

    @MessageMapping("/chat.join")
    public void join(ChatMessage message, SimpMessageHeaderAccessor accessor) {
        String username = message.getSender();
        String roomId = message.getRoomId();

        accessor.getSessionAttributes().put("username", username);
        accessor.getSessionAttributes().put("roomId", roomId);
        connectedUsers.put(username, roomId);

        message.setType("JOIN");
        message.setContent(username + "님이 입장하셨습니다.");
        template.convertAndSend("/topic/" + roomId, message);

        broadcastUserList(roomId);
    }

    @MessageMapping("/chat.send")
    public void sendMessage(ChatMessage message) {
        if (message.getReceiver() != null && !message.getReceiver().isEmpty()) {
            message.setType("DM");
            // 1:1 쪽지
            template.convertAndSendToUser(message.getReceiver(), "/queue/messages", message);
            template.convertAndSendToUser(message.getSender(), "/queue/messages", message);
        } else {
            // 공용 메시지
            template.convertAndSend("/topic/" + message.getRoomId(), message);
        }
    }
    @MessageMapping("/chat.users")
    public void requestUserList(ChatMessage message) {
        broadcastUserList(message.getRoomId());
    }


    private void broadcastUserList(String roomId) {
        List<String> usersInRoom = connectedUsers.entrySet().stream()
                .filter(e -> e.getValue().equals(roomId))
                .map(Map.Entry::getKey)
                .toList();
        template.convertAndSend("/topic/" + roomId + "/users", usersInRoom);
    }
}
