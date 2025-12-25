import type { LatLng } from "../../../shared/types/geo";

export type EscapeAcceptance = {
  acceptedAt: number;
  origin: LatLng;
  destination: LatLng;
  destinationName: string;
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
