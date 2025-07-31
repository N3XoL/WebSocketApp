package org.example.websocketapp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.websocketapp.model.ChatStatus;
import org.example.websocketapp.model.OutputMessage;
import org.example.websocketapp.model.PrivateChatInvite;
import org.example.websocketapp.model.PrivateMessage;
import org.example.websocketapp.model.PublicMessage;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketService {
    private final SimpMessagingTemplate messagingTemplate;
    private final Map<String, String> usersInPrivateChat = new ConcurrentHashMap<>();

    public OutputMessage sendToUser(PrivateMessage privateMessage) {
        OutputMessage messageOutput = new OutputMessage(
                HtmlUtils.htmlEscape(privateMessage.getFrom()),
                HtmlUtils.htmlEscape(privateMessage.getText()),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm")),
                privateMessage.getImageData()
        );

        messagingTemplate.convertAndSendToUser(
                privateMessage.getTo(),
                "/queue/private",
                messageOutput
        );

        return messageOutput;
    }

    public OutputMessage sendPublicMessage(PublicMessage publicMessage) {
        return new OutputMessage(
                HtmlUtils.htmlEscape(publicMessage.getFrom()),
                HtmlUtils.htmlEscape(publicMessage.getText()),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm")),
                null
        );
    }

    public void handlePrivateChatInvite(PrivateChatInvite privateChatInvite) {
        if (usersInPrivateChat.containsKey(privateChatInvite.getFrom()) ||
                usersInPrivateChat.containsKey(privateChatInvite.getTo()) ||
                usersInPrivateChat.containsValue(privateChatInvite.getFrom()) ||
                usersInPrivateChat.containsValue(privateChatInvite.getTo())) {
            messagingTemplate.convertAndSendToUser(
                    privateChatInvite.getFrom(),
                    "/queue/private/response",
                    new ChatStatus(privateChatInvite.getFrom(), privateChatInvite.getTo(), "BUSY")
            );
        } else {
            messagingTemplate.convertAndSendToUser(
                    privateChatInvite.getTo(),
                    "/queue/private/invite",
                    privateChatInvite.getFrom()
            );
        }
    }

    public ChatStatus handlePrivateChatStatusResponse(ChatStatus chatStatus) {
        if (chatStatus.getStatus().equals("ACCEPT")) {
            usersInPrivateChat.put(chatStatus.getFrom(), chatStatus.getTo());
        } else if (chatStatus.getStatus().equals("DISCONNECT")) {
            usersInPrivateChat.entrySet()
                    .removeIf(entry -> entry.getValue().equals(chatStatus.getTo()) ||
                            entry.getValue().equals(chatStatus.getFrom()));
        }
        messagingTemplate.convertAndSendToUser(
                chatStatus.getTo(),
                "/queue/private/response",
                chatStatus
        );
        return chatStatus;
    }
}
