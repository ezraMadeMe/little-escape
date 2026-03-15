import { Appointment, AppointmentStatus } from '../types/appointment';

export const needsAppointmentSelection = (appointment: Appointment): boolean =>
  appointment.status === AppointmentStatus.UNLOCKED ||
  (!appointment.missionTitle &&
    (appointment.status === AppointmentStatus.CREATED ||
      appointment.status === AppointmentStatus.PENDING ||
      appointment.status === AppointmentStatus.ACCEPTED));

export const getAppointmentNavigationPath = (appointment: Appointment): string => {
  if (appointment.status === AppointmentStatus.EXPIRED) {
    return `/archived/${appointment.id}`;
  }

  if (needsAppointmentSelection(appointment)) {
    return `/pick-mission/${appointment.id}`;
  }

  return `/mission/${appointment.id}`;
};
