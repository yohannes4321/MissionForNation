import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { content, member, region, type Role } from "@/db/schema";
import { requireSession } from "@/server/authz";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { contentId } = await params;
  const session = await requireSession();
  const body = (await req.json()) as {
    title?: string | null;
    body?: string | null;
    url?: string | null;
  };

  const item = await db.query.content.findFirst({
    where: eq(content.id, contentId),
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, item.organizationId),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership || membership.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = membership.role as Role;
  const canWriteAny = role === "super_admin" || role === "owner" || role === "admin";
  const canWriteRegional = role === "regional_admin" && membership.regionId === item.regionId;

  if (!canWriteAny && !canWriteRegional) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .update(content)
    .set({
      title: body.title ?? undefined,
      body: body.body ?? undefined,
      url: body.url ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(content.id, contentId));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ contentId: string }> }
) {
  const { contentId } = await params;
  const session = await requireSession();

  const item = await db.query.content.findFirst({
    where: eq(content.id, contentId),
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, item.organizationId),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership || membership.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = membership.role as Role;
  const canWriteAny = role === "super_admin" || role === "owner" || role === "admin";
  const canWriteRegional = role === "regional_admin" && membership.regionId === item.regionId;

  if (!canWriteAny && !canWriteRegional) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(content).where(eq(content.id, contentId));
  return NextResponse.json({ success: true });
}
