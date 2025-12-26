import React, { useEffect, useMemo, useRef, useState } from "react";
import type { EscapeAcceptance, EscapeCompletionPayload } from "../features/escape/model/types";
import { distanceM } from "../features/escape/model/geo";
import { formatClock } from "../shared/lib/format";
import type { LatLng } from "../shared/types/geo";
import { useIsMobile } from "../shared/hooks/useIsMobile";
import { buildKakaoDeeplink, buildKakaoWebLink } from "../features/kakaoMap/lib/links";
import type { Appointment } from "../features/appointment/model/types";
import type { TravelMode } from "../features/appointment/model/types";

const ARRIVE_THRESHOLD_M = 80;

function formatTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function fmt(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

type MissionDone = { doneAt: number };

export function EscapeRunPage(props: {
  acceptance: EscapeAcceptance;
  travelMode: TravelMode;
  missionText?: string;
  appointment: Appointment;
  onComplete: (completion: EscapeCompletionPayload) => void;
  onBack: () => void;
}) {
  const { acceptance } = props;
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const missions = acceptance.itineraryLines ?? [];
  const [doneMap, setDoneMap] = useState<Record<number, MissionDone>>({});
  const [now, setNow] = useState(() => Date.now());
  const [pos, setPos] = useState<LatLng | null>(null);
  const [arrivedAt, setArrivedAt] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const doneCount = useMemo(() => Object.keys(doneMap).length, [doneMap]);  

  const statusText = useMemo(() => {
    if (completedAt) return `완료됨 · ${formatTime(completedAt)}`;
    if (arrivedAt) return `도착 기록됨 · ${formatTime(arrivedAt)}`;
    return "진행 중";
  }, [arrivedAt, completedAt]);

  const actionLabel = useMemo(() => {
    if (completedAt) return "완료됨";
    if (arrivedAt) return "미션 완료";
    return "도착!";
  }, [arrivedAt, completedAt]);

  function onTapMission() {
    const now = Date.now();

    // 1) 첫 탭: 도착 기록
    if (!arrivedAt) {
      setArrivedAt(now);
      return;
    }

    // 2) 두 번째 탭: 완료 처리 + REVIEW로 넘김
    if (!completedAt) {
      setCompletedAt(now);

      const payload: EscapeCompletionPayload = {
        acceptedAt: acceptance.acceptedAt,
        arrivedAt,
        completedAt: now,
        totalMs: now - acceptance.acceptedAt,
        toArriveMs: arrivedAt - acceptance.acceptedAt,
      };

      props.onComplete(payload);
    }
  }

  const allDone = useMemo(() => {
    if (missions.length === 0) return false;
    return missions.every((_, i) => !!doneMap[i]);
  }, [missions, doneMap]);

  function markDone(i: number) {
    setDoneMap((prev) => {
      if (prev[i]) return prev; // 이미 완료면 유지
      return { ...prev, [i]: { doneAt: Date.now() } };
    });
  }

  function undoDone(i: number) {
    setDoneMap((prev) => {
      if (!prev[i]) return prev;
      const next = { ...prev };
      delete next[i];
      return next;
    });
  }

  function completeEscape(force: boolean) {
    const now = Date.now();

    // arrivedAt: 첫 미션 완료 시각(없으면 null)
    const doneTimes = Object.values(doneMap).map((v) => v.doneAt);
    const arrivedAt = doneTimes.length ? Math.min(...doneTimes) : null;

    const payload: EscapeCompletionPayload = {
      acceptedAt: acceptance.acceptedAt,
      arrivedAt,
      completedAt: now,
      totalMs: now - acceptance.acceptedAt,
      toArriveMs: arrivedAt ? arrivedAt - acceptance.acceptedAt : null,
    };

    props.onComplete(payload);
  }
  
  function buildCompletionPayload(): EscapeCompletionPayload {
    const now = Date.now();

    // ✅ arrivedAt: "첫 미션 완료 시간" (없으면 null)
    const doneTimes = Object.values(doneMap).map((v) => v.doneAt);
    const arrivedAt = doneTimes.length ? Math.min(...doneTimes) : null;

    return {
      acceptedAt: props.acceptance.acceptedAt,
      arrivedAt,
      completedAt: now,
      totalMs: now - props.acceptance.acceptedAt,
      toArriveMs: arrivedAt ? arrivedAt - props.acceptance.acceptedAt : null,
    };
  }

  function onClickFinish() {
    if (allDone) {
      completeEscape(true);
      return;
    }

    if (!allDone) {
      const ok = window.confirm("아직 일정이 남아있어요. 그래도 완료하시겠어요?");
      if (!ok) return;
    }
    props.onComplete(buildCompletionPayload());
  }

  const openNav = () => {
    const url = isMobile
      ? buildKakaoDeeplink(props.acceptance.origin, props.acceptance.destination, props.travelMode)
      : buildKakaoWebLink(props.acceptance.origin, props.acceptance.destination);
  
    window.open(url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 8000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const dM = useMemo(() => {
    if (!pos) return null;
    return distanceM(pos, acceptance.destination);
  }, [pos, acceptance.destination]);

  const arrivedSetRef = useRef(false);
  useEffect(() => {
    if (arrivedSetRef.current) return;
    if (dM == null) return;
    if (dM <= ARRIVE_THRESHOLD_M) {
      arrivedSetRef.current = true;
      setArrivedAt(Date.now());
    }
  }, [dM]);

  const totalMs = now - acceptance.acceptedAt;
  const toArriveMs = arrivedAt ? arrivedAt - acceptance.acceptedAt : null;

  return (
    <div style={{ padding: 16 }}>
      {/* 상단 상태 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>오늘의 미션</div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          {doneCount}/{missions.length} 완료
        </div>
      </div>

      {/* 미션 리스트 */}
      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {missions.map((m, i) => {
          const done = doneMap[i];
          return (
            <div
              key={i}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 12,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ fontWeight: 800, lineHeight: 1.45 }}>{m}</div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {!done ? (
                  <button
                    onClick={() => markDone(i)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.15)",
                      background: "#111827",
                      color: "#fff",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    완료
                  </button>
                ) : (
                  <>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      완료 시간: <b>{fmt(done.doneAt)}</b>
                    </div>
                    <button
                      onClick={() => undoDone(i)}
                      style={{
                        marginLeft: "auto",
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(0,0,0,0.15)",
                        background: "white",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      되돌리기
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {missions.length === 0 && (
          <div style={{ padding: 12, opacity: 0.7 }}>
            미션이 비어있어. (itineraryLines가 내려오는지 확인)
          </div>
        )}
      </div>

      {/* 완료 버튼 */}
      <div style={{ marginTop: 14 }}>
        <button
          onClick={onClickFinish}
          style={{
            width: "100%",
            padding: "12px 12px",
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.15)",
            background: allDone ? "#111827" : "rgba(17,24,39,0.15)",
            color: allDone ? "#fff" : "#111827",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          오늘의 일탈 완료
        </button>
        {allDone ? "오늘의 일탈 완료" : "오늘의 일탈 완료(확인 필요)"}
        {!allDone && (
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            아직 일정이 남아있어. 그래도 완료하려면 버튼을 누른 뒤 확인창에서 “확인”을 선택해.
          </div>
        )}
      </div>
    </div>
  );
}
