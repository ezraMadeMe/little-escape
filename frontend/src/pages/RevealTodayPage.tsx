import React, { useMemo, useRef, useState } from "react";
import type { Appointment, AppointmentPrep, DestinationCandidate } from "../features/appointment/model/types";
import type { LatLng } from "../shared/types/geo";
import { RouteMap } from "../features/kakaoMap/components/RouteMap";
import { useIsMobile } from "../shared/hooks/useIsMobile";

export function RevealTodayPage(props: {
  appointment: Appointment;
  prep: AppointmentPrep;
  candidates: DestinationCandidate[];
  onBack: () => void;
  onAccept: (payload: {
    origin: LatLng;
    destination: LatLng;
    destinationName?: string;
    itineraryLines: string[];
  }) => void;
}) {
  const isMobile = useIsMobile();
  const list = useMemo(() => props.candidates ?? [], [props.candidates]);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    if (idx !== activeIdx) setActiveIdx(idx);
  };

  const current = list[activeIdx] ?? null;

  if (!list.length || !current) {
    return (
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: 0 }}>당일</h2>
        <div style={{ marginTop: 10, opacity: 0.7 }}>후보 일정이 없어. 전날 준비로 돌아가줘.</div>
        <div style={{ marginTop: 16 }}>
          <button onClick={props.onBack}>뒤로</button>
        </div>
      </div>
    );
  }

  const pad = isMobile ? 16 : 20;

  return (
    <div style={{ padding: pad }}>
      <h2 style={{ margin: 0 }}>당일</h2>
      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
        카드를 스와이프해서 고르고, 선택한 일정으로 시작해.
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
            `목표 도착지 (${c.point.lat.toFixed(5)}, ${c.point.lng.toFixed(5)})`;

          const shouldRenderMap = Math.abs(i - activeIdx) <= 1;

          return (
            <div
              key={c.id ?? i}
              style={{
                flex: "0 0 100%",
                scrollSnapAlign: "start",
                paddingRight: 12,
                boxSizing: "border-box",
              }}
            >
              <div style={cardShell}>
                <div style={{ fontWeight: 900, fontSize: 16, color: "#111827" }}>{destinationTitle}</div>

                <ItinerarySection itineraryLines={c.itineraryLines} />

                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontWeight: 900, fontSize: 14, color: "#111827" }}>이동 소요시간</div>
                  <div style={{ fontSize: 13, color: "#111827" }}>{c.travel.summary}</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {c.travel.lines.map((l, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.9 }}>
                        <span>{l.label}</span>
                        <span>{l.min}분</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontWeight: 900, fontSize: 13, color: "#111827" }}>대략 위치</div>
                  <div style={mapBox(isMobile)}>
                    {shouldRenderMap ? (
                      <RouteMap
                        origin={{ lat: props.prep.originLat, lng: props.prep.originLng }}
                        destination={c.point}
                      />
                    ) : (
                      <div style={{ height: "100%" }} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ 카드 밖 버튼(하나만) */}
      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={props.onBack}>뒤로</button>
        <button
          style={btnPrimary}
          onClick={() =>
            props.onAccept({
              origin: { lat: props.prep.originLat, lng: props.prep.originLng },
              destination: current.point,
              destinationName: "",
              itineraryLines: current.itineraryLines,
            })
          }
        >
          이 일정으로 시작
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
        maxHeight: 240,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        paddingRight: 6,
      }}
    >
      {itineraryLines.map((line, idx) => (
        <div key={`${idx}-${line}`} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, background: "white" }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>{`일정${idx + 1}.`}</div>
          <div style={{ lineHeight: 1.5 }}>{line}</div>
        </div>
      ))}
    </div>
  );
}

const cardShell: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 16,
  background: "#fff",
  padding: 16,
  display: "grid",
  gap: 14,
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

function mapBox(isMobile: boolean): React.CSSProperties {
  return {
    height: isMobile ? 220 : 260,
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    background: "#0f172a",
  };
}
