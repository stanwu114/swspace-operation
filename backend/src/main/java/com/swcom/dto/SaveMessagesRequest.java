package com.swcom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveMessagesRequest {

    private String moduleName;

    private List<RawMessage> messages;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RawMessage {
        private String role;
        private String content;
    }
}
