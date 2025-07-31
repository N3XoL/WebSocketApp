package org.example.websocketapp.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class PrivateMessage {
    private String text;
    private String from;
    private String to;
    private String imageData;
    private String fileName;
}
