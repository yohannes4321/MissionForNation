import "server-only";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { member, region, type Role } from "@/db/schema";
import { auth } from "@/lib/auth";

export type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;

export const requireSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
};

export const requireOrgMember = async (organizationId: string) => {
  const session = await requireSession();

  const membership = await db.query.member.findFirst({
    where: and(eq(member.organizationId, organizationId), eq(member.userId, session.user.id)),
  });

  if (!membership) {
    throw new Error("FORBIDDEN");
  }

  return { session, membership };
};

export const requireRole = (membershipRole: Role, allowed: Role[]) => {
  if (!allowed.includes(membershipRole)) {
    throw new Error("FORBIDDEN");
  }
};

export const requireRegionAccess = async (
  membership: typeof member.$inferSelect,
  regionId: string
) => {
  const regionRecord = await db.query.region.findFirst({
    where: eq(region.id, regionId),
  });

  if (!regionRecord) {
    throw new Error("NOT_FOUND");
  }

  if (membership.organizationId !== regionRecord.organizationId) {
    throw new Error("FORBIDDEN");
  }

  const role = membership.role as Role;

  if (role === "regional_admin") {
    if (!membership.regionId || membership.regionId !== regionId) {
      throw new Error("FORBIDDEN");
    }
  }

  return regionRecord;
};
