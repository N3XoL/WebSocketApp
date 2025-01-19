package pl.kurs.websocketapp.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import org.springframework.web.util.HtmlUtils;
import pl.kurs.websocketapp.model.PrivateMessage;
import pl.kurs.websocketapp.model.PublicMessage;
import pl.kurs.websocketapp.model.OutputMessage;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Controller
@RequiredArgsConstructor
public class WebSocketController {
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public OutputMessage sendMessage(PublicMessage publicMessage) {
        return new OutputMessage(
                publicMessage.getFrom(),
                publicMessage.getText(),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"))
        );
    }

    @MessageMapping("/private-chat")
    @SendToUser("/topic/private-message")
    public OutputMessage sendPrivateMessage(PrivateMessage privateMessage) {
        OutputMessage messageOutput =  new OutputMessage(
                HtmlUtils.htmlEscape(privateMessage.getFrom()),
                HtmlUtils.htmlEscape(privateMessage.getText()),
                LocalDateTime.now().toString()
        );

        messagingTemplate.convertAndSendToUser(
               privateMessage.getTo(),
               "/topic/private-message",
               messageOutput
        );
        return messageOutput;
    }
}
