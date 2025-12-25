import React, { useEffect, useMemo, useState } from "react";
import type { Appointment, AppointmentPrep, DestinationCandidate } from "../features/appointment/model/types";
import type { LatLng } from "../shared/types/geo";
import { RouteMap } from "../features/kakaoMap/components/RouteMap";

export function RevealTodayPage(props: {
  appointment: Appointment;
  prep: AppointmentPrep;
  candidates: DestinationCandidate[];
  onBack: () => void;
  onAccept: (payload: { origin: LatLng; destination: LatLng; destinationName: string }) => void;
}) {
  const list = useMemo(() => props.candidates ?? [], [props.candidates]);
  const [idx, setIdx] = useState(0);

  const current = list.length ? list[idx % list.length] : null;

  // ✅ 카운트다운(다음 약속 시간까지) - 기대감 연출용
  const targetMs = useMemo(() => nextAppointmentTimeMs(props.appointment), [props.appointment]);
  const [remainMs, setRemainMs] = useState<number>(() => Math.max(0, targetMs - Date.now()));

  useEffect(() => {
    const t = setInterval(() => setRemainMs(Math.max(0, targetMs - Date.now())), 500);
    return () => clearInterval(t);
  }, [targetMs]);

  const countdown = useMemo(() => formatHMS(remainMs), [remainMs]);

  const [open, setOpen] = useState(false);

  if (!current) {
    return (
      <div style={{ padding: 20 }}>
        <h2>당일</h2>
        <div style={{ marginTop: 10, opacity: 0.7 }}>
          후보 일정이 없어. 전날 준비로 돌아가줘.
        </div>
        <div style={{ marginTop: 16 }}>
          <button onClick={props.onBack}>뒤로</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>당일</h2>

      <div style={countBox}>
        <div style={{ fontSize: 12, opacity: 0.75 }}>약속장소 공개까지</div>
        <div style={{ fontSize: 18, fontWeight: 900, marginTop: 2 }}>{countdown}</div>
      </div>

      <div style={{ marginTop: 12, opacity: 0.8 }}>
        오늘은 일정부터. 눌러보면 “이동 + 대략 위치”가 뜰 거야.
      </div>

      {/* ✅ 일정 카드 (당일은 1장 중심 + 다른 일정) */}
      <div style={{ marginTop: 14 }}>
        <button onClick={() => setOpen(true)} style={todayCard}>
          <div style={{ fontWeight: 900, fontSize: 15 }}>{current.itineraryTitle}</div>
          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            {current.itineraryLines.map((t, i) => (
              <div key={i} style={{ fontSize: 13, opacity: 0.88, lineHeight: 1.35 }}>
                {t}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
            탭해서 확인
          </div>
        </button>

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button onClick={() => setIdx((v) => v + 1)}>다른 일정</button>
          <button
            style={btnPrimary}
            onClick={() =>
              props.onAccept({
                origin: props.prep.origin,
                destination: current.point,
                destinationName: "약속장소", // ✅ 텍스트로 장소명 제공 X (내부 이름만)
              })
            }
          >
            이 일정으로 시작
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={props.onBack}>뒤로</button>
      </div>

      {/* ✅ 팝업: 이동 + 지도(대략 위치) */}
      {open && (
        <div style={overlay} onClick={() => setOpen(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{current.itineraryTitle}</div>

            <div style={{ marginTop: 10, fontSize: 13 }}>
              <b>이동</b>: {current.travel.summary}
            </div>
            <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
              {current.travel.lines.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.85 }}>
                  <span>{l.label}</span>
                  <span>{l.min}분</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, fontWeight: 900, fontSize: 13 }}>대략 위치</div>
            <div style={{ marginTop: 8, height: 240, borderRadius: 14, overflow: "hidden", border: "1px solid #e5e7eb" }}>
              {/* ✅ 장소명 없이 핀만 보여주는 지도 */}
              <RouteMap origin={props.prep.origin} destination={current.point} />
            </div>

            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setOpen(false)} style={btnOutline}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 다음 약속 시간(대략) 계산: day+timeslot 기준으로 “가장 가까운 미래 시간” */
function nextAppointmentTimeMs(a: Appointment) {
  const now = new Date();
  const target = new Date(now.getTime());

  const hour =
    a.timeSlot === "MORNING" ? 10 :
    a.timeSlot === "AFTERNOON" ? 14 :
    19;

  target.setHours(hour, 0, 0, 0);

  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6; // Sun 0, Sat 6
  const isWeekday = (d: Date) => d.getDay() >= 1 && d.getDay() <= 5;

  const want = (d: Date) => {
    if (a.day === "SAT") return d.getDay() === 6;
    if (a.day === "SUN") return d.getDay() === 0;
    return isWeekday(d);
  };

  // 이미 시간이 지났거나, 요일 타입이 안 맞으면 다음날로 넘기면서 찾기(최대 14일)
  for (let i = 0; i < 14; i++) {
    const ok = want(target);
    const inFuture = target.getTime() > now.getTime();
    if (ok && inFuture) return target.getTime();

    target.setDate(target.getDate() + 1);
    target.setHours(hour, 0, 0, 0);
  }

  return now.getTime(); // fallback
}

function formatHMS(ms: number) {
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

const countBox: React.CSSProperties = {
  marginTop: 10,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fafafa",
  width: "fit-content",
};

const todayCard: React.CSSProperties = {
  width: "min(420px, 100%)",
  textAlign: "left",
  padding: 14,
  borderRadius: 16,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};
const btnOutline: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "#fff",
  color: "#111827",
  cursor: "pointer",
  fontWeight: 900,
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "grid",
  placeItems: "center",
  padding: 12,
  zIndex: 50,
};
const modal: React.CSSProperties = {
  width: "min(520px, 100%)",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "#fff",
  padding: 14,
};
