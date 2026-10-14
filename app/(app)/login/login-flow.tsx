"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { focusRing, SampleDataNote } from "@/app/_components/app-ui";
import { isValidEmail, primaryButtonClass } from "@/app/_components/fields";
import { MehmanLogo } from "@/app/_components/mehman-logo";
import { signIn, updateProfile } from "@/lib/demo/store";

type Method = "email" | "phone";
type Step =
  | { name: "start" }
  | { name: "code"; method: Method; destination: string }
  | { name: "profile"; fullName: string; phone: string };

const inputClass =
  "mt-2 block h-14 w-full rounded-full bg-[#f7efdd] px-6 text-lg text-[#1c1a17] placeholder:text-[#1c1a17]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory";

// Only same-site paths, so a crafted link can't send people elsewhere.
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/explore";
}

function normalisePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
}

export function LoginFlow() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const uid = useId();
  const [step, setStep] = useState<Step>({ name: "start" });
  const [method, setMethod] = useState<Method>("email");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to each new step's heading for screen readers.
  useEffect(() => {
    if (step.name !== "start") headingRef.current?.focus();
  }, [step.name]);

  function finish(fullName: string) {
    if (fullName.trim()) {
      router.replace(next);
    } else {
      setStep({ name: "profile", fullName: "", phone: "" });
    }
  }

  function continueWithGoogle() {
    // Preview: stands in for Google's sign-in window.
    const result = signIn({ email: "you@gmail.com" });
    if ("error" in result) return setError(result.error);
    finish(result.value.fullName);
  }

  function sendCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (method === "email") {
      if (!isValidEmail(value)) return setError("Please enter a valid email address.");
      setStep({ name: "code", method, destination: value.trim().toLowerCase() });
    } else {
      const phone = normalisePhone(value);
      if (!phone) return setError("Please enter a 10-digit Indian mobile number.");
      setStep({ name: "code", method, destination: phone });
    }
    setCode("");
  }

  function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (step.name !== "code") return;
    if (!/^\d{6}$/.test(code)) return setError("Please enter the 6-digit code.");
    setBusy(true);
    const result = signIn(
      step.method === "email"
        ? { email: step.destination }
        : { phone: step.destination },
    );
    setBusy(false);
    if ("error" in result) return setError(result.error);
    finish(result.value.fullName);
  }

  function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (step.name !== "profile") return;
    if (step.fullName.trim().length < 2) return setError("Please tell us your name.");
    const result = updateProfile({ fullName: step.fullName, phone: step.phone });
    if ("error" in result) return setError(result.error);
    router.replace(next);
  }

  const errorNote = error && (
    <p role="alert" className="mt-3 text-sm text-terracotta-soft">
      {error}
    </p>
  );

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
      <Link href="/explore" className={`self-start rounded ${focusRing}`} aria-label="Mehman, back to Explore">
        <MehmanLogo className="h-12 w-auto" />
      </Link>

      {step.name === "start" && (
        <div className="mt-10">
          <p className="font-[family-name:var(--font-hand)] text-xl text-terracotta-soft">Aao, andar aao</p>
          <h1 className="mt-1 font-serif text-4xl leading-tight">Log in or sign up</h1>
          <p className="mt-2 text-base text-ivory/70">
            To request a seat at a family&rsquo;s table, or to host one.
          </p>

          <button
            type="button"
            onClick={continueWithGoogle}
            className={`mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-ivory text-base font-medium text-[#1c1a17] ${focusRing}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
              <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
              <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7H2.1a11 11 0 0 0 0 10l3.7-2.8z" />
              <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z" />
            </svg>
            Continue with Google
          </button>

          <div className="my-7 flex items-center gap-4 text-xs tracking-[0.2em] text-ivory/45 uppercase">
            <span className="h-px flex-1 bg-ivory/15" />
            or get a code
            <span className="h-px flex-1 bg-ivory/15" />
          </div>

          <div role="tablist" aria-label="Get your code by" className="grid grid-cols-2 rounded-full bg-ivory/[0.06] p-1 text-sm">
            {(["email", "phone"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={method === option}
                onClick={() => {
                  setMethod(option);
                  setValue("");
                  setError(null);
                }}
                className={`h-11 rounded-full transition-colors ${focusRing} ${
                  method === option ? "bg-ivory/15 text-ivory" : "text-ivory/60"
                }`}
              >
                {option === "email" ? "Email" : "Phone"}
              </button>
            ))}
          </div>

          <form noValidate onSubmit={sendCode} className="mt-5">
            <label htmlFor={`${uid}-login`} className="sr-only">
              {method === "email" ? "Email address" : "Mobile number"}
            </label>
            <input
              id={`${uid}-login`}
              type={method === "email" ? "email" : "tel"}
              inputMode={method === "email" ? "email" : "tel"}
              autoComplete={method === "email" ? "email" : "tel-national"}
              placeholder={method === "email" ? "you@example.com" : "98765 43210"}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className={inputClass}
            />
            {errorNote}
            <button type="submit" className={`${primaryButtonClass} mt-4 w-full`}>
              Send me a code
            </button>
          </form>
        </div>
      )}

      {step.name === "code" && (
        <form noValidate onSubmit={verifyCode} className="mt-10">
          <h1 ref={headingRef} tabIndex={-1} className="font-serif text-4xl leading-tight outline-none">
            Check your {step.method === "email" ? "email" : "messages"}
          </h1>
          <p className="mt-2 text-base text-ivory/70">
            We sent a 6-digit code to <span className="text-ivory">{step.destination}</span>.
          </p>
          <label htmlFor={`${uid}-code`} className="sr-only">
            6-digit code
          </label>
          <input
            id={`${uid}-code`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="••••••"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className={`${inputClass} mt-6 text-center text-2xl tracking-[0.6em]`}
          />
          <p className="mt-2 text-center text-xs text-ivory/45">Preview: any 6 digits will work.</p>
          {errorNote}
          <button type="submit" disabled={busy} className={`${primaryButtonClass} mt-5 w-full`}>
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              setStep({ name: "start" });
              setError(null);
            }}
            className={`mt-3 w-full rounded py-3 text-sm text-ivory/70 underline underline-offset-4 ${focusRing}`}
          >
            Use a different {step.method === "email" ? "email" : "number"}
          </button>
        </form>
      )}

      {step.name === "profile" && (
        <form noValidate onSubmit={saveProfile} className="mt-10">
          <h1 ref={headingRef} tabIndex={-1} className="font-serif text-4xl leading-tight outline-none">
            What should your hosts call you?
          </h1>
          <label htmlFor={`${uid}-name`} className="mt-6 block text-sm text-ivory/80">
            Your name
          </label>
          <input
            id={`${uid}-name`}
            autoComplete="name"
            value={step.fullName}
            onChange={(event) => setStep({ ...step, fullName: event.target.value })}
            className={inputClass}
          />
          <label htmlFor={`${uid}-phone`} className="mt-5 block text-sm text-ivory/80">
            Mobile number <span className="text-ivory/50">(optional)</span>
          </label>
          <input
            id={`${uid}-phone`}
            type="tel"
            autoComplete="tel"
            value={step.phone}
            onChange={(event) => setStep({ ...step, phone: event.target.value })}
            className={inputClass}
          />
          <p className="mt-2 text-xs text-ivory/50">
            Shared with a host only after they accept your booking.
          </p>
          {errorNote}
          <button type="submit" className={`${primaryButtonClass} mt-6 w-full`}>
            Done
          </button>
        </form>
      )}

      <div className="mt-auto pt-10">
        <SampleDataNote />
      </div>
    </div>
  );
}
