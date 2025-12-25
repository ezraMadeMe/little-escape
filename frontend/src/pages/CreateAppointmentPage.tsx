import React, { useMemo, useState } from "react";
import type { Appointment, Day, TimeSlot } from "../features/appointment/model/types";
import { createAppointment } from "../features/appointment/api/appointmentApi";

export function CreateAppointmentPage(props: {
  onNext: (a: Appointment) => void;
}) {
  const [day, setDay] = useState<Day>("FRI");
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("AFTERNOON");
  const [durationMin, setDurationMin] = useState<number>(90);

  const pretty = useMemo(() => {
    const d = day === "FRI" ? "평일" : day === "SAT" ? "토" : "일";
    const t = timeSlot === "MORNING" ? "오전" : timeSlot === "AFTERNOON" ? "오후" : "저녁";
    return `${d} ${t} · ${durationMin}분`;
  }, [day, timeSlot, durationMin]);

  async function onNext() {
    const res = await createAppointment({ day: "FRI", timeSlot: "EVENING", durationMin: 180 });
    console.log("created appointmentId:", res.id);
    // ✅ 여기서 App state로 올리거나 라우팅으로 prep로 이동
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>약속 만들기</h2>
      <div style={{ marginTop: 6, opacity: 0.75 }}>
        평일 일과 중에 미리 “언제/얼마나”만 정해두자.
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={label}>요일</div>
        <select value={day} onChange={(e) => setDay(e.target.value as Day)} style={input}>
          <option value="WEEKDAY">평일</option>
          <option value="SAT">토</option>
          <option value="SUN">일</option>
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={label}>시간대</div>
        <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value as TimeSlot)} style={input}>
          <option value="MORNING">오전</option>
          <option value="AFTERNOON">오후</option>
          <option value="EVENING">저녁</option>
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={label}>길이</div>
        <select value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} style={input}>
          <option value={30}>30분</option>
          <option value={60}>60분</option>
          <option value={90}>90분</option>
          <option value={120}>120분</option>
        </select>
      </div>

      <div style={{ marginTop: 14, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <div style={{ fontWeight: 900 }}>요약</div>
        <div style={{ marginTop: 6 }}>{pretty}</div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
          전날에 이동수단을 고르고, 그 조건으로 장소 후보가 정리돼.
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          style={btnPrimary}
          onClick={() =>
            props.onNext({
              id: String(Date.now()),
              day,
              timeSlot,
              durationMin,
              createdAt: Date.now(),
            })
          }
        >
          약속 만들기
        </button>
      </div>
    </div>
  );
}

const label: React.CSSProperties = { fontSize: 12, opacity: 0.7, marginBottom: 6 };
const input: React.CSSProperties = { padding: "10px 10px", borderRadius: 10, border: "1px solid #ddd" };
const btnPrimary: React.CSSProperties = {
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};
