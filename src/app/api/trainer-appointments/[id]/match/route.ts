import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { writeAuditEvent } from "@/lib/audit";
import { requireOrganizationUserAction } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { appointmentMatchUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = await parseJsonWithSchema(request, appointmentMatchUpdateSchema);

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

  if (parsed.data.status === "matched" && !parsed.data.playerId) {
    return NextResponse.json({ code: "VALIDATION_FAILED", message: "playerId is required to confirm a match." }, { status: 400 });
  }

  const actorUserId = getRequestActorId(request.headers, parsed.data.actorUserId);
  const match = await prisma.appointmentAthleteMatch.create({
    data: {
      organizationId: appointment.organizationId,
      appointmentId: appointment.id,
      playerId: parsed.data.playerId,
      status: parsed.data.status,
      confidence: parsed.data.status === "matched" ? 100 : 0,
      reason: parsed.data.status === "matched" ? "Trainer confirmed athlete match." : "Trainer ignored appointment.",
      signals: { source: "trainer_review" } as Prisma.InputJsonValue,
      confirmedByUserId: actorUserId,
      confirmedAt: new Date()
    }
  });
  const updatedAppointment = await prisma.trainerAppointment.update({
    where: { id: appointment.id },
    data: {
      playerId: parsed.data.status === "matched" ? parsed.data.playerId : null,
      status: parsed.data.status === "matched" ? "matched" : "ignored"
    }
  });

  await writeAuditEvent(prisma, {
    organizationId: appointment.organizationId,
    actorUserId,
    action: parsed.data.status === "matched" ? "trainer_appointment.match_confirmed" : "trainer_appointment.ignored",
    entityType: "TrainerAppointment",
    entityId: appointment.id
  });

  return NextResponse.json({ appointment: updatedAppointment, match });
}
