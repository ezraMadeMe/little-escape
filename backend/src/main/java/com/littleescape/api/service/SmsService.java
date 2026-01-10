package com.littleescape.api.service;

import lombok.extern.slf4j.Slf4j;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.response.SingleMessageSentResponse;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class SmsService {

    private final DefaultMessageService messageService;
    private final String senderNumber;

    public SmsService(
            @Value("${coolsms.api-key}") String apiKey,
            @Value("${coolsms.api-secret}") String apiSecret,
            @Value("${coolsms.sender-number}") String senderNumber
    ) {
        // CoolSMS API 초기화
        this.messageService = NurigoApp.INSTANCE.initialize(apiKey, apiSecret, "https://api.coolsms.co.kr");
        this.senderNumber = senderNumber;
        log.info("=== CoolSMS 서비스 초기화 완료 ===");
    }

    /**
     * 약속 리마인더 SMS 발송
     *
     * @param toPhoneNumber 수신자 전화번호
     * @param nickname 사용자 닉네임
     * @param missionTitle 미션 제목
     * @param scheduledAt 약속 시간
     */
    public void sendReminderSms(String toPhoneNumber, String nickname, String missionTitle, LocalDateTime scheduledAt) {
        log.info("=== SMS 발송 시작 ===");
        log.info("수신자: {}, 닉네임: {}, 미션: {}, 예정시간: {}", toPhoneNumber, nickname, missionTitle, scheduledAt);

        try {
            // 전화번호에서 하이픈(-) 제거
            String cleanedPhoneNumber = toPhoneNumber.replaceAll("-", "");

            // 시간 포맷팅
            String formattedTime = scheduledAt.format(DateTimeFormatter.ofPattern("MM월 dd일 HH시 mm분"));

            // 메시지 내용 구성
            String messageText = String.format(
                    "[작은 일탈] %s님, 내일 %s에 약속이 있어요! (%s) 장소는 오늘 밤 자정에 공개됩니다.",
                    nickname,
                    formattedTime,
                    missionTitle
            );

            // 메시지 객체 생성
            Message message = new Message();
            message.setFrom(senderNumber);
            message.setTo(cleanedPhoneNumber);
            message.setText(messageText);

            log.info("SMS 메시지 내용: {}", messageText);

            // SMS 발송
            SingleMessageSentResponse response = this.messageService.sendOne(new SingleMessageSendingRequest(message));

            log.info("=== SMS 발송 성공 ===");
            log.info("Message ID: {}, Status: {}", response.getMessageId(), response.getStatusCode());

        } catch (Exception e) {
            log.error("SMS 발송 실패: {}", e.getMessage(), e);
            throw new RuntimeException("SMS 발송 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * 매직 링크 SMS 발송
     *
     * @param toPhoneNumber 수신자 전화번호
     * @param magicLink 매직 링크 URL
     */
    public void sendMagicLinkSms(String toPhoneNumber, String magicLink) {
        log.info("=== 매직 링크 SMS 발송 시작 ===");
        log.info("수신자: {}, 링크: {}", toPhoneNumber, magicLink);

        try {
            // 전화번호에서 하이픈(-) 제거
            String cleanedPhoneNumber = toPhoneNumber.replaceAll("-", "");

            // 메시지 내용 구성
            String messageText = String.format(
                    "[작은 일탈] 쉼이 필요하신가요? 링크를 눌러 바로 예약하세요: %s",
                    magicLink
            );

            // 메시지 객체 생성
            Message message = new Message();
            message.setFrom(senderNumber);
            message.setTo(cleanedPhoneNumber);
            message.setText(messageText);

            log.info("SMS 메시지 내용: {}", messageText);

            // SMS 발송
            SingleMessageSentResponse response = this.messageService.sendOne(new SingleMessageSendingRequest(message));

            log.info("=== 매직 링크 SMS 발송 성공 ===");
            log.info("Message ID: {}, Status: {}", response.getMessageId(), response.getStatusCode());

        } catch (Exception e) {
            log.error("매직 링크 SMS 발송 실패: {}", e.getMessage(), e);
            throw new RuntimeException("매직 링크 SMS 발송 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * 범용 SMS 발송
     *
     * @param toPhoneNumber 수신자 전화번호
     * @param messageText 발송할 메시지 내용
     */
    public void sendSms(String toPhoneNumber, String messageText) {
        log.info("=== SMS 발송 시작 ===");
        log.info("수신자: {}, 메시지: {}", toPhoneNumber, messageText);

        try {
            // 전화번호에서 하이픈(-) 제거
            String cleanedPhoneNumber = toPhoneNumber.replaceAll("-", "");

            // 메시지 객체 생성
            Message message = new Message();
            message.setFrom(senderNumber);
            message.setTo(cleanedPhoneNumber);
            message.setText(messageText);

            // SMS 발송
            SingleMessageSentResponse response = this.messageService.sendOne(new SingleMessageSendingRequest(message));

            log.info("=== SMS 발송 성공 ===");
            log.info("Message ID: {}, Status: {}", response.getMessageId(), response.getStatusCode());

        } catch (Exception e) {
            log.error("SMS 발송 실패: {}", e.getMessage(), e);
            throw new RuntimeException("SMS 발송 중 오류가 발생했습니다.", e);
        }
    }
}
