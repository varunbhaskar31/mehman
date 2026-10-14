import type { ReactNode } from "react";

const controlClass =
  "mt-2 block w-full rounded-lg border bg-transparent px-4 py-3 text-base text-ivory placeholder:text-ivory/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory [color-scheme:dark]";

function borderClass(error?: string) {
  return error ? "border-terracotta-soft" : "border-ivory/25";
}

type FieldShellProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

function FieldShell({ id, label, error, hint, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm text-ivory/80">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ivory/50">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-terracotta-soft">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: "text" | "email";
  autoComplete?: string;
  multiline?: boolean;
  maxLength?: number;
};

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  autoComplete,
  multiline,
  maxLength,
}: TextFieldProps) {
  const shared = {
    id,
    value,
    maxLength,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy(id, error, hint),
    className: `${controlClass} ${borderClass(error)}`,
  };

  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      {multiline ? (
        <textarea
          {...shared}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          {...shared}
          type={type}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </FieldShell>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClass} ${borderClass()} cursor-pointer`}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export const primaryButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-terracotta px-7 text-base text-ivory transition-colors hover:bg-[#b5532c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";
