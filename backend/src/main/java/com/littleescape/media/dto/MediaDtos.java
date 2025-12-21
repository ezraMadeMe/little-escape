package com.littleescape.media.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public class MediaDtos {

    public record PresignRequest(
            @NotBlank String contentType,
            @Min(1) int count
    ) {}

    public record PresignItem(String uploadUrl, String fileKey) {}

    public record PresignResponse(List<PresignItem> items) {}
}