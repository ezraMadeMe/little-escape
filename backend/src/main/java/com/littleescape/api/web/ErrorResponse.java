package com.littleescape.api.web;

import java.time.Instant;

public record ErrorResponse(
    String message,
    String code,
    Instant timestamp
) {}
