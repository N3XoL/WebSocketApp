package org.example.websocketapp.model.event;

import lombok.Data;

@Data
public class RegisterUserEvent {
    private final String username;
}
