export type TimeSlot = "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT"; // 서버 enum에 맞게 조정
export type TravelMode = "CAR" | "TRANSIT" | "WALK" | "BICYCLE";
export type Day = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";



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
  preparedAt: number;       // long
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
  appointmentId: string;
  travelMode: TravelMode;
  origin: { lat: number; lng: number };
  preparedAt: number;
};

export type TravelBreakdown = {
  totalMin: number;
  lines: { label: string; min: number }[]; // 예: 대기 6, 환승 4, 탑승 12, 도보 5
  summary: string; // 예: "대중교통 27분"
};

export type DestinationCandidate = {
  id: string;
  point: { lat: number; lng: number }; // 지도에 찍힐 대략 위치(이름 없이)
  itineraryTitle: string;              // "이곳의 일정"
  itineraryLines: string[];            // 일정 텍스트 2~3줄
  travel: TravelBreakdown;             // 팝업에서만 보여줄 이동 소요
};
