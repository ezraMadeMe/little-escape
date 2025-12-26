// src/app/App.tsx
import React, { useMemo, useState } from "react";

import { CreateAppointmentPage } from "../pages/CreateAppointmentPage";
import { DayBeforeOriginPage } from "../pages/DayBeforeOriginPage";
import { DayBeforeItineraryPage } from "../pages/DayBeforeItineraryPage";
import { RevealTodayPage } from "../pages/RevealTodayPage";
import { EscapeRunPage } from "../pages/EscapeRunPage";
import { EscapeReviewPage } from "../pages/EscapeReviewPage";

import type {
  Appointment,
  AppointmentPrep,
  DestinationCandidate,
} from "../features/appointment/model/types";
import type { LatLng } from "../shared/types/geo";
import type {
  EscapeAcceptance,
  EscapeCompletionPayload,
  EscapeResult,
} from "../features/escape/model/types";
import { pickMission } from "../features/escape/model/mission";

import { createAppointment, createPrep } from "../features/appointment/api/appointmentApi";
import { DayBeforeSchedulePage } from "../pages/DayBeforeSchedulePage";

type Step = "CREATE" | "PREP_ORIGIN" | "PREP_ITINERARY" | "DAY_BEFORE_SCHEDULE" | "REVEAL" | "RUN" | "REVIEW";

// ✅ ApiResponse<T> 대응: { data: T } 형태면 data를 쓰고, 아니면 그대로 반환
function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "data" in res) return res.data as T;
  return res as T;
}

export default function App() {
  const [step, setStep] = useState<Step>("CREATE");

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [origin, setOrigin] = useState<LatLng | null>(null);

  const [prep, setPrep] = useState<AppointmentPrep | null>(null);
  const [candidates, setCandidates] = useState<DestinationCandidate[] | null>(null);

  const [acceptance, setAcceptance] = useState<EscapeAcceptance | null>(null);
  const [missionText, setMissionText] = useState<string | null>(null);
  const [escapeResult, setEscapeResult] = useState<EscapeResult | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAll = () => {
    setStep("CREATE");
    setAppointment(null);
    setOrigin(null);
    setPrep(null);
    setCandidates(null);
    setAcceptance(null);
    setMissionText(null);
    setEscapeResult(null);
    setBusy(false);
    setError(null);
  };

  const Page = useMemo(() => {
    // 1) CREATE
    if (step === "CREATE") {
      return (
        <CreateAppointmentPage
          onNext={async ({ day, timeSlot, durationMin }) => {
            try {
              setBusy(true);
              setError(null);

              const res = await createAppointment({ day, timeSlot, durationMin });
              const created = unwrap<Appointment>(res);

              if (!created?.id) {
                throw new Error("createAppointment 응답에 appointment.id가 없습니다 (ApiResponse 언랩/DTO 확인 필요)");
              }

              setAppointment(created);
              setStep("PREP_ORIGIN");
            } catch (e: any) {
              console.error(e);
              setError(e?.message ?? "createAppointment 실패");
            } finally {
              setBusy(false);
            }
          }}
        />
      );
    }

    // 2) PREP_ORIGIN
    if (step === "PREP_ORIGIN") {
      if (!appointment) return null;
      return (
        <DayBeforeOriginPage
          onNext={(o) => {
            setOrigin(o);
            setStep("PREP_ITINERARY");
          }}
        />
      );
    }

    if (step === "DAY_BEFORE_SCHEDULE") {
      if (!appointment || !candidates?.length) {
        setStep("PREP_ITINERARY");
        return null;
      }
    
      return (
        <DayBeforeSchedulePage
          appointment={appointment}
          candidates={candidates}
          onBack={() => setStep("PREP_ITINERARY")}
          onGoToday={() => setStep("REVEAL")}
        />
      );
    }   

    // 3) PREP_ITINERARY
    if (step === "PREP_ITINERARY") {
      if (!appointment) return null;
      if (!origin) {
        setStep("PREP_ORIGIN");
        return null;
      }

      return (
        <DayBeforeItineraryPage
          appointment={appointment}
          origin={origin}
          busy={busy}
          error={error}
          onBack={() => setStep("PREP_ORIGIN")}
          onNext={async (travelMode) => {
            try {
              setBusy(true);
              setError(null);

              const res = await createPrep(appointment.id, {
                travelMode,
                originLat: origin.lat,
                originLng: origin.lng,
              });

              // createPrep도 래핑일 수 있어서 방어적으로 언랩
              const unwrapped = unwrap<any>(res);
              const nextPrep: AppointmentPrep | undefined = unwrapped?.prep ?? unwrapped?.data?.prep;
              const nextCandidates: DestinationCandidate[] | undefined =
                unwrapped?.candidates ?? unwrapped?.data?.candidates;

              if (!nextPrep) throw new Error("createPrep 응답에 prep이 없습니다");
              if (!nextCandidates || nextCandidates.length === 0)
                throw new Error("createPrep 응답에 candidates가 없습니다/0개입니다");

              setPrep(nextPrep);
              setCandidates(nextCandidates);
              setStep("DAY_BEFORE_SCHEDULE");
            } catch (e: any) {
              console.error(e);
              setError(e?.message ?? "createPrep 실패");
            } finally {
              setBusy(false);
            }
          }}
        />
      );
    } 

    // 4) REVEAL
    if (step === "REVEAL") {
      if (!appointment || !prep || !candidates?.length) return null;

      return (
        <RevealTodayPage
          appointment={appointment}
          prep={prep}
          candidates={candidates}
          onBack={() => setStep("DAY_BEFORE_SCHEDULE")}
          onAccept={({ origin, destination, destinationName, itineraryLines }) => {
            const acceptedAt = Date.now();
            setAcceptance({ acceptedAt, origin, destination, destinationName, itineraryLines });
            setMissionText(pickMission(acceptedAt));
            setStep("RUN");
          }}
        />
      );
    }

    // 5) RUN
    if (step === "RUN") {
      if (!appointment || !prep || !acceptance) return null;

      return (
        <EscapeRunPage
          appointment={appointment}
          acceptance={acceptance}
          travelMode={prep.travelMode}
          missionText={missionText ?? undefined}
          onBack={() => setStep("REVEAL")}
          onComplete={(completion: EscapeCompletionPayload) => {
            const result: EscapeResult = {
              ...acceptance,
              missionText: missionText ?? pickMission(acceptance.acceptedAt),
              completion,
            };
            setEscapeResult(result);
            setStep("REVIEW");
          }}
        />
      );
    }

    // 6) REVIEW
    if (step === "REVIEW") {
      if (!escapeResult) return null;
      return <EscapeReviewPage result={escapeResult} onRestart={resetAll} />;
    }

    return null;
  }, [step, appointment, origin, prep, candidates, acceptance, missionText, escapeResult, busy, error]);

  // ✅ 화면 공통 Shell: 로딩/에러가 “안 보여서 멈춘 것처럼 보이는 문제” 제거
  return (
    <div style={{ minHeight: "100vh" }}>
      {busy && (
        <div style={{ padding: 12, background: "#fff3cd", borderBottom: "1px solid #eee" }}>
          처리 중…
        </div>
      )}

      {error && (
        <div style={{ padding: 12, background: "#ffe5e5", borderBottom: "1px solid #eee" }}>
          <div style={{ fontWeight: 800 }}>에러</div>
          <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{error}</div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setError(null)}>
              닫기
            </button>
            <button type="button" onClick={resetAll}>
              처음부터
            </button>
          </div>
        </div>
      )}

      {Page ?? (
        <div style={{ padding: 16 }}>
          화면을 그릴 수 없습니다. (step: {step}){" "}
          <button type="button" onClick={resetAll} style={{ marginLeft: 8 }}>
            처음부터
          </button>
        </div>
      )}
    </div>
  );
}
