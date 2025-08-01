package org.example.websocketapp.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class OutputMessage {
    private String from;
    private String text;
    private String time;
    private String imageData;
}
