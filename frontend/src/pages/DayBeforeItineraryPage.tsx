import React, { useMemo, useState } from "react";
import type { Appointment, TravelMode } from "../features/appointment/model/types";
import type { LatLng } from "../shared/types/geo";

type Props = {
  appointment: Appointment;
  origin: LatLng;
  onBack: () => void;
  onNext: (travelMode: TravelMode) => void; // ✅ 이제 travelMode만 올림
  busy?: boolean;
  error?: string | null;
};

const modeLabel: Record<TravelMode, string> = {
  WALK: "도보",
  TRANSIT: "대중교통",
  CAR: "차량",
  BICYCLE: "자전거",
};

const modeDesc: Record<TravelMode, string> = {
  WALK: "가까운 후보 중심(짧은 이동 선호)",
  TRANSIT: "거리/시간 균형(대부분 추천)",
  CAR: "조금 멀어도 후보 포함(범위 넓음)",
  BICYCLE: "중거리 위주(날씨/동선 고려)",
};

export function DayBeforeItineraryPage({
  appointment,
  origin,
  onBack,
  onNext,
  busy = false,
  error = null,
}: Props) {
  const [travelMode, setTravelMode] = useState<TravelMode>("TRANSIT");

  const originText = useMemo(
    () => `lat ${origin.lat.toFixed(5)}, lng ${origin.lng.toFixed(5)}`,
    [origin.lat, origin.lng]
  );

  const canSubmit = useMemo(() => !busy && !!travelMode, [busy, travelMode]);

  return (
    <div style={page}>
      <h2 style={h2}>전날 준비</h2>
      <div style={sub}>
        이동수단을 선택하면 서버가 후보(최대 5개)를 생성해 저장하고, “일정 텍스트 카드”만 공개해.
      </div>

      <div style={card}>
        <div style={rowTitle}>약속 정보</div>
        <div style={kv}>
          <div style={k}>appointmentId</div>
          <div style={v}>{appointment.id}</div>
        </div>
        <div style={kv}>
          <div style={k}>출발 위치</div>
          <div style={v}>{originText}</div>
        </div>
      </div>

      <div style={card}>
        <div style={rowTitle}>이동수단 선택</div>

        <div style={modeGrid}>
          {(Object.keys(modeLabel) as TravelMode[]).map((m) => {
            const selected = travelMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setTravelMode(m)}
                disabled={busy}
                style={{
                  ...modeBtn,
                  borderColor: selected ? "#111827" : "rgba(0,0,0,0.12)",
                  background: selected ? "rgba(17,24,39,0.06)" : "white",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                <div style={{ fontWeight: 900 }}>{modeLabel[m]}</div>
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                  {modeDesc[m]}
                </div>
              </button>
            );
          })}
        </div>

        <div style={hint}>
          선택된 이동수단: <b>{modeLabel[travelMode]}</b>
        </div>

        {error && <div style={errorBox}>{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button type="button" style={btnGhost} onClick={onBack} disabled={busy}>
            뒤로
          </button>

          <button
            type="button"
            style={{ ...btnPrimary, opacity: canSubmit ? 1 : 0.6 }}
            disabled={!canSubmit}
            onClick={() => onNext(travelMode)}
          >
            {busy ? "후보 생성 중..." : "전날 준비 완료"}
          </button>
        </div>

        <div style={tiny}>
          완료를 누르면 <code>/api/v1/appointments/{appointment.id}/prep</code> 로 저장되고,
          다음 화면에서 후보 카드가 보여.
        </div>
      </div>
    </div>
  );
}

const page: React.CSSProperties = { padding: 20 };
const h2: React.CSSProperties = { margin: 0 };
const sub: React.CSSProperties = { marginTop: 6, opacity: 0.75, lineHeight: 1.4 };

const card: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  border: "1px solid #e5e7eb",
  borderRadius: 14,
};

const rowTitle: React.CSSProperties = { fontWeight: 900, marginBottom: 10 };

const kv: React.CSSProperties = { display: "flex", gap: 10, marginTop: 6 };
const k: React.CSSProperties = { width: 90, fontSize: 12, opacity: 0.65 };
const v: React.CSSProperties = { flex: 1, fontSize: 13, wordBreak: "break-all" };

const modeGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const modeBtn: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "white",
  cursor: "pointer",
};

const hint: React.CSSProperties = { marginTop: 10, fontSize: 12, opacity: 0.75 };

const errorBox: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(220,38,38,0.35)",
  background: "rgba(220,38,38,0.06)",
  color: "rgb(185, 28, 28)",
  whiteSpace: "pre-wrap",
};

const btnPrimary: React.CSSProperties = {
  flex: 1,
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const btnGhost: React.CSSProperties = {
  width: 110,
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "white",
  cursor: "pointer",
  fontWeight: 800,
};

const tiny: React.CSSProperties = { marginTop: 10, fontSize: 12, opacity: 0.55 };
