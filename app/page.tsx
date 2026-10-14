import Image from "next/image";
import welcomeArtwork from "@/assets/welcome-artwork.png";
import { WelcomeScene } from "./welcome-scene";

export default function WelcomePage() {
  return (
    <main className="welcome-page" aria-labelledby="welcome-title">
      <div className="welcome-stage">
        <div className="welcome-art">
          {/* The wordmark and tagline are drawn into the artwork, so their
              text is provided to assistive tech here instead. */}
          <h1 id="welcome-title" className="sr-only">
            Mehman
          </h1>
          <p className="sr-only">People · Food · Cultures</p>
          <Image
            src={welcomeArtwork}
            alt="Illustration of a smiling woman in a red sari, seated on a mat and stirring a pot over a clay stove in a warm, traditional Indian kitchen."
            fill
            preload
            sizes="(min-width: 640px) 640px, 100vw"
            className="object-cover"
          />
          <WelcomeScene />
        </div>
      </div>
    </main>
  );
}
