package com.foongdoll.server.note.service;

import com.foongdoll.server.note.model.Dtos;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class NoteAssetService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "gif", "webp", "svg");

    private final Path uploadDirectory;
    private final String assetBaseUri;
    private final long maxFileSize;

    public NoteAssetService(
            @Value("${app.note.upload-dir:uploads/note}") String uploadDir,
            @Value("${app.note.asset-base-uri:/uploads/note}") String assetBaseUri,
            @Value("${app.note.asset-max-size-bytes:5242880}") long maxFileSize
    ) {
        try {
            this.uploadDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(this.uploadDirectory);
        } catch (IOException e) {
            throw new IllegalStateException("이미지 업로드 경로를 초기화할 수 없습니다.", e);
        }
        this.assetBaseUri = assetBaseUri.endsWith("/") ? assetBaseUri.substring(0, assetBaseUri.length() - 1) : assetBaseUri;
        this.maxFileSize = maxFileSize;
    }

    public Dtos.AssetUploadResponse uploadImage(MultipartFile file) {
        validate(file);
        String extension = resolveExtension(file.getOriginalFilename());
        String filename = System.currentTimeMillis() + "-" + UUID.randomUUID() + (extension.isBlank() ? "" : "." + extension);
        Path target = uploadDirectory.resolve(filename);
        try {
            file.transferTo(target);
        } catch (IOException e) {
            throw new IllegalStateException("이미지 업로드에 실패했습니다.", e);
        }

        String url = assetBaseUri + "/" + filename;
        return Dtos.AssetUploadResponse.builder()
                .url(url)
                .filename(filename)
                .size(file.getSize())
                .contentType(file.getContentType())
                .build();
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 없습니다.");
        }
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("파일은 최대 " + (maxFileSize / (1024 * 1024)) + "MB 까지만 업로드할 수 있습니다.");
        }
        String extension = resolveExtension(file.getOriginalFilename());
        String contentType = file.getContentType();
        if (!ALLOWED_EXTENSIONS.contains(extension) || contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드할 수 있습니다.");
        }
    }

    private static String resolveExtension(String filename) {
        if (!StringUtils.hasText(filename) || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
