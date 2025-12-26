import type { LatLng } from "../../../shared/types/geo";

export type EscapeAcceptance = {
  acceptedAt: number;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  destinationName?: string | null;
  itineraryLines: string[];
};

export type EscapeCompletionPayload = {
  acceptedAt: number;
  arrivedAt: number | null;
  completedAt: number;
  totalMs: number;
  toArriveMs: number | null;
};

export type EscapeResult = EscapeAcceptance & {
  missionText: string;
  completion: EscapeCompletionPayload;
};
