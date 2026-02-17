import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import OrganizationInvitationEmail from "@/components/emails/organization-invitation";
import { db } from "@/db/drizzle";
import { invitation, member, organization, user, type Role } from "@/db/schema";
import { sendEmail } from "@/lib/mailer";
import { requireSession } from "@/server/authz";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await params;
  const session = await requireSession();

  const invite = await db.query.invitation.findFirst({
    where: eq(invitation.id, invitationId),
  });

  if (!invite) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  const actor = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, invite.organizationId),
      eq(member.userId, session.user.id)
    ),
  });

  if (!actor || actor.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const actorRole = actor.role as Role;
  if (actorRole !== "super_admin") {
    return NextResponse.json({ error: "Only super_admin can resend invites" }, { status: 403 });
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, invite.organizationId),
  });

  const inviter = await db.query.user.findFirst({
    where: eq(user.id, invite.inviterId),
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL is not set" },
      { status: 400 }
    );
  }

  const inviteLink = `${appUrl}/api/accept-invitation/${invite.id}`;

  const result = await sendEmail({
    to: invite.email,
    subject: "You've been invited to join our organization",
    react: OrganizationInvitationEmail({
      email: invite.email,
      invitedByUsername: inviter?.name || "Admin",
      invitedByEmail: inviter?.email || "",
      teamName: org?.name || "Organization",
      inviteLink,
    }),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
