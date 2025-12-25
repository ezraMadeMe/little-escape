import React, { useMemo, useState } from "react";
import type {
  Appointment,
  AppointmentPrep,
  DestinationCandidate,
  TravelMode,
} from "../features/appointment/model/types";
import type { LatLng } from "../shared/types/geo";
import { REVEAL_DEMO } from "../data/demo/revealDemo";
import { distanceM } from "../features/escape/model/geo";
import { useIsMobile } from "../shared/hooks/useIsMobile";

type DemoItem = { id: string; point: LatLng };

export function DayBeforeItineraryPage(props: {
  appointment: Appointment;
  origin: LatLng;
  onBack: () => void;
  onNext: (prep: AppointmentPrep, candidates: DestinationCandidate[]) => void;
}) {
  const isMobile = useIsMobile();

  const [travelMode, setTravelMode] = useState<TravelMode>("TRANSIT");

  const pool = useMemo(() => {
    const raw = (REVEAL_DEMO as any[]) ?? [];
    return raw.map((x, i) => ({
      id: String(x.id ?? i),
      point: x.point as LatLng,
    })) as DemoItem[];
  }, []);

  const candidates = useMemo(() => {
    // ✅ 최대 5개
    return buildCandidates(pool, props.origin, props.appointment, travelMode).slice(0, 5);
  }, [pool, props.origin, props.appointment, travelMode]);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<DestinationCandidate | null>(null);

  const openModal = (c: DestinationCandidate) => {
    setSelected(c);
    setOpen(true);
  };

  return (
    <div style={{ padding: 20, overflowX: "hidden" }}>
      <h2 style={{ margin: 0 }}>전날 준비</h2>
      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
        내일은 <b>일정</b>만 공개돼. (장소는 당일에)
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>이동수단</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            maxWidth: 360,
          }}
        >
          {(["TRANSIT", "WALK", "BICYCLE", "CAR"] as TravelMode[]).map((m) => (
            <button key={m} onClick={() => setTravelMode(m)} style={chip(travelMode === m)}>
              {prettyMode(m)}
            </button>
          ))}
        </div>

        {/* ✅ 가중치 설명은 카드 밖에 두되, 화면을 덜 어지럽게 */}
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7, lineHeight: 1.45 }}>
          이동시간은 {prettyMode(travelMode)} 기준으로{" "}
          {travelMode === "TRANSIT"
            ? "대기/환승/마지막 도보를 포함해"
            : travelMode === "CAR"
            ? "주차/도보 시간을 포함해"
            : travelMode === "BICYCLE"
            ? "정리 시간을 포함해"
            : "단순 도보 시간으로"} 계산돼.
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>내일 공개될 일정</div>

        {candidates.length === 0 ? (
          <div style={emptyBox}>조건에 맞는 일정이 없어. 이동수단을 바꿔봐.</div>
        ) : (
            <div style={sliderWrap}>
            <div style={sliderRail}>
              {candidates.map((c) => (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openModal(c)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openModal(c);
                  }}
                  style={sliderCard(isMobile)}
                >
                  {/* ✅ 카드에는 일정 텍스트만 */}
                  <div style={{ display: "grid", gap: 8 }}>
                    {c.itineraryLines.slice(0, 3).map((t, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: 14,
                          lineHeight: 1.45,
                          color: "#111827",
                          wordBreak: "keep-all",
                        }}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
        <button onClick={props.onBack}>뒤로</button>
        <button
          style={btnPrimary}
          disabled={candidates.length === 0}
          onClick={() =>
            props.onNext(
              {
                appointmentId: props.appointment.id,
                travelMode,
                origin: props.origin,
                preparedAt: Date.now(),
              },
              candidates
            )
          }
        >
          전날 준비 완료
        </button>
      </div>

      {/* ✅ 모달: 모바일 bottom-sheet 대응 */}
      {open && selected && (
        <div style={overlay(isMobile)} onClick={() => setOpen(false)}>
          <div style={modal(isMobile)} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 900, fontSize: 15, color: "#111827" }}>이동 소요시간</div>

            <div style={{ marginTop: 10, fontSize: 13, color: "#111827" }}>
              {selected.travel.summary}
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {selected.travel.lines.map((l, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "#111827",
                    opacity: 0.9,
                  }}
                >
                  <span>{l.label}</span>
                  <span>{l.min}분</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setOpen(false)} style={btnOutline}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function prettyMode(m: TravelMode) {
  return m === "TRANSIT" ? "대중교통" : m === "WALK" ? "도보" : m === "BICYCLE" ? "자전거" : "자차";
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

const emptyBox: React.CSSProperties = {
  padding: 12,
  border: "1px solid #ddd",
  borderRadius: 12,
  opacity: 0.7,
};

// ✅ 모바일 가로 슬라이드 안정화
const rail: React.CSSProperties = {
  display: "flex",
  gap: 12,
  overflowX: "auto",
  overflowY: "hidden",
  paddingBottom: 10,
  WebkitOverflowScrolling: "touch",
  scrollSnapType: "x mandatory",
  scrollbarWidth: "none", // firefox
} as any;

const sliderWrap: React.CSSProperties = {
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",          // ✅ 여기서 페이지 확장 “클립”
  };
  
  const sliderRail: React.CSSProperties = {
    display: "flex",
    gap: 12,
    maxWidth: "100%",
    overflowX: "auto",           // ✅ 스크롤은 여기서만 발생
    overflowY: "hidden",
    paddingBottom: 10,
    WebkitOverflowScrolling: "touch",
    scrollSnapType: "x mandatory",
    overscrollBehaviorX: "contain",
    touchAction: "pan-y",        // ✅ 세로 스크롤 유지 + 가로 레일 스크롤
    minWidth: 0,                 // ✅ (상위가 flex여도) 안 늘어나게
  };
  
  function sliderCard(isMobile: boolean): React.CSSProperties {
    return {
      flex: "0 0 auto",
      width: isMobile ? "calc(100vw - 40px)" : 320, // ✅ padding 20*2 고려
      maxWidth: isMobile ? "calc(100vw - 40px)" : 360,
      boxSizing: "border-box",
      scrollSnapAlign: "start",
      padding: 16,
      borderRadius: 16,
      border: "1px solid #ddd",
      background: "#fff",
      cursor: "pointer",
      userSelect: "none",
      WebkitTapHighlightColor: "transparent",
      outline: "none",
    };
  }  

// ✅ 모달 반응형: 모바일 bottom-sheet
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
    width: isMobile ? "100%" : "min(420px, 100%)",
    maxHeight: isMobile ? "82vh" : "80vh",
    overflowY: "auto",
    borderRadius: isMobile ? "18px 18px 0 0" : 16,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "#fff",
    padding: 14,
  };
}

/** 후보 생성(장소 텍스트 없음) */
function buildCandidates(pool: DemoItem[], origin: LatLng, a: Appointment, mode: TravelMode): DestinationCandidate[] {
  const durationMin = a.durationMin;
  const scale = Math.max(0.6, Math.min(1.6, durationMin / 90));

  const maxDistanceM =
    (mode === "WALK" ? 2500 :
     mode === "BICYCLE" ? 6500 :
     mode === "TRANSIT" ? 14000 :
     22000) * scale;

  const speedMpm =
    mode === "WALK" ? 80 :
    mode === "BICYCLE" ? 220 :
    mode === "TRANSIT" ? 350 :
    550;

  const bicyclePenalty = 3;
  const carPenalty = 8;
  const transitWait = 6;
  const transitTransfer = 4;
  const lastMileWalkMin = (dM: number) => clamp(Math.round(dM / 2500) + 4, 4, 10);

  return shuffle(pool)
    .map((it) => {
      const d = distanceM(origin, it.point);
      const baseMove = Math.max(1, Math.round(d / speedMpm));

      let total = baseMove;
      let lines: { label: string; min: number }[] = [];
      let summary = "";

      if (mode === "WALK") {
        total = baseMove;
        lines = [{ label: "도보", min: total }];
        summary = `도보 ${total}분`;
      } else if (mode === "BICYCLE") {
        total = baseMove + bicyclePenalty;
        lines = [
          { label: "자전거 이동", min: baseMove },
          { label: "정리", min: bicyclePenalty },
        ];
        summary = `자전거 ${total}분`;
      } else if (mode === "CAR") {
        total = baseMove + carPenalty;
        lines = [
          { label: "운전", min: baseMove },
          { label: "주차/도보", min: carPenalty },
        ];
        summary = `자차 ${total}분`;
      } else {
        const lastWalk = lastMileWalkMin(d);
        const ride = Math.max(3, baseMove - lastWalk);
        total = ride + lastWalk + transitWait + transitTransfer;
        lines = [
          { label: "대기", min: transitWait },
          { label: "환승", min: transitTransfer },
          { label: "탑승", min: ride },
          { label: "도보", min: lastWalk },
        ];
        summary = `대중교통 ${total}분`;
      }

      return {
        id: it.id,
        point: it.point,
        itineraryTitle: "이곳의 일정",
        itineraryLines: buildItineraryLines(a, total),
        travel: { totalMin: total, lines, summary },
      } satisfies DestinationCandidate;
    })
    .filter((c) => distanceM(origin, c.point) <= maxDistanceM)
    .sort((x, y) => x.travel.totalMin - y.travel.totalMin);
}

function buildItineraryLines(a: Appointment, travelMin: number): string[] {
  const usable = Math.max(25, a.durationMin - Math.min(travelMin, 35));
  const p1 = Math.max(10, Math.round(usable * 0.45));
  const p2 = Math.max(10, usable - p1);

  const vibe =
    a.timeSlot === "MORNING" ? "가볍게" :
    a.timeSlot === "AFTERNOON" ? "기분 전환" :
    "정리";

  return [
    `${p1}분 · ${vibe} 하나`,
    `${p2}분 · 기록하고 마무리`,
  ];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
