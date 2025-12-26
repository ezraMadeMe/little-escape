import { LatLng } from "../../../shared/types/geo";

export type TravelMode = "CAR" | "TRANSIT" | "WALK" | "BICYCLE";
export type Day = "MON"|"TUE"|"WED"|"THU"|"FRI"|"SAT"|"SUN";
export type TimeSlot = "MORNING"|"AFTERNOON"|"EVENING"|"NIGHT";

export type AppointmentCreateReq = { 
  day: Day; 
  timeSlot: TimeSlot; 
  durationMin: number 
};

export type AppointmentRes = { 
  id: string; 
  day: Day; 
  timeSlot: TimeSlot; 
  durationMin: number; 
  createdAt: number 
};

export type CreatePrepReq = { 
  travelMode: TravelMode; 
  originLat: number; 
  originLng: number 
};

export type PrepRes = {
  id: string;
  appointmentId: string;
  travelMode: TravelMode;
  originLat: number;
  originLng: number;
  preparedAt: number;
};

export type Point = { 
  lat: number; 
  lng: number 
};

export type TravelLine = { 
  label: string; 
  min: number 
};

export type CandidateRes = {
  id: string;
  point: Point;
  itineraryLines: string[];
  travel: TravelBreakdown;
};

// 서버 DTO 그대로
export type PrepWithCandidatesRes = {
  prep: {
    id: string;
    appointmentId: string;
    travelMode: TravelMode;
    originLat: number;
    originLng: number;
    preparedAt: number;
  };
  candidates: Array<{
    id: string;
    point: { lat: number; lng: number };
    itineraryLines: string[];
    travel: { totalMin: number; summary: string; lines: Array<{ label: string; min: number }> };
  }>;
};

export type Appointment = {
  id: string;
  day: Day;
  timeSlot: TimeSlot;
  durationMin: number;
  createdAt: number;
};

export type AppointmentPrep = {
  id: string;
  appointmentId: string;
  travelMode: TravelMode;
  originLat: number;
  originLng: number;
  preparedAt: number;
};

export type TravelBreakdown = {
  totalMin: number;
  lines: { label: string; min: number }[]; 
  summary: string;
};

export type DestinationCandidate = {
  id: string;
  point: LatLng;
  itineraryLines: string[]; 
  travel: {
    totalMin: number;
    summary: string;
    lines: Array<{ label: string; min: number }>;
  };
};
