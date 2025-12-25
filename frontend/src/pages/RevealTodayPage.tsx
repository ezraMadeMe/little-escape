import React, { useEffect, useMemo, useState } from "react";
import type { Appointment, AppointmentPrep, DestinationCandidate } from "../features/appointment/model/types";
import type { LatLng } from "../shared/types/geo";
import { RouteMap } from "../features/kakaoMap/components/RouteMap";
import { useIsMobile } from "../shared/hooks/useIsMobile";

export function RevealTodayPage(props: {
  appointment: Appointment;
  prep: AppointmentPrep;
  candidates: DestinationCandidate[];
  onBack: () => void;
  onAccept: (payload: { origin: LatLng; destination: LatLng; destinationName: string }) => void;
}) {
  const isMobile = useIsMobile();
  const list = useMemo(() => props.candidates ?? [], [props.candidates]);
  const [idx, setIdx] = useState(0);
  const current = list.length ? list[idx % list.length] : null;

  // ✅ 카운트다운
  const targetMs = useMemo(() => nextAppointmentTimeMs(props.appointment), [props.appointment]);
  const [remainMs, setRemainMs] = useState<number>(() => Math.max(0, targetMs - Date.now()));

  useEffect(() => {
    const t = setInterval(() => setRemainMs(Math.max(0, targetMs - Date.now())), 250);
    return () => clearInterval(t);
  }, [targetMs]);

  const countdown = useMemo(() => formatHMS(remainMs), [remainMs]);
  const countdownLabel = remainMs <= 0 ? "곧 공개" : countdown;

  const [open, setOpen] = useState(false);

  if (!current) {
    return (
      <div style={{ padding: 20 }}>
        <h2 style={{ margin: 0 }}>당일</h2>
        <div style={{ marginTop: 10, opacity: 0.7 }}>후보 일정이 없어. 전날 준비로 돌아가줘.</div>
        <div style={{ marginTop: 16 }}>
          <button onClick={props.onBack}>뒤로</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={countBox}>
        <div style={{ fontSize: 12, opacity: 0.75 }}>약속장소 공개까지</div>
        <div style={{ fontSize: 20, fontWeight: 900, marginTop: 4 }}>
          {countdownLabel}
        </div>
      </div>

      <h2 style={{ margin: "16px 0 0" }}>당일</h2>
      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
        일정만 보고 결정해. 누르면 이동과 대략 위치가 뜰 거야.
      </div>

      {/* ✅ 일정 텍스트만(카드에 다른 것 넣지 않음) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 16,
          border: "1px solid #ddd",
          background: "#fff",
          cursor: "pointer",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          {current.itineraryLines.slice(0, 3).map((t, i) => (
            <div key={i} style={{ fontSize: 14, lineHeight: 1.45, color: "#111827", wordBreak: "keep-all" }}>
              {t}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setIdx((v) => v + 1)}>다른 일정</button>
        <button
          style={btnPrimary}
          onClick={() =>
            props.onAccept({
              origin: props.prep.origin,
              destination: current.point,
              destinationName: "약속장소",
            })
          }
        >
          이 일정으로 시작
        </button>
        <button onClick={props.onBack}>뒤로</button>
      </div>

      {/* ✅ 팝업: 이동 + 지도(대략 위치) / 모바일 bottom-sheet */}
      {open && (
        <div style={overlay(isMobile)} onClick={() => setOpen(false)}>
          <div style={modal(isMobile)} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 900, fontSize: 15, color: "#111827" }}>이동 소요시간</div>

            <div style={{ marginTop: 10, fontSize: 13, color: "#111827" }}>
              {current.travel.summary}
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {current.travel.lines.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#111827", opacity: 0.9 }}>
                  <span>{l.label}</span>
                  <span>{l.min}분</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, fontWeight: 900, fontSize: 13, color: "#111827" }}>대략 위치</div>
            <div
              style={{
                marginTop: 8,
                height: isMobile ? 240 : 260,
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                background: "#0f172a",
              }}
            >
              <RouteMap origin={props.prep.origin} destination={current.point} />
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setOpen(false)} style={btnOutline}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function nextAppointmentTimeMs(a: Appointment) {
  const now = new Date();
  const target = new Date(now.getTime());

  const hour = a.timeSlot === "MORNING" ? 10 : a.timeSlot === "AFTERNOON" ? 14 : 19;
  target.setHours(hour, 0, 0, 0);

  const want = (d: Date) => {
    if (a.day === "SAT") return d.getDay() === 6;
    if (a.day === "SUN") return d.getDay() === 0;
    // WEEKDAY
    return d.getDay() >= 1 && d.getDay() <= 5;
  };

  for (let i = 0; i < 14; i++) {
    if (want(target) && target.getTime() > now.getTime()) return target.getTime();
    target.setDate(target.getDate() + 1);
    target.setHours(hour, 0, 0, 0);
  }
  return now.getTime();
}

function formatHMS(ms: number) {
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

const countBox: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fafafa",
  width: "fit-content",
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

function overlay(isMobile: boolean): React.CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: isMobile ? "flex-end" : "center",
    padding: 12,
    zIndex: 50,
  };
}

function modal(isMobile: boolean): React.CSSProperties {
  return {
    width: isMobile ? "100%" : "min(520px, 100%)",
    maxHeight: isMobile ? "85vh" : "80vh",
    overflowY: "auto",
    borderRadius: isMobile ? "18px 18px 0 0" : 16,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "#fff",
    padding: 14,
  };
}
