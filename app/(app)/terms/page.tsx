import type { Metadata } from "next";
import { LegalPage } from "@/app/_components/legal-page";

export const metadata: Metadata = {
  title: "Terms · Mehman",
};

const email = (
  <a href="mailto:hello@mehman.in" className="underline underline-offset-4">
    hello@mehman.in
  </a>
);

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="2 November 2026"
      intro={
        <p>
          Mehman introduces travellers (&ldquo;guests&rdquo;) to families who
          cook for them at home (&ldquo;hosts&rdquo;). These terms cover using
          the Mehman website. By creating an account you agree to them.
        </p>
      }
      sections={[
        {
          heading: "What Mehman does",
          body: (
            <p>
              Mehman lists home meals and passes seat requests between guests
              and hosts. The meal itself is an arrangement between the guest
              and the host. Mehman doesn&rsquo;t cook, serve or run the meal.
            </p>
          ),
        },
        {
          heading: "Your account",
          body: (
            <>
              <p>
                You must be 18 or older to use Mehman. Give your real name and
                a phone number or email you check, and keep your login to
                yourself.
              </p>
              <p>
                We may suspend an account that breaks these terms or puts
                anyone&rsquo;s safety at risk.
              </p>
            </>
          ),
        },
        {
          heading: "Booking and paying",
          body: (
            <>
              <p>
                A request becomes a booking only when the host accepts it.
                Then you&rsquo;ll see the host&rsquo;s address and phone number.
              </p>
              <p>
                For now, guests pay the host directly at the meal, at the price
                shown when they made the request. Mehman doesn&rsquo;t take
                payments or charge a fee.
              </p>
              <p>
                If you can&rsquo;t make it, cancel in the app as early as you
                can so the host isn&rsquo;t cooking for an empty chair. Hosts
                can mark guests who don&rsquo;t turn up, and we may limit
                bookings for people who repeatedly don&rsquo;t show.
              </p>
            </>
          ),
        },
        {
          heading: "For hosts",
          body: (
            <>
              <p>
                You&rsquo;re responsible for your food, your home and the
                licences, food-safety rules and taxes that apply to you.
                Describe your menu honestly, including whether it&rsquo;s
                vegetarian, and ask guests about allergies.
              </p>
              <p>
                Mehman reviews every host before their table goes live and
                again when a live table&rsquo;s price or photos change. We may
                pause a table after a complaint while we look into it.
              </p>
            </>
          ),
        },
        {
          heading: "For guests",
          body: (
            <p>
              You&rsquo;re a guest in someone&rsquo;s home. Arrive on time,
              respect the house and the family, and tell your host about
              allergies or dietary needs when you request a seat.
            </p>
          ),
        },
        {
          heading: "Safety",
          body: (
            <p>
              If anything during a meal makes you uncomfortable, leave and
              tell us at {email}. In an emergency, call 112 first.
            </p>
          ),
        },
        {
          heading: "Reviews and content",
          body: (
            <p>
              Reviews must be about a real meal and be honest. Photos and
              text you add must be yours to share. You let Mehman show them on
              the site. We may remove content that is false, abusive or breaks
              the law.
            </p>
          ),
        },
        {
          heading: "Liability",
          body: (
            <p>
              Mehman isn&rsquo;t a party to the meal and, to the extent the
              law allows, isn&rsquo;t liable for what happens at it. Nothing
              here limits rights you have under Indian consumer law.
            </p>
          ),
        },
        {
          heading: "Changes and contact",
          body: (
            <p>
              We&rsquo;ll post any changes to these terms here and say on the
              site when they change. Questions: {email}. These terms are
              governed by the laws of India, and the courts of Bengaluru,
              Karnataka have jurisdiction.
            </p>
          ),
        },
      ]}
    />
  );
}
