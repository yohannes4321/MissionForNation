import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await params;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    request.url;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.redirect(
      new URL(
        `/login?invitationId=${encodeURIComponent(invitationId)}`,
        baseUrl
      )
    );
  }

  try {
    const data = await auth.api.acceptInvitation({
      body: {
        invitationId,
      },
      headers: await headers(),
    });

    console.log(data);
    return NextResponse.redirect(new URL("/dashboard/redirect", baseUrl));
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/dashboard", baseUrl));
  }
}
