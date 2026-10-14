"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import {
  isValidEmail,
  primaryButtonClass,
  TextField,
} from "@/app/_components/fields";

const fields = ["name", "email", "city", "cuisine", "note"] as const;
type Field = (typeof fields)[number];
type Values = Record<Field, string>;

const empty: Values = { name: "", email: "", city: "", cuisine: "", note: "" };

function validate(values: Values) {
  const errors: Partial<Record<Field, string>> = {};
  if (values.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!isValidEmail(values.email))
    errors.email = "Please enter a valid email address.";
  if (values.city.trim().length < 2)
    errors.city = "Please tell us which city you live in.";
  if (values.cuisine.trim().length < 2)
    errors.cuisine = "Please tell us what your family cooks.";
  if (values.note.trim().length < 10)
    errors.note = "Please write a few words (at least 10 characters).";
  return errors;
}

export function HostForm() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  // Unique ids: Next keeps recently visited pages mounted (hidden).
  const uid = useId();
  const fieldId = (field: Field) => `${uid}-${field}`;

  const set = (field: Field) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate(values);
    setErrors(next);
    const firstInvalid = fields.find((field) => next[field]);
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }
    // Demo only: nothing is sent to a server.
    setSubmittedName(values.name.trim());
    requestAnimationFrame(() => confirmationRef.current?.focus());
  }

  if (submittedName) {
    return (
      <div role="status">
        <h2
          ref={confirmationRef}
          tabIndex={-1}
          className="font-serif text-4xl leading-tight outline-none"
        >
          Thank you, {submittedName}.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-ivory/85">
          Your interest in hosting has been recorded in this demo. Host
          applications are not connected yet.
        </p>
        <Link
          href="/explore"
          className={`${primaryButtonClass} mt-10 w-full md:w-auto`}
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      <TextField
        id={fieldId("name")}
        label="Name"
        autoComplete="name"
        value={values.name}
        onChange={set("name")}
        error={errors.name}
        maxLength={80}
      />
      <TextField
        id={fieldId("email")}
        label="Email"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={set("email")}
        error={errors.email}
        maxLength={120}
      />
      <TextField
        id={fieldId("city")}
        label="City"
        autoComplete="address-level2"
        value={values.city}
        onChange={set("city")}
        error={errors.city}
        maxLength={60}
      />
      <TextField
        id={fieldId("cuisine")}
        label="Cuisine or cultural tradition"
        hint="For example, Chettinad, Kumaoni or Sindhi home cooking."
        value={values.cuisine}
        onChange={set("cuisine")}
        error={errors.cuisine}
        maxLength={80}
      />
      <TextField
        id={fieldId("note")}
        label="Why would you like to host?"
        multiline
        value={values.note}
        onChange={set("note")}
        error={errors.note}
        maxLength={600}
      />
      <p className="text-sm text-ivory/50">
        This is a demo. Your details stay in this browser tab and are not sent
        anywhere.
      </p>
      <button
        type="submit"
        className={`${primaryButtonClass} w-full md:w-auto`}
      >
        Share my interest
      </button>
    </form>
  );
}
