package pl.kurs.websocketapp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;

@Service
@RequiredArgsConstructor
public class UserEventPublisher {
    private final SimpMessagingTemplate messagingTemplate;
    private final UserService userService;

    @EventListener
    public void handleUserListUpdateEvent(SessionConnectedEvent ignored) {
        messagingTemplate.convertAndSend("/topic/active-users", userService.getActiveUsers());
    }
}
