package pl.kurs.websocketapp.model;

import lombok.Data;

@Data
public class ChatStatus {
    private String from;
    private String to;
    private String status;
}
