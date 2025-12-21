package com.littleescape.media.service;

import com.littleescape.media.dto.MediaDtos;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class MediaService {

    public MediaDtos.PresignResponse presign(MediaDtos.PresignRequest req) {
        // TODO: S3 presigned url로 교체
        List<MediaDtos.PresignItem> items = new ArrayList<>();
        for (int i = 0; i < req.count(); i++) {
            String key = "uploads/" + UUID.randomUUID();
            items.add(new MediaDtos.PresignItem("https://example.com/upload-placeholder", key));
        }
        return new MediaDtos.PresignResponse(items);
    }
}