import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { lastLoginMethod, organization } from "better-auth/plugins";
import OrganizationInvitationEmail from "@/components/emails/organization-invitation";
import ForgotPasswordEmail from "@/components/emails/reset-password";
import VerifyEmail from "@/components/emails/verify-email";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import { getActiveOrganization } from "@/server/organizations";
import { admin, member, owner, regional_admin, super_admin } from "./auth/permissions";
import { isEmailEnabled, sendEmail } from "./mailer";

const emailEnabled = isEmailEnabled();

export const auth = betterAuth({
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (!emailEnabled) return;
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        react: VerifyEmail({ username: user.name, verifyUrl: url }),
      });
    },
    sendOnSignUp: emailEnabled,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      if (!emailEnabled) return;
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        react: ForgotPasswordEmail({
          username: user.name,
          resetUrl: url,
          userEmail: user.email,
        }),
      });
    },
    requireEmailVerification: false,
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const activeOrganization = await getActiveOrganization(
            session.userId
          );
          return {
            data: {
              ...session,
              activeOrganizationId: activeOrganization?.id,
            },
          };
        },
      },
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    organization({
      creatorRole: "super_admin",
      schema: {
        invitation: {
          additionalFields: {
            regionId: {
              type: "string",
              required: false,
            },
          },
        },
      },
      organizationHooks: {
        afterAcceptInvitation: async ({ invitation, member }) => {
          // If an invite assigned a region, persist it on the member.
          // The Better Auth core invite flow doesn't automatically map invitation extra fields to member fields.
          const invitedRegionId = (invitation as { regionId?: string | null })
            .regionId;

          if (!invitedRegionId) return;
          if (!member?.id) return;

          // Only meaningful for regional admins
          const roleString = String(member.role ?? "");
          if (!roleString.split(",").map((r) => r.trim()).includes("regional_admin")) {
            return;
          }

          await db
            .update(schema.member)
            .set({ regionId: invitedRegionId })
            .where(eq(schema.member.id, member.id));
        },
      },
      sendInvitationEmail: async (data) => {
        if (!emailEnabled) {
          throw new Error(
            "Email is not configured. Set SMTP_HOST + SMTP_FROM (and SMTP_USER/SMTP_PASS if required)."
          );
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        const inviteLink = appUrl
          ? `${appUrl}/api/accept-invitation/${data.id}`
          : undefined;

        if (!inviteLink) {
          throw new Error(
            "NEXT_PUBLIC_APP_URL is not set. Cannot generate invitation link."
          );
        }

        const result = await sendEmail({
          to: data.email,
          subject: "You've been invited to join our organization",
          react: OrganizationInvitationEmail({
            email: data.email,
            invitedByUsername: data.inviter.user.name,
            invitedByEmail: data.inviter.user.email,
            teamName: data.organization.name,
            inviteLink,
          }),
        });

        if (!result.ok) {
          throw new Error(`Failed to send invitation email: ${result.error}`);
        }
      },
      roles: {
        super_admin,
        regional_admin,
        owner,
        admin,
        member,
      },
    }),
    lastLoginMethod(),
    nextCookies(),
  ],
});
