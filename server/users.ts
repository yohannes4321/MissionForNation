"use server";

import { and, eq, inArray, not } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { member, user } from "@/db/schema";
import { auth } from "@/lib/auth";

const maybePromoteSuperAdmin = async (input: {
  activeOrganizationId: string | null;
  userId: string;
  userEmail: string;
}) => {
  const configuredEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!configuredEmail) return;
  if (!input.activeOrganizationId) return;
  if (input.userEmail.trim().toLowerCase() !== configuredEmail) return;

  // Ensure user is actually a member of the active org
  const currentMembership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, input.activeOrganizationId),
      eq(member.userId, input.userId)
    ),
  });

  if (!currentMembership) return;
  if (currentMembership.role === "super_admin") return;

  await db
    .update(member)
    .set({ role: "super_admin", regionId: null })
    .where(
      and(
        eq(member.organizationId, input.activeOrganizationId),
        eq(member.userId, input.userId)
      )
    );
};

export const getCurrentUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!currentUser) {
    redirect("/login");
  }

  await maybePromoteSuperAdmin({
    activeOrganizationId: session.session.activeOrganizationId ?? null,
    userId: session.user.id,
    userEmail: currentUser.email,
  });

  return {
    ...session,
    currentUser,
  };
};

export const signIn = async (email: string, password: string) => {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error) {
    const e = error as Error;

    return {
      success: false,
      message: e.message || "An unknown error occurred.",
    };
  }
};

export const signUp = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: username,
      },
    });

    return {
      success: true,
      message: "Signed up successfully.",
    };
  } catch (error) {
    const e = error as Error;

    return {
      success: false,
      message: e.message || "An unknown error occurred.",
    };
  }
};

export const getUsers = async (organizationId: string) => {
  try {
    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
    });

    const memberUserIds = members.map((m) => m.userId);

    if (memberUserIds.length === 0) {
      return await db.query.user.findMany();
    }

    const users = await db.query.user.findMany({
      where: not(
        inArray(
          user.id,
          memberUserIds
        )
      ),
    });

    return users;
  } catch (error) {
    console.error(error);
    return [];
  }
};
