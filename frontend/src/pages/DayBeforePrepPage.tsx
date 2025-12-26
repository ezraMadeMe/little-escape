import React, { useMemo, useState } from "react";
import type {
  Appointment,
  AppointmentPrep,
  DestinationCandidate,
  TravelBreakdown,
  TravelMode,
} from "../features/appointment/model/types";
import type { LatLng } from "../shared/types/geo";
import { REVEAL_DEMO } from "../data/demo/revealDemo";
import { distanceM } from "../features/escape/model/geo";

type DemoItem = {
  id: string;
  name: string;
  subtitle?: string;
  point: LatLng;
};

export function DayBeforePrepPage(props: {
  appointment: Appointment;
  origin: LatLng;
  onBack: () => void;
  onNext: (prep: AppointmentPrep, candidates: DestinationCandidate[]) => void;
}) {
  const [travelMode, setTravelMode] = useState<TravelMode>("TRANSIT");
  const [origin, setOrigin] = useState<LatLng>(props.origin);

  const pool = useMemo(() => {
    const raw = (REVEAL_DEMO as any[]) ?? [];
    return raw.map((it, idx) => ({
      id: String(it.id ?? idx),
      name: it.name ?? `Spot ${idx + 1}`,
      subtitle: it.subtitle ?? "",
      point: it.point as LatLng,
    })) as DemoItem[];
  }, []);

  const candidates = useMemo(() => {
    return buildCandidates(pool, origin, props.appointment, travelMode).slice(0, 5);
  }, [pool, origin, props.appointment, travelMode]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is unavailable in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Unable to fetch your location. Please allow location access."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ margin: 0 }}>Day-before prep</h2>
      <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
        Choose how you plan to travel and confirm a few candidate destinations.
      </div>

      <div style={{ marginTop: 14, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <div style={{ fontWeight: 900 }}>Appointment</div>
        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
          Duration: {props.appointment.durationMin} min · Time: {prettyTimeSlot(props.appointment.timeSlot)}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Travel mode</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 340 }}>
          {(["TRANSIT", "WALK", "BICYCLE", "CAR"] as TravelMode[]).map((m) => (
            <button key={m} onClick={() => setTravelMode(m)} style={chip(travelMode === m)}>
              {prettyMode(m)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <div style={{ fontWeight: 900 }}>Origin</div>
        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
          {origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={useCurrentLocation}>Use current location</button>
          <button onClick={() => setOrigin(props.origin)}>Reset to appointment origin</button>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Top picks (up to 5)</div>

        {candidates.length === 0 ? (
          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12, opacity: 0.7 }}>
            No matching candidates. Try a different mode or change origin.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {candidates.map((c) => (
              <div key={c.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>
                  <b>Travel</b>: {c.travel.summary}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{c.travel.summary}</div>
                </div>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.4 }}>
                  {c.itineraryLines.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>

                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: "pointer", fontSize: 12, opacity: 0.8 }}>Coordinates</summary>
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                    {c.point.lat.toFixed(5)}, {c.point.lng.toFixed(5)}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button onClick={props.onBack}>Back</button>
        <button
          style={btnPrimary}
          onClick={() =>
            props.onNext(
              {
                appointmentId: props.appointment.id,
                travelMode,
                preparedAt: Date.now(),
                id: props.appointment.id,
                originLat: props.origin.lat,
                originLng: props.origin.lng,
              },
              candidates
            )
          }
          disabled={candidates.length === 0}
        >
          Save prep
        </button>
      </div>
    </div>
  );
}

function prettyMode(m: TravelMode) {
  return m === "TRANSIT" ? "Transit" : m === "WALK" ? "Walk" : m === "BICYCLE" ? "Bike" : "Car";
}

function prettyTimeSlot(t: Appointment["timeSlot"]) {
  return t === "MORNING" ? "Morning" : t === "AFTERNOON" ? "Afternoon" : "Evening";
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

function buildCandidates(
  pool: DemoItem[],
  origin: LatLng,
  appointment: Appointment,
  mode: TravelMode
): DestinationCandidate[] {
  return shuffle(pool)
    .map((it) => {
      const d = distanceM(origin, it.point);
      const travel = buildTravelBreakdown(mode, d);
      const itineraryLines = buildItinerary(appointment, travel.totalMin, it.subtitle);

      return {
        id: it.id,
        point: it.point,
        itineraryLines,
        travel,
      } satisfies DestinationCandidate;
    })
    .filter((c) => c.travel.totalMin <= 240) // drop overly long options
    .sort((a, b) => a.travel.totalMin - b.travel.totalMin);
}

function buildTravelBreakdown(mode: TravelMode, distanceMeters: number): TravelBreakdown {
  const speedMpm =
    mode === "WALK" ? 80 : mode === "BICYCLE" ? 220 : mode === "TRANSIT" ? 350 : 550;

  const ride = Math.max(1, Math.round(distanceMeters / speedMpm));
  const wait = mode === "TRANSIT" ? 6 : 0;
  const transfer = mode === "TRANSIT" ? 4 : 0;
  const buffer = mode === "CAR" ? 8 : mode === "BICYCLE" ? 3 : 0;
  const lastMile = mode === "TRANSIT" ? clamp(Math.round(distanceMeters / 2500) + 4, 4, 10) : 0;

  const lines = [
    wait ? { label: "Wait", min: wait } : null,
    transfer ? { label: "Transfer", min: transfer } : null,
    mode === "TRANSIT" ? { label: "Ride", min: ride } : null,
    mode === "WALK" ? { label: "Walk", min: ride } : null,
    mode === "BICYCLE" ? { label: "Bike", min: ride } : null,
    mode === "CAR" ? { label: "Drive", min: ride } : null,
    lastMile ? { label: "Last mile walk", min: lastMile } : null,
    buffer ? { label: "Buffer", min: buffer } : null,
  ].filter(Boolean) as TravelBreakdown["lines"];

  const total = lines.reduce((sum, l) => sum + l.min, 0);
  const summary = `${prettyMode(mode)} · ${total} min`;

  return { totalMin: total, lines, summary };
}

function buildItinerary(a: Appointment, etaMin: number, subtitle?: string): string[] {
  const usable = Math.max(20, a.durationMin - Math.min(etaMin, 30));
  const first = Math.max(10, Math.round(usable * 0.45));
  const second = Math.max(10, usable - first);

  const slot =
    a.timeSlot === "MORNING" ? "morning" : a.timeSlot === "AFTERNOON" ? "afternoon" : "evening";

  const lines = [
    `Itinerary 1 (${first} min): nearby walk & coffee (${slot})`,
    `Itinerary 2 (${second} min): quick local spot (+ photo)`,
  ];

  if (subtitle) lines.unshift(subtitle);
  return lines;
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
