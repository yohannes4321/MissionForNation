import Image from "next/image";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          className="flex items-center gap-2 self-center font-medium"
          href="/"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Image
              alt="Mission for Nation Logo"
              height={50}
              priority
              src={"/mission-for-nation.png"}
              width={50}
            />
          </div>
          Mission for Nation
        </Link>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
