"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import {
  isValidEmail,
  primaryButtonClass,
  SelectField,
  TextField,
} from "@/app/_components/fields";
import { BackLink } from "@/app/_components/site-header";
import {
  cultureHref,
  culturalRegions,
  diningCities,
  exploreHref,
  findCity,
  findRegion,
  type CulturalRegion,
  type DiningCity,
} from "@/data/discovery";
import { useSelection } from "@/lib/use-selection";

export function EarlyAccess() {
  const { ready, city, region } = useSelection(["city", "region"]);
  if (!ready) return <div className="min-h-[40rem]" />;
  return <GuestForm initialCity={city} initialRegion={region} />;
}

type Errors = Partial<Record<"name" | "email" | "consent", string>>;

type Submission = { name: string; city: DiningCity; region: CulturalRegion };

function GuestForm({
  initialCity,
  initialRegion,
}: {
  initialCity: DiningCity;
  initialRegion: CulturalRegion;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cityId, setCityId] = useState(initialCity.id);
  const [regionId, setRegionId] = useState(initialRegion.id);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submission, setSubmission] = useState<Submission | null>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  // Unique ids: Next keeps recently visited pages mounted (hidden), so
  // fixed ids could collide with another page's form.
  const uid = useId();
  const fieldId = (field: string) => `${uid}-${field}`;

  const city = findCity(cityId) ?? initialCity;
  const region = findRegion(regionId) ?? initialRegion;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Please enter your name.";
    if (!isValidEmail(email))
      next.email = "Please enter a valid email address.";
    if (!consent) next.consent = "Please confirm we may contact you.";
    setErrors(next);

    const firstInvalid = (["name", "email", "consent"] as const).find(
      (field) => next[field],
    );
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }

    // Demo only: the submission stays in this component and is not sent.
    setSubmission({ name: name.trim(), city, region });
    requestAnimationFrame(() => confirmationRef.current?.focus());
  }

  if (submission) {
    return (
      <div role="status">
        <h1
          ref={confirmationRef}
          tabIndex={-1}
          className="font-serif text-4xl leading-tight outline-none md:text-5xl"
        >
          Thank you, {submission.name}.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ivory/85">
          Your interest has been recorded in this demo. The live waitlist is not
          connected yet.
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-ivory/15 pt-6">
          <div>
            <dt className="text-xs tracking-[0.2em] text-ivory/55 uppercase">
              Dining city
            </dt>
            <dd className="mt-1 font-serif text-xl">{submission.city.name}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.2em] text-ivory/55 uppercase">
              Culture
            </dt>
            <dd className="mt-1 font-serif text-xl">
              {submission.region.name}
            </dd>
          </div>
        </dl>
        <Link
          href={exploreHref(submission.city, submission.region)}
          className={`${primaryButtonClass} mt-10 w-full md:w-auto`}
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <>
      <BackLink href={cultureHref(initialRegion, initialCity)}>
        Back to {initialRegion.name}
      </BackLink>
      <h1 className="mt-6 font-serif text-5xl leading-[1.05] md:mt-10 md:text-6xl">
        Get early access
      </h1>
      <p className="mt-4 text-lg text-ivory/75">
        Tell us where you&rsquo;d like to dine and what you&rsquo;d like to
        taste.
      </p>

      <form noValidate onSubmit={handleSubmit} className="mt-10 space-y-6">
        <TextField
          id={fieldId("name")}
          label="Name"
          autoComplete="name"
          value={name}
          onChange={setName}
          error={errors.name}
          maxLength={80}
        />
        <TextField
          id={fieldId("email")}
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          maxLength={120}
        />
        <SelectField
          id={fieldId("city")}
          label="Dining city"
          value={cityId}
          onChange={setCityId}
          options={diningCities}
        />
        <SelectField
          id={fieldId("region")}
          label="Cultural region of interest"
          value={regionId}
          onChange={setRegionId}
          options={culturalRegions}
        />

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-base leading-relaxed text-ivory/85">
            <input
              id={fieldId("consent")}
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={
                errors.consent ? fieldId("consent-error") : undefined
              }
              className="mt-1 size-5 shrink-0 cursor-pointer accent-terracotta"
            />
            I agree that Mehman may use these details to contact me about
            Mehman&rsquo;s launch.
          </label>
          {errors.consent && (
            <p
              id={fieldId("consent-error")}
              className="mt-1.5 text-sm text-terracotta-soft"
            >
              {errors.consent}
            </p>
          )}
        </div>

        <p className="text-sm text-ivory/50">
          This is a demo. Your details stay in this browser tab and are not sent
          anywhere.
        </p>

        <button
          type="submit"
          className={`${primaryButtonClass} w-full md:w-auto`}
        >
          Get early access
        </button>
      </form>
    </>
  );
}
