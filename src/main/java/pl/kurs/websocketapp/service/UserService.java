package pl.kurs.websocketapp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

//Simple implementation of user service, preferably database.
@Service
@RequiredArgsConstructor
public class UserService {
    private final Set<String> activeUsers = ConcurrentHashMap.newKeySet();

    public boolean addUser(String username) {
        return activeUsers.add(username);
    }

    public void removeUser(String username) {
        activeUsers.remove(username);
    }
}
