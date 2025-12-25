import React, { useState } from "react";
import type { EscapeResult } from "../features/escape/model/types";
import { formatDuration } from "../shared/lib/format";

export function EscapeReviewPage(props: { result: EscapeResult; onRestart: () => void }) {
  const [rating, setRating] = useState(4);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { completion } = props.result;

  return (
    <div style={{ padding: 20 }}>
      <h2>Review</h2>

      <div style={{ marginTop: 10, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <div><b>목적지</b>: {props.result.destinationName}</div>
        <div><b>미션</b>: {props.result.missionText}</div>
        <div style={{ marginTop: 6, opacity: 0.85 }}>
          총 소요: {formatDuration(completion.totalMs)} / 도착까지:{" "}
          {completion.toArriveMs == null ? "미기록" : formatDuration(completion.toArriveMs)}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div>사진(모킹)</div>
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        {photo && <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>{photo.name}</div>}
      </div>

      <div style={{ marginTop: 14 }}>
        <div>별점</div>
        <input
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          style={{ width: 80 }}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <div>후기</div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} style={{ width: "100%", maxWidth: 560 }} />
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button onClick={() => setSubmitted(true)}>제출(모킹)</button>
        <button onClick={props.onRestart}>처음으로</button>
      </div>

      {submitted && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          ✅ 제출 완료(모킹). 별점 {rating}, 후기 길이 {text.length}자
        </div>
      )}
    </div>
  );
}
