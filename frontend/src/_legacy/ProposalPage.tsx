import React, { useState } from "react";
import type { Proposal } from "../features/appointment/model/types";

export function ProposalPage(props: { onNext: (p: Proposal) => void }) {
  const [weekendOnly, setWeekendOnly] = useState(true);
  const [durationMin, setDurationMin] = useState(90);

  return (
    <div style={{ padding: 20 }}>
      <h2>Proposal</h2>

      <label style={{ display: "block", marginTop: 12 }}>
        <input
          type="checkbox"
          checked={weekendOnly}
          onChange={(e) => setWeekendOnly(e.target.checked)}
        />
        {" "}주말만
      </label>

      <label style={{ display: "block", marginTop: 12 }}>
        길이(분):
        {" "}
        <input
          type="number"
          min={30}
          step={10}
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
          style={{ width: 100, marginLeft: 8 }}
        />
      </label>

      <button
        style={{ marginTop: 16 }}
        onClick={() => props.onNext({ weekendOnly, durationMin })}
      >
        다음
      </button>
    </div>
  );
}
