import React, { useMemo, useState } from "react";
import type { Appointment, Proposal, TimePick, TravelMode } from "../features/appointment/model/types";

export function TimePickPage(props: {
  proposal: Proposal;
  onBack: () => void;
  onNext: (a: Appointment) => void;
}) {
  const [day, setDay] = useState<TimePick["day"]>("SAT");
  const [timeSlot, setTimeSlot] = useState<TimePick["timeSlot"]>("AFTERNOON");
  const [travelMode, setTravelMode] = useState<TravelMode>("TRANSIT"); // ✅ 기본값

  const durationMin = useMemo(() => props.proposal.durationMin, [props.proposal.durationMin]);

  return (
    <div style={{ padding: 20 }}>
      <h2>TimePick</h2>

      <div style={{ marginTop: 12 }}>
        <div>요일</div>
        <select value={day} onChange={(e) => setDay(e.target.value as TimePick["day"])}>
          <option value="SAT">토</option>
          <option value="SUN">일</option>
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        <div>시간대</div>
        <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value as TimePick["timeSlot"])}>
          <option value="MORNING">오전</option>
          <option value="AFTERNOON">오후</option>
          <option value="EVENING">저녁</option>
        </select>
      </div>

      <div style={{ marginTop: 12 }}>길이: {durationMin}분</div>

      {/* ✅ 이동수단(조건) */}
      <div style={{ marginTop: 14 }}>
        <div style={{ marginBottom: 8 }}>이동수단</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 320 }}>
          {(["TRANSIT", "WALK", "BICYCLE", "CAR"] as TravelMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setTravelMode(m)}
              style={chip(travelMode === m)}
            >
              {m === "TRANSIT" ? "대중교통" : m === "WALK" ? "도보" : m === "BICYCLE" ? "자전거" : "자차"}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
          * 이동수단은 추천과 길찾기에 반영돼.
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button onClick={props.onBack}>뒤로</button>
        <button
          onClick={() =>
            props.onNext({
              ...props.proposal,
              day,
              timeSlot,
              durationMin,
              travelMode, // ✅ 포함
            })
          }
        >
          다음
        </button>
      </div>
    </div>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.15)",
    background: active ? "#111827" : "#fff",
    color: active ? "#fff" : "#111827",
    cursor: "pointer",
    fontWeight: 900,
  };
}
