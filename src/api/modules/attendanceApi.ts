import { apiRequest } from "../client";
import type { Attendance } from "../../domain/entities";
import { getList, toQueryString } from "./utils";

export type CheckinPayload = {
  childId: string;
  responsibleIdWhoCheckedInId?: string;
  notes?: string;
  companyId?: string;
};

export type CheckoutPayload = {
  childId: string;
  responsibleDocument: string;
  notes?: string;
  companyId?: string;
};

export async function listAttendances(companyId?: string) {
  return getList<Attendance>(`/v2/attendance${toQueryString({ companyId })}`);
}

export async function checkin(payload: CheckinPayload) {
  return apiRequest<Attendance>("/v2/attendance/checkin", {
    method: "POST",
    body: payload,
  });
}

export async function checkout(payload: CheckoutPayload) {
  return apiRequest<Attendance>("/v2/attendance/checkout", {
    method: "POST",
    body: payload,
  });
}

export async function deleteAttendance(attendanceId: string) {
  return apiRequest<void>(`/v2/attendance/${attendanceId}`, {
    method: "DELETE",
  });
}
