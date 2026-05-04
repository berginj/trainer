export type AppointmentChangeEmailInput = {
  athleteName?: string | null;
  trainerName?: string | null;
  appointmentTitle: string;
  originalStartTime: Date;
  originalEndTime: Date;
  reason: string;
  customMessage?: string | null;
  oneOffAvailability?: Array<{
    startTime: string;
    endTime: string;
    label?: string;
  }>;
};

export function buildAppointmentChangeEmail(input: AppointmentChangeEmailInput) {
  const trainerName = input.trainerName ?? "Your trainer";
  const availability = input.oneOffAvailability ?? [];
  const availabilityText =
    availability.length > 0
      ? `\n\nPossible make-up times:\n${availability
          .map((slot) => `- ${slot.label ? `${slot.label}: ` : ""}${slot.startTime} to ${slot.endTime}`)
          .join("\n")}`
      : "\n\nPlease reply with availability so we can coordinate a make-up time.";

  return {
    subject: `Schedule change: ${input.appointmentTitle}`,
    text: [
      `Hi${input.athleteName ? ` ${input.athleteName}` : ""},`,
      "",
      `${trainerName} marked your appointment as changed.`,
      `Original time: ${input.originalStartTime.toISOString()} to ${input.originalEndTime.toISOString()}`,
      `Reason: ${input.reason}`,
      input.customMessage ? `\n${input.customMessage}` : "",
      availabilityText
    ]
      .filter(Boolean)
      .join("\n")
  };
}

