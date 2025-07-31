package org.example.websocketapp.service;

import lombok.RequiredArgsConstructor;
import org.example.websocketapp.model.event.RegisterUserEvent;
import org.example.websocketapp.model.event.UnregisterUserEvent;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

//Simple implementation of user service, preferably database.
@Service
@RequiredArgsConstructor
public class UserService {
    private final Set<String> activeUsers = ConcurrentHashMap.newKeySet();
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void registerUserEvent(RegisterUserEvent event) {
        String username = event.getUsername();
        if (username == null || username.trim().isEmpty()) {
            throw new MessageDeliveryException("Username is required!");
        }
        if (!activeUsers.add(username.trim())) {
            throw new MessageDeliveryException("Username is taken!");
        }
        notifyOfActiveUsers();
    }

    @EventListener
    public void unregisterUserEvent(UnregisterUserEvent event) {
        activeUsers.remove(event.getUsername());
        notifyOfActiveUsers();
    }

    private void notifyOfActiveUsers() {
        messagingTemplate.convertAndSend("/topic/active-users", activeUsers);
    }

    public Set<String> getActiveUsers() {
        return Collections.unmodifiableSet(activeUsers).stream()
                .sorted()
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
