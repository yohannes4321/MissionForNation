import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { member, region, type Role } from "@/db/schema";
import { requireSession } from "@/server/authz";

const allowedRoles: Role[] = [
  "member",
  "regional_admin",
  "admin",
  "owner",
  "super_admin",
];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const session = await requireSession();
  const body = (await req.json()) as { role?: Role; regionId?: string | null };

  const target = await db.query.member.findFirst({
    where: eq(member.id, memberId),
  });

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const actor = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, target.organizationId),
      eq(member.userId, session.user.id)
    ),
  });

  if (!actor || actor.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const actorRole = actor.role as Role;
  if (actorRole !== "super_admin") {
    return NextResponse.json({ error: "Only super_admin can change roles" }, { status: 403 });
  }

  const nextRole = body.role;
  if (!nextRole || !allowedRoles.includes(nextRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  let regionId: string | null | undefined = body.regionId;
  if (nextRole === "regional_admin") {
    if (!regionId) {
      return NextResponse.json({ error: "regionId required for regional_admin" }, { status: 400 });
    }

    const regionRecord = await db.query.region.findFirst({
      where: eq(region.id, regionId),
    });

    if (!regionRecord || regionRecord.organizationId !== target.organizationId) {
      return NextResponse.json({ error: "Invalid regionId" }, { status: 400 });
    }
  } else {
    regionId = null;
  }

  await db
    .update(member)
    .set({
      role: nextRole,
      regionId,
    })
    .where(eq(member.id, memberId));

  return NextResponse.json({ success: true });
}
