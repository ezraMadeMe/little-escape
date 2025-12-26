import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Appointment, DestinationCandidate } from "../features/appointment/model/types";
import { useIsMobile } from "../shared/hooks/useIsMobile";

export function DayBeforeSchedulePage(props: {
  appointment: Appointment;
  candidates: DestinationCandidate[];
  onBack: () => void;     // 전날 준비(이동수단 선택)으로
  onGoToday: () => void;  // 당일 공개 화면으로
}) {
  const isMobile = useIsMobile();
  const list = useMemo(() => props.candidates ?? [], [props.candidates]);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const targetMs = useMemo(() => nextAppointmentTimeMs(props.appointment), [props.appointment]);
  const [remainMs, setRemainMs] = useState<number>(() => Math.max(0, targetMs - Date.now()));

  useEffect(() => {
    const t = setInterval(() => setRemainMs(Math.max(0, targetMs - Date.now())), 250);
    return () => clearInterval(t);
  }, [targetMs]);

  const countdown = useMemo(() => formatHMS(remainMs), [remainMs]);
  const countdownLabel = remainMs <= 0 ? "공개 가능" : countdown;

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    if (idx !== activeIdx) setActiveIdx(idx);
  };

  if (!list.length) {
    return (
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: 0 }}>전날 준비</h2>
        <div style={{ marginTop: 10, opacity: 0.7 }}>후보 일정이 없어. 전 단계로 돌아가줘.</div>
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button onClick={props.onBack}>뒤로</button>
        </div>
      </div>
    );
  }

  const pad = isMobile ? 16 : 20;

  return (
    <div style={{ padding: pad }}>
      <div style={countBox}>
        <div style={{ fontSize: 12, opacity: 0.75 }}>약속장소 공개까지</div>
        <div style={{ fontSize: 20, fontWeight: 900, marginTop: 4 }}>{countdownLabel}</div>
      </div>

      <h2 style={{ margin: "16px 0 0" }}>전날 일정</h2>
      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
        장소 정보 없이 일정만 확인해. 카드를 스와이프해서 비교해봐.
      </div>

      {/* ✅ 풀블리드 스와이프(모바일 짤림 방지) */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        style={{
          marginTop: 16,
          marginLeft: -pad,
          marginRight: -pad,
          paddingLeft: pad,
          paddingRight: pad,

          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {list.map((c, i) => {
          const destinationTitle =
            (c as any).destinationAddress ??
            (c as any).destinationName ??
            `장소 ${i + 1}`;

          return (
            <div
              key={c.id ?? i}
              style={{
                flex: "0 0 100%",
                scrollSnapAlign: "start",
                paddingRight: 12, // 카드 간격
                boxSizing: "border-box",
              }}
            >
              <div style={cardShell}>
                <div style={{ fontWeight: 900, fontSize: 16, color: "#111827" }}>
                  {destinationTitle}
                </div>

                <ItinerarySection itineraryLines={c.itineraryLines} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ 카드 밖 공통 버튼(하나만) */}
      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={props.onBack}>뒤로</button>
        <button
          style={{
            ...btnPrimary,
            opacity: remainMs <= 0 ? 1 : 0.5,
            cursor: remainMs <= 0 ? "pointer" : "not-allowed",
          }}
          disabled={remainMs > 0}
          onClick={props.onGoToday}
        >
          당일 공개 보기
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.6 }}>
        {activeIdx + 1} / {list.length}
      </div>
    </div>
  );
}

function ItinerarySection({ itineraryLines }: { itineraryLines: string[] }) {
  return (
    <div
      style={{
        maxHeight: 320,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        paddingRight: 6,
      }}
    >
      {itineraryLines.map((line, idx) => (
        <div
          key={`${idx}-${line}`}
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
            background: "white",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6 }}>{`일정${idx + 1}.`}</div>
          <div style={{ lineHeight: 1.5 }}>{line}</div>
        </div>
      ))}
    </div>
  );
}

function nextAppointmentTimeMs(a: Appointment) {
  const now = new Date();
  const target = new Date(now.getTime());

  const hour =
    a.timeSlot === "MORNING" ? 10 :
    a.timeSlot === "AFTERNOON" ? 14 :
    a.timeSlot === "EVENING" ? 19 :
    21;

  target.setHours(hour, 0, 0, 0);

  const map: Record<Appointment["day"], number> = {
    MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 0,
  };

  const want = (d: Date) => d.getDay() === map[a.day];

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

const cardShell: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  background: "#fff",
  padding: 16,
  display: "grid",
  gap: 14,
};

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
  fontWeight: 900,
};
