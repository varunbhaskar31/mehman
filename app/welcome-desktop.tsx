import Image from "next/image";
import Link from "next/link";
import courtyard from "@/assets/welcome-desktop.jpg";

// Lamp flames in the 1672×941 painting, as % of its width and height.
const lamps = [
  { x: 22.6, y: 3.4, size: 9 },
  { x: 28.1, y: 9.6, size: 6 },
  { x: 57.1, y: 19.9, size: 6 },
  { x: 85.6, y: 17.7, size: 6 },
  { x: 91.8, y: 34.7, size: 5 },
  { x: 2.1, y: 84.5, size: 8 },
];

/**
 * Wide screens: the kitchen painting (with its own "Step inside") stands on
 * the left, and this panel tells the rest of the story on the right: the
 * meal she cooked, shared with family and guests in the courtyard. Both sit
 * on a blurred wash of the courtyard's lamplight. Phones show only the
 * kitchen painting.
 */
export function WelcomeDesktop() {
  return (
    <>
      <Image src={courtyard} alt="" fill sizes="20vw" quality={40} className="welcome-desk-glow" />
      <section aria-label="The meal, shared" className="welcome-desk">
        <p className="welcome-desk-kicker">From her kitchen to your table</p>
        <div className="welcome-desk-art">
          <Image
            src={courtyard}
            alt="A family feast in a lantern-lit courtyard: a woman in a cream sari serves guests at a long wooden table laden with dishes, grandparents laugh, children run and play, and a dog naps on the rug."
            fill
            sizes="(min-width: 1600px) 760px, 50vw"
            className="object-cover"
          />
          {lamps.map((lamp) => (
            <span
              key={`${lamp.x}-${lamp.y}`}
              aria-hidden="true"
              className="welcome-desk-lamp"
              style={{ left: `${lamp.x}%`, top: `${lamp.y}%`, width: `${lamp.size}%` }}
            />
          ))}
        </div>
        <div className="welcome-desk-copy">
          <p className="font-serif text-[clamp(1.75rem,2.4vw,2.5rem)] leading-tight">Come, food&rsquo;s ready.</p>
          <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-ivory/80">
            Every meal on Mehman starts in a family&rsquo;s kitchen and ends around their table. Pull up a chair, from Kochi to Kolkata, and eat with the people who cooked it.
          </p>
          <Link
            href="/how-it-works"
            className="mt-5 inline-block rounded text-[15px] text-ivory/85 underline decoration-ivory/40 underline-offset-[6px] hover:text-ivory hover:decoration-ivory focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory"
          >
            How Mehman works
          </Link>
        </div>
      </section>
    </>
  );
}
