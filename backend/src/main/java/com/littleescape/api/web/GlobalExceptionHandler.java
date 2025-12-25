package com.littleescape.api.web;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException e) {
    // 핵심: 원인 로그
    log.warn("Bad JSON / type mismatch: {}", e.getMessage(), e);

    // enum mismatch면 allowed values도 같이 보여주기 좋음
    Throwable c = e.getCause();
    if (c instanceof InvalidFormatException ife) {
      return ResponseEntity.badRequest()
          .body(new ErrorResponse(
              "Invalid value: " + ife.getValue() + " for " + ife.getPathReference(),
              "BAD_REQUEST",
              Instant.now()
          ));
    }
    return ResponseEntity.badRequest()
        .body(new ErrorResponse("Bad request body", "BAD_REQUEST", Instant.now()));
  }
  
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ErrorResponse> handleIllegal(IllegalArgumentException e) {
    return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage(), "BAD_REQUEST", Instant.now()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValid(MethodArgumentNotValidException e) {
    return ResponseEntity.badRequest().body(new ErrorResponse("Validation failed", "VALIDATION", Instant.now()));
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ErrorResponse> handleCve(ConstraintViolationException e) {
    return ResponseEntity.badRequest().body(new ErrorResponse("Validation failed", "VALIDATION", Instant.now()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleEtc(Exception e) {
    log.error("Unhandled exception", e);
    return ResponseEntity.internalServerError()
        .body(new ErrorResponse("Internal error", "INTERNAL", Instant.now()));
  }
}
