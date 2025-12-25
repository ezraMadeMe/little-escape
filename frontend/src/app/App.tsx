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
import PrepPage from "../pages/PrepPage";

type Step = "CREATE" | "PREP_ORIGIN" | "PREP_ITINERARY" | "REVEAL" | "RUN" | "REVIEW";
type Page = "TIMEPICK" | "PREP"; // 너 enum에 맞춰

export default function App() {
  const [step, setStep] = useState<Step>("CREATE");

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [origin, setOrigin] = useState<LatLng | null>(null);

  const [prep, setPrep] = useState<AppointmentPrep | null>(null);
  const [candidates, setCandidates] = useState<DestinationCandidate[] | null>(null);

  const [acceptance, setAcceptance] = useState<EscapeAcceptance | null>(null);
  const [missionText, setMissionText] = useState<string | null>(null);
  const [escapeResult, setEscapeResult] = useState<EscapeResult | null>(null);

  const [page, setPage] = useState<Page>("TIMEPICK");
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  const resetAll = () => {
    setStep("CREATE");
    setAppointment(null);
    setOrigin(null);
    setPrep(null);
    setCandidates(null);
    setAcceptance(null);
    setMissionText(null);
    setEscapeResult(null);
  };

  if (step === "CREATE") {
    return (
      <CreateAppointmentPage
        onNext={(a) => {
          setAppointment(a);
          setStep("PREP_ORIGIN");
        }}
      />
    );
  }

  if (page === "PREP") {
    if (!appointmentId) return <div style={{ padding: 16 }}>appointmentId 없음</div>;
    return <PrepPage appointmentId={appointmentId} />;
  }

  if (step === "PREP_ORIGIN") {
    const a =
      appointment ??
      ({
        id: "demo",
        day: "SUN",
        timeSlot: "AFTERNOON",
        durationMin: 90,
        createdAt: Date.now(),
      } as Appointment);

    return (
      <DayBeforeOriginPage
        appointment={a}
        onBack={() => setStep("CREATE")}
        onNext={(o) => {
          setOrigin(o);
          setStep("PREP_ITINERARY");
        }}
      />
    );
  }

  if (step === "PREP_ITINERARY") {
    if (!appointment || !origin) {
      setStep("PREP_ORIGIN");
      return null;
    }
    return (
      <DayBeforeItineraryPage
        appointment={appointment}
        origin={origin}
        onBack={() => setStep("PREP_ORIGIN")}
        onNext={(nextPrep, nextCandidates) => {
          setPrep(nextPrep);
          setCandidates(nextCandidates);
          setStep("REVEAL");
        }}
      />
    );
  }

  if (step === "REVEAL") {
    if (!appointment || !prep || !candidates?.length) {
      setStep("PREP_ORIGIN");
      return null;
    }

    return (
      <RevealTodayPage
        appointment={appointment}
        prep={prep}
        candidates={candidates}
        onBack={() => setStep("PREP_ITINERARY")}
        onAccept={({ origin, destination, destinationName }) => {
          const acceptedAt = Date.now();
          setAcceptance({ acceptedAt, origin, destination, destinationName });
          setMissionText(pickMission(acceptedAt)); // RUN에서 “일정(미션)” 노출
          setStep("RUN");
        }}
      />
    );
  }

  if (step === "RUN") {
    if (!acceptance || !prep) {
      resetAll();
      return null;
    }

    return (
      <EscapeRunPage
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
        } } appointment={{
          id: "",
          day: "SAT",
          timeSlot: "MORNING",
          durationMin: 0,
          createdAt: 0
        }}      />
    );
  }

  if (!escapeResult) {
    resetAll();
    return null;
  }
  return <EscapeReviewPage result={escapeResult} onRestart={resetAll} />;
}
