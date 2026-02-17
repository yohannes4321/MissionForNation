import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { member, region, type Role } from "@/db/schema";
import { requireSession } from "@/server/authz";

export async function GET(req: Request) {
  const session = await requireSession();
  const url = new URL(req.url);
  const organizationId =
    url.searchParams.get("organizationId") ||
    session.session.activeOrganizationId;

  if (!organizationId) {
    return NextResponse.json({ error: "No active organization" }, { status: 400 });
  }

  const regions = await db.query.region.findMany({
    where: eq(region.organizationId, organizationId),
  });

  return NextResponse.json({ regions });
}

export async function POST(req: Request) {
  const session = await requireSession();
  const body = (await req.json()) as { name?: string; organizationId?: string };

  const organizationId = body.organizationId ?? session.session.activeOrganizationId;
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId required" }, { status: 400 });
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, session.user.id)
    ),
  });

  if (!membership || membership.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = membership.role as Role;
  if (role !== "super_admin") {
    return NextResponse.json({ error: "Only super_admin can create regions" }, { status: 403 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const id = crypto.randomUUID();

  await db.insert(region).values({
    id,
    organizationId,
    name,
  });

  return NextResponse.json({ id }, { status: 201 });
}
