import type { Metadata } from "next";
import { LegalPage } from "@/app/_components/legal-page";

export const metadata: Metadata = {
  title: "Privacy · Mehman",
};

const email = (
  <a href="mailto:hello@mehman.in" className="underline underline-offset-4">
    hello@mehman.in
  </a>
);

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="2 November 2026"
      intro={
        <p>
          This explains what Mehman collects, why, who can see it and how to
          have it corrected or deleted. We follow India&rsquo;s Digital
          Personal Data Protection Act, 2023.
        </p>
      }
      sections={[
        {
          heading: "What we collect",
          body: (
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-ivory">Your account:</strong> your
                name, email or mobile number, and your name and picture from
                Google if you sign in with it.
              </li>
              <li>
                <strong className="text-ivory">Bookings:</strong> the dates
                you request, how many guests, and any note you write to the
                host.
              </li>
              <li>
                <strong className="text-ivory">Hosts:</strong> your table&rsquo;s
                name, story, menu, photos, neighbourhood, home address and
                contact number.
              </li>
              <li>
                <strong className="text-ivory">Reviews</strong> you write, and
                tables you save.
              </li>
            </ul>
          ),
        },
        {
          heading: "Why we use it",
          body: (
            <p>
              To run your account, pass requests between guests and hosts,
              tell you when something changes, check hosts before their
              tables go live, and keep people safe. We don&rsquo;t sell your
              data or use it for advertising.
            </p>
          ),
        },
        {
          heading: "Who sees what",
          body: (
            <>
              <p>
                Anyone can see a live table: its name, story, menu, photos,
                neighbourhood and reviews (with the reviewer&rsquo;s first
                name).
              </p>
              <p>
                A host sees the name of each guest who requests a seat, and
                their note. A host&rsquo;s address and phone number are shown
                only to guests whose booking the host has accepted.
              </p>
              <p>
                The small Mehman team can see accounts and bookings to review
                hosts and help when something goes wrong.
              </p>
            </>
          ),
        },
        {
          heading: "Services we use",
          body: (
            <p>
              Mehman runs on Supabase (database, logins and photo storage) and
              Netlify (the website). Google handles &ldquo;Continue with
              Google&rdquo;. They process data for us under their own security
              and privacy terms, and some of it may be stored outside India.
            </p>
          ),
        },
        {
          heading: "How long we keep it",
          body: (
            <p>
              While your account is open. When you ask us to delete your
              account, we delete your profile, bookings, saved tables and
              notifications. If you&rsquo;re a host, we also delete your table
              and photos. We may keep a record of a serious safety complaint
              where the law requires it.
            </p>
          ),
        },
        {
          heading: "Your rights",
          body: (
            <p>
              You can ask to see the data we hold about you, correct it, or
              delete it, and you can withdraw consent at any time by deleting
              your account. You can change your name and phone number on your
              Profile page. For anything else, email {email} and we&rsquo;ll
              reply within 7 days.
            </p>
          ),
        },
        {
          heading: "Complaints",
          body: (
            <p>
              Write to our grievance contact at {email}. If you&rsquo;re not
              satisfied with our answer, you can complain to the Data
              Protection Board of India.
            </p>
          ),
        },
      ]}
    />
  );
}
