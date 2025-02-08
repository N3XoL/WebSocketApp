package pl.kurs.websocketapp.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import pl.kurs.websocketapp.model.ChatStatus;
import pl.kurs.websocketapp.model.OutputMessage;
import pl.kurs.websocketapp.model.PrivateChatInvite;
import pl.kurs.websocketapp.model.PrivateMessage;
import pl.kurs.websocketapp.model.PublicMessage;
import pl.kurs.websocketapp.service.UserService;
import pl.kurs.websocketapp.service.WebSocketService;

import java.util.Set;

@Controller
@RequiredArgsConstructor
public class WebSocketController {
    private final WebSocketService webSocketService;
    private final UserService userService;

    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public OutputMessage sendPublicMessage(PublicMessage publicMessage) {
        return webSocketService.sendPublicMessage(publicMessage);
    }

    @MessageMapping("/private")
    @SendToUser("/queue/private")
    public OutputMessage sendPrivateMessage(PrivateMessage privateMessage) {
        return webSocketService.sendToUser(privateMessage);
    }

    @MessageMapping("/active-users")
    @SendTo("/topic/active-users")
    public Set<String> getActiveUsers() {
        return userService.getActiveUsers();
    }

    @MessageMapping("/private/invite")
    public void handlePrivateChatInvite(PrivateChatInvite privateChatInvite) {
        webSocketService.handlePrivateChatInvite(privateChatInvite);
    }

    @MessageMapping("/private/response")
    @SendToUser("/queue/private/response")
    private ChatStatus handlePrivateChatInviteResponse(ChatStatus chatStatus) {
        return webSocketService.handlePrivateChatStatusResponse(chatStatus);
    }
}