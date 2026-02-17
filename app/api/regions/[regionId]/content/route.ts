import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { content, member, region, type Role } from "@/db/schema";
import { requireSession } from "@/server/authz";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ regionId: string }> }
) {
  const { regionId } = await params;
  const session = await requireSession();

  const regionRecord = await db.query.region.findFirst({
    where: eq(region.id, regionId),
  });

  if (!regionRecord) {
    return NextResponse.json({ error: "Region not found" }, { status: 404 });
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, regionRecord.organizationId),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership || membership.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await db.query.content.findMany({
    where: eq(content.regionId, regionId),
  });

  return NextResponse.json({ items });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ regionId: string }> }
) {
  const { regionId } = await params;
  const session = await requireSession();
  const body = (await req.json()) as {
    type?: "text" | "link" | "photo" | "video";
    title?: string;
    body?: string;
    url?: string;
  };

  const regionRecord = await db.query.region.findFirst({
    where: eq(region.id, regionId),
  });

  if (!regionRecord) {
    return NextResponse.json({ error: "Region not found" }, { status: 404 });
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, regionRecord.organizationId),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership || membership.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = membership.role as Role;
  const canWriteAny = role === "super_admin" || role === "owner" || role === "admin";
  const canWriteRegional = role === "regional_admin" && membership.regionId === regionId;

  if (!canWriteAny && !canWriteRegional) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!body.type) {
    return NextResponse.json({ error: "type required" }, { status: 400 });
  }

  const id = crypto.randomUUID();

  await db.insert(content).values({
    id,
    organizationId: regionRecord.organizationId,
    regionId,
    createdByUserId: session.user.id,
    type: body.type,
    title: body.title,
    body: body.body,
    url: body.url,
  });

  return NextResponse.json({ id }, { status: 201 });
}
