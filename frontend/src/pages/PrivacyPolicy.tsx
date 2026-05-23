import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

const CONTACT_EMAIL = "26furqan.ansari@gmail.com";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar onSearch={() => {}} />

      <main className="container py-8 flex-1 max-w-3xl mx-auto space-y-8">
        <div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">&larr; Back to Home</Link>
          <h1 className="font-heading text-2xl font-bold text-foreground mt-3">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground mt-1">Last updated: May 23, 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Who we are</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Blue Lock Exchange is a fan-made community tool. We are not a company,
            do not sell data, and do not run advertising. The platform helps BGMI
            players find owners of in-game cards and arrange voluntary exchanges.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Not affiliated</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This platform is <strong className="text-foreground">not affiliated with, endorsed
            by, sponsored by, or connected to</strong> Krafton Inc., Battlegrounds Mobile
            India (BGMI), the rights holders of the Blue Lock manga or anime, or any
            of their licensees. All third-party names and assets remain property of
            their respective owners.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Information we collect</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
            <li><strong className="text-foreground">Account data:</strong> the email address you signed in with, your display name, and your profile picture URL.</li>
            <li><strong className="text-foreground">Listing &amp; gift data:</strong> card names, encrypted trade codes, messages, and the email address you provide in the gift request form (which may differ from your sign-in email).</li>
            <li><strong className="text-foreground">Technical data:</strong> IP address and browser user-agent recorded against claim and gift actions, for abuse prevention only.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">How we use it</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
            <li>Run the listing and gift-request features.</li>
            <li>Detect and prevent abuse via rate limits and duplicate-account heuristics.</li>
            <li>Email card owners when someone sends them a gift request.</li>
            <li>Show your display name, profile picture, and trust score on your public listings.</li>
            <li>Generate aggregate stats (total listings, total trades), never per-user.</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We <strong className="text-foreground">never sell, rent, or share</strong> your personal data for marketing.
            We do not handle, track, or award BGMI in-game popularity. Popularity is a BGMI in-game asset that players exchange directly with each other in the game.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Data retention</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
            <li>Listings: retained until you delete them or until they expire.</li>
            <li>Gift requests: retained for 90 days, then auto-deleted.</li>
            <li>Account data: retained while your account is active. On deletion request, removed within 30 days.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Your rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You may request a copy of your data, correction, or deletion by emailing
            <a className="text-primary hover:underline ml-1" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            EU/UK users have additional rights under GDPR; California users under CCPA. We honor those on request.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Children</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This platform is not intended for users under 13 (or under 16 in the EU).
            We do not knowingly collect data from such users.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For takedowns, deletion, or any other inquiry:
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline ml-1">{CONTACT_EMAIL}</a>.
          </p>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default PrivacyPolicy;
