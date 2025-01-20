package pl.kurs.websocketapp.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import pl.kurs.websocketapp.model.OutputMessage;
import pl.kurs.websocketapp.model.PrivateMessage;
import pl.kurs.websocketapp.model.PublicMessage;
import pl.kurs.websocketapp.service.WebSocketService;

@Controller
@RequiredArgsConstructor
public class WebSocketController {
    private final WebSocketService webSocketService;

    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public OutputMessage sendMessage(PublicMessage publicMessage) {
        return webSocketService.send(publicMessage);
    }

    @MessageMapping("/private-chat")
    @SendToUser("/topic/private-message")
    public OutputMessage sendPrivateMessage(PrivateMessage privateMessage) {
        return webSocketService.sendToUser(privateMessage);
    }
}
