package pl.kurs.websocketapp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;
import pl.kurs.websocketapp.model.ChatStatus;
import pl.kurs.websocketapp.model.OutputMessage;
import pl.kurs.websocketapp.model.PrivateChatInvite;
import pl.kurs.websocketapp.model.PrivateMessage;
import pl.kurs.websocketapp.model.PublicMessage;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketService {
    private final SimpMessagingTemplate messagingTemplate;
    private final Set<String> usersInPrivateChat = ConcurrentHashMap.newKeySet();

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
        if (usersInPrivateChat.contains(privateChatInvite.getFrom()) || usersInPrivateChat.contains(privateChatInvite.getTo())) {
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
            usersInPrivateChat.add(chatStatus.getFrom());
            usersInPrivateChat.add(chatStatus.getTo());
        } else if (chatStatus.getStatus().equals("DISCONNECT")) {
            usersInPrivateChat.remove(chatStatus.getFrom());
            usersInPrivateChat.remove(chatStatus.getTo());
        }
        messagingTemplate.convertAndSendToUser(
                chatStatus.getTo(),
                "/queue/private/response",
                chatStatus
        );
        return chatStatus;
    }
}
