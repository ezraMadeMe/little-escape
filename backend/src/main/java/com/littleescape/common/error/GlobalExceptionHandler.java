package com.littleescape.common.error;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    public ResponseEntity<?> handleBiz(BizException e) {
        return ResponseEntity
                .status(e.getErrorCode().status())
                .body(Map.of("code", e.getErrorCode().code(), "message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException e) {
        return ResponseEntity
                .badRequest()
                .body(Map.of("code", ErrorCode.INVALID_REQUEST.code(), "message", "Validation failed"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleAny(Exception e) {
        return ResponseEntity
                .status(ErrorCode.INVALID_REQUEST.status())
                .body(Map.of("code", ErrorCode.INVALID_REQUEST.code(), "message", e.getMessage()));
    }
}