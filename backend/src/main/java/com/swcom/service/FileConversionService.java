package com.swcom.service;

import com.swcom.config.StorageConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.*;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class FileConversionService {

    private final StorageConfig storageConfig;

    /**
     * Convert PDF first page to PNG image.
     * @param pdfPath relative path under uploadDir, e.g. "telegram/xxx.pdf"
     * @return relative path of generated PNG under uploadDir, e.g. "temp/xxx.png"
     */
    public String convertPdfToImage(String pdfPath) throws IOException {
        Path absolutePath = resolveAndValidate(pdfPath);

        Path tempDir = Paths.get(storageConfig.getUploadDir(), "temp");
        Files.createDirectories(tempDir);

        String outputName = UUID.randomUUID() + ".png";
        Path outputPath = tempDir.resolve(outputName);

        try (PDDocument document = Loader.loadPDF(absolutePath.toFile())) {
            PDFRenderer renderer = new PDFRenderer(document);
            BufferedImage image = renderer.renderImageWithDPI(0, 200);
            ImageIO.write(image, "PNG", outputPath.toFile());
        }

        log.info("Converted PDF to image: {} -> {}", pdfPath, outputPath);
        return "temp/" + outputName;
    }

    /**
     * Read a file and return its content as a base64 data URL.
     * @param relativePath relative path under uploadDir
     * @return base64 data URL string like "data:image/png;base64,..."
     */
    public String getFileAsBase64(String relativePath) throws IOException {
        Path absolutePath = resolveAndValidate(relativePath);

        long fileSize = Files.size(absolutePath);
        if (fileSize > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File too large: " + fileSize + " bytes (max 10MB)");
        }

        byte[] bytes = Files.readAllBytes(absolutePath);
        String base64 = Base64.getEncoder().encodeToString(bytes);
        String mimeType = Files.probeContentType(absolutePath);
        if (mimeType == null) {
            mimeType = "application/octet-stream";
        }

        return "data:" + mimeType + ";base64," + base64;
    }

    /**
     * Resolve a relative path and validate it stays within uploadDir.
     */
    private Path resolveAndValidate(String relativePath) {
        Path uploadDir = Paths.get(storageConfig.getUploadDir()).toAbsolutePath().normalize();
        Path resolved = uploadDir.resolve(relativePath).normalize();

        if (!resolved.startsWith(uploadDir)) {
            throw new IllegalArgumentException("Invalid file path: path traversal detected");
        }
        if (!Files.exists(resolved)) {
            throw new IllegalArgumentException("File not found: " + relativePath);
        }

        return resolved;
    }

    /**
     * Accept a multipart file upload, persist original file, convert PDF to image if needed,
     * and return base64 data URL + saved file path.
     * @return Map with "base64" (data URL for Vision API) and "savedPath" (relative path under uploadDir)
     */
    public Map<String, String> processUploadForVision(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        long maxSize = 10 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("File too large: " + file.getSize() + " bytes (max 10MB)");
        }

        String contentType = file.getContentType();
        boolean isPdf = "application/pdf".equals(contentType);
        boolean isImage = contentType != null && contentType.startsWith("image/");

        if (!isPdf && !isImage) {
            throw new IllegalArgumentException("Unsupported file type: " + contentType);
        }

        // Persist original file to uploads/web/
        Path uploadDir = Paths.get(storageConfig.getUploadDir()).toAbsolutePath().normalize();
        Path webDir = uploadDir.resolve("web");
        Files.createDirectories(webDir);

        String ext = getExtension(file.getOriginalFilename(), contentType);
        String savedName = UUID.randomUUID() + ext;
        Path savedFilePath = webDir.resolve(savedName);
        file.transferTo(savedFilePath.toFile());
        String savedPath = "web/" + savedName;

        if (isImage) {
            byte[] bytes = Files.readAllBytes(savedFilePath);
            String base64 = Base64.getEncoder().encodeToString(bytes);
            log.info("Saved uploaded image for Vision: {} -> {}", file.getOriginalFilename(), savedPath);
            return Map.of("base64", "data:" + contentType + ";base64," + base64, "savedPath", savedPath);
        }

        // PDF: convert to PNG for Vision API
        Path tempDir = uploadDir.resolve("temp");
        Files.createDirectories(tempDir);
        String outputName = UUID.randomUUID() + ".png";
        Path outputPath = tempDir.resolve(outputName);

        try (PDDocument document = Loader.loadPDF(savedFilePath.toFile())) {
            PDFRenderer renderer = new PDFRenderer(document);
            BufferedImage image = renderer.renderImageWithDPI(0, 200);
            ImageIO.write(image, "PNG", outputPath.toFile());
        }

        byte[] imageBytes = Files.readAllBytes(outputPath);
        String base64 = Base64.getEncoder().encodeToString(imageBytes);
        try { Files.deleteIfExists(outputPath); } catch (IOException ignored) {}

        log.info("Saved uploaded PDF for Vision: {} -> {} (converted to PNG)", file.getOriginalFilename(), savedPath);
        return Map.of("base64", "data:image/png;base64," + base64, "savedPath", savedPath);
    }

    private String getExtension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf("."));
        }
        if ("application/pdf".equals(contentType)) return ".pdf";
        if ("image/jpeg".equals(contentType)) return ".jpg";
        if ("image/png".equals(contentType)) return ".png";
        return "";
    }
}
