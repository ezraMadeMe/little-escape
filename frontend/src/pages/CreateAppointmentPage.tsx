// src/pages/CreateAppointmentPage.tsx
import React, { useMemo, useState } from "react";
import type { Day, TimeSlot } from "../features/appointment/model/types"; // 네 프로젝트 타입 경로에 맞춰 조정

type Props = {
  onNext: (v: { day: Day; timeSlot: TimeSlot; durationMin: number }) => void;
};

const DAY_LABEL: Record<Day, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
};

const TIMESLOT_LABEL: Record<TimeSlot, string> = {
  MORNING: "오전",
  AFTERNOON: "오후",
  EVENING: "저녁",
  NIGHT: "밤",
};

export function CreateAppointmentPage({ onNext }: Props) {
  const days: Day[] = useMemo(() => ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], []);
  const timeSlots: TimeSlot[] = useMemo(
    () => ["MORNING", "AFTERNOON", "EVENING", "NIGHT"],
    []
  );
  const durations = useMemo(() => [30, 45, 60, 90, 120], []);

  const [day, setDay] = useState<Day>("SAT");
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("AFTERNOON");
  const [durationMin, setDurationMin] = useState<number>(60);

  const onCreate = () => {
    const msg = `${DAY_LABEL[day]}요일 ${TIMESLOT_LABEL[timeSlot]} ${durationMin}분의 약속을 만드시겠어요?`;

    // ✅ 질문 형태니까 confirm이 맞음
    const ok = window.confirm(msg);
    if (!ok) return;

    onNext({ day, timeSlot, durationMin });

    // ❗ 진짜 alert만 원하면:
    // window.alert(msg);
    // onNext({ day, timeSlot, durationMin });
  };

  const Chip = ({
    active,
    children,
    onClick,
  }: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #e6e6e6",
        background: active ? "#111" : "#fff",
        color: active ? "#fff" : "#111",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ padding: 16, display: "grid", gap: 14 }}>
      <h2 style={{ margin: 0 }}>약속 만들기</h2>

      <section style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>요일</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {days.map((d) => (
            <Chip key={d} active={day === d} onClick={() => setDay(d)}>
              {DAY_LABEL[d]}
            </Chip>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>시간대</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {timeSlots.map((t) => (
            <Chip key={t} active={timeSlot === t} onClick={() => setTimeSlot(t)}>
              {TIMESLOT_LABEL[t]}
            </Chip>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>길이</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {durations.map((m) => (
            <Chip key={m} active={durationMin === m} onClick={() => setDurationMin(m)}>
              {m}분
            </Chip>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={onCreate}
        style={{
          marginTop: 8,
          padding: 14,
          borderRadius: 14,
          border: "none",
          fontWeight: 900,
          background: "#111",
          color: "white",
          cursor: "pointer",
        }}
      >
        약속 만들기
      </button>
    </div>
  );
}
