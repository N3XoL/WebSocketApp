package pl.kurs.websocketapp.model;

import lombok.Data;

@Data
public class PrivateChatInvite {
    private String from;
    private String to;
}
