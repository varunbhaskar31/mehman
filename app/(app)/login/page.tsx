import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginFlow } from "./login-flow";

export const metadata: Metadata = {
  title: "Log in · Mehman",
};

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <main className="mx-auto max-w-md px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-16">
        <Suspense>
          <LoginFlow />
        </Suspense>
      </main>
    </div>
  );
}
