package com.littleescape.media.controller;

import com.littleescape.common.api.ApiResponse;
import com.littleescape.media.dto.MediaDtos;
import com.littleescape.media.service.MediaService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping("/presign")
    public ApiResponse<MediaDtos.PresignResponse> presign(@Valid @RequestBody MediaDtos.PresignRequest req) {
        return ApiResponse.ok(mediaService.presign(req));
    }
}