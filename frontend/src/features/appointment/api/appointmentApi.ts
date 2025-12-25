import { apiData } from "../../../shared/lib/api";
import type {
  AppointmentCreateReq,
  AppointmentRes,
  CreatePrepReq,
  PrepWithCandidatesRes,
} from "../model/types";

const BASE = "/api/v1/appointments"; // ✅ vite proxy 쓰면 /api 그대로 가능

export function createAppointment(body: AppointmentCreateReq) {
  return apiData<AppointmentRes>(BASE, { method: "POST", body: JSON.stringify(body) });
}

export function createPrep(appointmentId: string, body: CreatePrepReq) {
  return apiData<PrepWithCandidatesRes>(`${BASE}/${appointmentId}/prep`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function reveal(appointmentId: string) {
  return apiData<PrepWithCandidatesRes>(`${BASE}/${appointmentId}/reveal`);
}
