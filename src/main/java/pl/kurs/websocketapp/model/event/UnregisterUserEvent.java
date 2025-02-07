package pl.kurs.websocketapp.model.event;

import lombok.Data;

@Data
public class UnregisterUserEvent {
    private final String username;
}
