package pl.kurs.websocketapp.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import pl.kurs.websocketapp.model.OutputMessage;
import pl.kurs.websocketapp.model.PrivateMessage;
import pl.kurs.websocketapp.model.PublicMessage;
import pl.kurs.websocketapp.service.UserService;
import pl.kurs.websocketapp.service.WebSocketService;

import java.security.Principal;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class WebSocketController {
    private final WebSocketService webSocketService;
    private final UserService userService;

    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public OutputMessage sendPublicMessage(PublicMessage publicMessage) {
        return webSocketService.send(publicMessage);
    }

    @MessageMapping("/private")
    @SendToUser("/queue/private")
    public OutputMessage sendPrivateMessage(PrivateMessage privateMessage) {
        return webSocketService.sendToUser(privateMessage);
    }

    @MessageMapping("/active-users")
    @SendToUser("/queue/active-users")
    public List<String> getActiveUsers(Principal principal) {
        return userService.getActiveUsers().stream()
                .sorted()
                .filter(username -> !username.equals(principal.getName()))
                .toList();
    }
}