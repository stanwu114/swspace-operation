package com.swcom.controller;

import com.swcom.dto.ApiResponse;
import com.swcom.service.FileConversionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "File", description = "File conversion and access APIs")
public class FileController {

    private final FileConversionService fileConversionService;

    @PostMapping("/pdf-to-image")
    @Operation(summary = "Convert PDF to image", description = "Convert the first page of a PDF file to PNG image")
    public ResponseEntity<ApiResponse<Map<String, String>>> pdfToImage(@RequestBody Map<String, String> request) throws IOException {
        String filePath = request.get("filePath");
        if (filePath == null || filePath.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.badRequest("filePath is required"));
        }

        String imagePath = fileConversionService.convertPdfToImage(filePath);
        return ResponseEntity.ok(ApiResponse.success(Map.of("imagePath", imagePath)));
    }

    @GetMapping("/base64")
    @Operation(summary = "Get file as base64", description = "Read a file and return as base64 data URL")
    public ResponseEntity<ApiResponse<Map<String, String>>> getBase64(@RequestParam String path) throws IOException {
        if (path == null || path.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.badRequest("path parameter is required"));
        }

        String base64 = fileConversionService.getFileAsBase64(path);
        return ResponseEntity.ok(ApiResponse.success(Map.of("base64", base64)));
    }

    @PostMapping(value = "/process-for-vision", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload and process file for Vision API",
            description = "Upload a file (image or PDF), persist original, convert to image if needed, return base64 + savedPath")
    public ResponseEntity<ApiResponse<Map<String, String>>> processForVision(
            @RequestParam("file") MultipartFile file) throws IOException {
        Map<String, String> result = fileConversionService.processUploadForVision(file);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
