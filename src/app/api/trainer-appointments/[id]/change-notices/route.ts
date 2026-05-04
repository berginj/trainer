import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { writeAuditEvent } from "@/lib/audit";
import { buildAppointmentChangeEmail } from "@/lib/appointment-notifications";
import { requireOrganizationUserAction } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { appointmentChangeNoticeCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = await parseJsonWithSchema(request, appointmentChangeNoticeCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const appointment = await prisma.trainerAppointment.findUnique({
    where: { id },
    include: { player: true, trainer: true }
  });

  if (!appointment) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Appointment was not found." }, { status: 404 });
  }

  const forbidden = requireOrganizationUserAction(request.headers, {
    organizationId: appointment.organizationId,
    targetUserId: appointment.trainerUserId
  });

  if (forbidden) {
    return forbidden;
  }

  const emailPayload = buildAppointmentChangeEmail({
    athleteName: appointment.player?.preferredName,
    trainerName: appointment.trainer.displayName,
    appointmentTitle: appointment.title,
    originalStartTime: appointment.startTime,
    originalEndTime: appointment.endTime,
    reason: parsed.data.reason,
    customMessage: parsed.data.customMessage,
    oneOffAvailability: parsed.data.oneOffAvailability
  });
  const actorUserId = getRequestActorId(request.headers, parsed.data.actorUserId);
  const notice = await prisma.appointmentChangeNotice.create({
    data: {
      organizationId: appointment.organizationId,
      appointmentId: appointment.id,
      actorUserId,
      changeType: parsed.data.changeType,
      reason: parsed.data.reason,
      customMessage: parsed.data.customMessage,
      oneOffAvailability: parsed.data.oneOffAvailability as Prisma.InputJsonValue,
      emailPayload: emailPayload as Prisma.InputJsonValue,
      deliveryStatus: "prepared"
    }
  });
  const updatedAppointment = await prisma.trainerAppointment.update({
    where: { id: appointment.id },
    data: { status: parsed.data.changeType }
  });

  await writeAuditEvent(prisma, {
    organizationId: appointment.organizationId,
    actorUserId,
    action: "trainer_appointment.change_notice_prepared",
    entityType: "TrainerAppointment",
    entityId: appointment.id,
    metadata: { changeType: parsed.data.changeType }
  });

  return NextResponse.json({ appointment: updatedAppointment, notice, emailPayload }, { status: 201 });
}
