"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { member, type Role } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getCurrentUser } from "./users";

export const addMember = async (
  organizationId: string,
  userId: string,
  role: Role
) => {
  try {
    await auth.api.addMember({
      body: {
        userId,
        organizationId,
        role,
      },
    });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to add member.");
  }
};

export const removeMember = async (memberId: string) => {
  const session = await getCurrentUser();

  const target = await db.query.member.findFirst({
    where: eq(member.id, memberId),
  });

  if (!target) {
    return { success: false, error: "Member not found." };
  }

  const actor = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, target.organizationId),
      eq(member.userId, session.currentUser.id)
    ),
  });

  if (!actor) {
    return { success: false, error: "You are not authorized to remove members." };
  }

  const actorRole = actor.role as Role;
  const canRemove =
    actorRole === "super_admin" || actorRole === "owner" || actorRole === "admin";

  if (!canRemove) {
    return { success: false, error: "You are not authorized to remove members." };
  }

  try {
    await db.delete(member).where(eq(member.id, memberId));

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to remove member.",
    };
  }
};
