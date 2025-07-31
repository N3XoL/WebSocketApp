package org.example.websocketapp.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChatStatus {
    private String from;
    private String to;
    private String status;
}
