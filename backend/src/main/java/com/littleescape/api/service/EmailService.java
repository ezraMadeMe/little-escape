package com.littleescape.api.service;

import com.littleescape.api.domain.Appointment;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;

    public void sendReminderEmail(String toEmail, String nickname, String missionTitle, LocalDateTime scheduledAt) {
        log.info("=== 이메일 발송 시작 ===");
        log.info("수신자: {}, 닉네임: {}, 미션: {}, 예정시간: {}", toEmail, nickname, missionTitle, scheduledAt);

        MimeMessage mimeMessage = javaMailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");

            String formattedTime = scheduledAt.format(DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH시 mm분"));
            String subject = "🌿 [작은 일탈] 내일은 나를 위한 시간이 준비되어 있어요.";

            String htmlContent = String.format("""
                <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4A5568;">안녕하세요, %s님!</h2>
                    <p style="font-size: 16px; color: #2D3748; line-height: 1.6;">
                        내일 <strong>%s</strong>에<br>
                        <strong>[%s]</strong> 약속이 있습니다.
                    </p>
                    <p style="font-size: 16px; color: #2D3748; line-height: 1.6;">
                        장소는 내일 자정에 공개됩니다.<br>
                        편안한 마음만 준비해서 오세요.
                    </p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 14px; color: #718096; text-align: center;">
                        작은 일탈 팀 드림
                    </p>
                </div>
                """, nickname, formattedTime, missionTitle);

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true indicates HTML

            javaMailSender.send(mimeMessage);
            log.info("=== 이메일 발송 성공 ===");

        } catch (MessagingException e) {
            log.error("이메일 발송 실패: {}", e.getMessage(), e);
            throw new RuntimeException("이메일 발송 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * 월간 리포트 이메일 발송
     *
     * @param toEmail 수신자 이메일
     * @param nickname 사용자 닉네임
     * @param month 월 (1-12)
     * @param appointments 해당 월의 약속 리스트
     */
    public void sendMonthlyReport(String toEmail, String nickname, int month, List<Appointment> appointments) {
        log.info("=== 월간 리포트 이메일 발송 시작 ===");
        log.info("수신자: {}, 닉네임: {}, 월: {}월, 약속 수: {}", toEmail, nickname, month, appointments.size());

        MimeMessage mimeMessage = javaMailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");

            String subject = String.format("[작은 일탈] %s님의 %d월 일탈 기록이 도착했습니다 📮", nickname, month);

            // 약속 리스트를 HTML로 변환
            StringBuilder appointmentListHtml = new StringBuilder();
            appointmentListHtml.append("<ul style=\"list-style-type: none; padding: 0;\">");

            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MM-dd");

            for (Appointment appointment : appointments) {
                String dateStr = appointment.getScheduledAt().format(dateFormatter);
                String missionTitle = appointment.getMissionTemplate() != null
                    ? appointment.getMissionTemplate().getTitle()
                    : "비밀의 일탈";
                String placeName = appointment.getPlace() != null
                    ? appointment.getPlace().getName()
                    : "미공개";

                appointmentListHtml.append(String.format(
                    "<li style=\"margin: 10px 0; padding: 10px; background-color: #f7fafc; border-radius: 5px;\">%s : <strong>%s</strong> (장소: %s)</li>",
                    dateStr,
                    missionTitle,
                    placeName
                ));
            }

            appointmentListHtml.append("</ul>");

            String htmlContent = String.format("""
                <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4A5568;">안녕하세요, %s님!</h2>
                    <p style="font-size: 16px; color: #2D3748; line-height: 1.6;">
                        %d월 한 달 동안 총 <strong>%d번</strong>의 작은 일탈을 즐기셨네요!
                    </p>

                    <div style="margin: 20px 0;">
                        %s
                    </div>

                    <p style="font-size: 16px; color: #2D3748; line-height: 1.6; margin-top: 30px;">
                        이번 달도 당신의 쉼을 응원합니다.
                    </p>

                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 14px; color: #718096; text-align: center;">
                        작은 일탈 팀 드림
                    </p>
                </div>
                """, nickname, month, appointments.size(), appointmentListHtml.toString());

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // HTML 모드 활성화

            javaMailSender.send(mimeMessage);
            log.info("=== 월간 리포트 이메일 발송 성공 ===");

        } catch (MessagingException e) {
            log.error("월간 리포트 이메일 발송 실패: {}", e.getMessage(), e);
            throw new RuntimeException("월간 리포트 이메일 발송 중 오류가 발생했습니다.", e);
        }
    }
}
