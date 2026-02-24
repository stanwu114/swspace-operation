package com.swcom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDocumentDTO {
    private UUID id;
    private UUID projectId;
    private String documentName;
    private String filePath;
    private String fileType;
    private Long fileSize;
    private UUID uploaderId;
    private String uploaderName;
    private LocalDateTime uploadTime;
}
