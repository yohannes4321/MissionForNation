import Image from "next/image";
import Link from "next/link";
import { ModeSwitcher } from "@/components/mode-switcher";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <header className="absolute top-0 right-0 flex items-center justify-end p-4">
        <ModeSwitcher />
      </header>
      <div className="flex h-screen flex-col items-center justify-center gap-5 px-5 text-center">
        <Image
          alt="Mission for Nation"
          className="rounded-lg dark:invert"
          height={100}
          src="/mission-for-nation.png"
          width={100}
        />

        <h1 className="font-bold text-4xl">Mission for Nation</h1>

        <p className="text-lg">
          Welcome to Mission for Nation.
        </p>

        <div className="flex gap-2">
          <Link href="/login">
            <Button>Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Signup</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
