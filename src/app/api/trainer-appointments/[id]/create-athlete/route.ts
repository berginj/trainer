import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { writeAuditEvent } from "@/lib/audit";
import { requireOrganizationUserAction } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { appointmentCreateAthleteSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = await parseJsonWithSchema(request, appointmentCreateAthleteSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const appointment = await prisma.trainerAppointment.findUnique({ where: { id } });

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

  const actorUserId = getRequestActorId(request.headers, parsed.data.actorUserId);
  const player = await prisma.player.create({
    data: {
      organizationId: appointment.organizationId,
      preferredName: parsed.data.preferredName,
      dateOfBirth: parsed.data.dateOfBirth,
      sexAtBirth: parsed.data.sexAtBirth,
      sports: parsed.data.sports,
      positions: parsed.data.positions
    }
  });
  const match = await prisma.appointmentAthleteMatch.create({
    data: {
      organizationId: appointment.organizationId,
      appointmentId: appointment.id,
      playerId: player.id,
      status: "matched",
      confidence: 100,
      reason: "Trainer created a new athlete from an imported appointment.",
      signals: { source: "create_athlete_from_appointment" } as Prisma.InputJsonValue,
      confirmedByUserId: actorUserId,
      confirmedAt: new Date()
    }
  });
  const updatedAppointment = await prisma.trainerAppointment.update({
    where: { id: appointment.id },
    data: { playerId: player.id, status: "matched" }
  });

  await writeAuditEvent(prisma, {
    organizationId: appointment.organizationId,
    actorUserId,
    action: "trainer_appointment.athlete_created",
    entityType: "TrainerAppointment",
    entityId: appointment.id,
    metadata: { playerId: player.id }
  });

  return NextResponse.json({ appointment: updatedAppointment, player, match }, { status: 201 });
}
