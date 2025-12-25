import React, { useState } from "react";
import FirstScreen, { FirstStartPayload } from "./FirstScreen";
import PickAndRecommendScreen, { TripSessionContext } from "./PickAndRecommendScreen";
import SwipeDemoScreen from "./SwipeDemoScreen";
import EscapeCompleteScreen from "./EscapeCompleteScreen";

type Step = "FIRST" | "PICK" | "SWIPE_DEMO" | "ESCAPE";

export default function App() {
  const [step, setStep] = useState<Step>("FIRST");

  // 1번 화면 결과
  const [startPayload, setStartPayload] = useState<FirstStartPayload | null>(null);

  // 2번 화면(픽)에서 원래는 세션 컨텍스트를 만들지만,
  // 지금은 DB/백엔드 없이 데모로 3번으로 넘어가는 용도로만 유지
  const [tripCtx, setTripCtx] = useState<TripSessionContext | null>(null);

  // 3번에서 수락 → 4번(도착/후기)로 넘길 데이터
  const [acceptedAt, setAcceptedAt] = useState<number | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationName, setDestinationName] = useState<string>("목적지");

  // ---- 화면 렌더 ----
  if (step === "FIRST") {
    return (
      <FirstScreen
        onStart={(payload) => {
          setStartPayload(payload);
          setStep("SWIPE_DEMO");
        }}
      />
    );
  }

  if (step === "SWIPE_DEMO") {
    return (
      <SwipeDemoScreen
        onBack={() => setStep("PICK")}
        onAccept={(p) => {
          setAcceptedAt(p.acceptedAt);
          setOrigin(p.origin);
          setDestination(p.destination);
          setDestinationName(p.destinationName);
          setStep("ESCAPE");
        }}
      />
    );
  }

  // ESCAPE
  return (
    <EscapeCompleteScreen
      acceptedAt={acceptedAt!}
      origin={origin!}
      destination={destination!}
      destinationName={destinationName}
      arrivalRadiusM={50}
      onSubmit={(payload) => {
        // 여기서 나중에 백엔드 저장 API 붙이면 됨
        console.log("ESCAPE SUBMIT", payload);
      }}
    />
  );
}
