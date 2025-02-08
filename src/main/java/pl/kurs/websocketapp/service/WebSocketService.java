package pl.kurs.websocketapp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;
import pl.kurs.websocketapp.model.OutputMessage;
import pl.kurs.websocketapp.model.PrivateMessage;
import pl.kurs.websocketapp.model.PublicMessage;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketService {
    private final SimpMessagingTemplate messagingTemplate;

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

    public OutputMessage send(PublicMessage publicMessage) {
        return new OutputMessage(
                HtmlUtils.htmlEscape(publicMessage.getFrom()),
                HtmlUtils.htmlEscape(publicMessage.getText()),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm")),
                null
        );
    }
}
