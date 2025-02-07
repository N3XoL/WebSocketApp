package pl.kurs.websocketapp.model.event;

import lombok.Data;

@Data
public class RegisterUserEvent {
    private final String username;
}
