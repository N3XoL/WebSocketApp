package pl.kurs.websocketapp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.stereotype.Service;
import pl.kurs.websocketapp.model.event.RegisterUserEvent;
import pl.kurs.websocketapp.model.event.UnregisterUserEvent;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

//Simple implementation of user service, preferably database.
@Service
@RequiredArgsConstructor
public class UserService {
    private final Set<String> activeUsers = ConcurrentHashMap.newKeySet();

    @EventListener
    public void registerUserEvent(RegisterUserEvent event) {
        String username = event.getUsername();
        if (username == null || username.trim().isEmpty()) {
            throw new MessageDeliveryException("Username is required!");
        }
        if (!activeUsers.add(username.trim())) {
            throw new MessageDeliveryException("Username is taken!");
        }
    }

    @EventListener
    public void unregisterUserEvent(UnregisterUserEvent event) {
        activeUsers.remove(event.getUsername());
    }

    public Set<String> getActiveUsers() {
        return Collections.unmodifiableSet(activeUsers);
    }
}
