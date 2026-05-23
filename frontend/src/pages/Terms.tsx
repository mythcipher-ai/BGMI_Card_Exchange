import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

const Terms = () => {
  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar onSearch={() => {}} />

      <main className="container py-8 flex-1 max-w-3xl mx-auto space-y-8">
        <div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">&larr; Back to Home</Link>
          <h1 className="font-heading text-2xl font-bold text-foreground mt-3">Terms of Use</h1>
          <p className="text-xs text-muted-foreground mt-1">Last updated: May 23, 2026</p>
        </div>

        <Section title="1. About this platform">
          Blue Lock Exchange ("we", "us", "this platform") is a fan-made,
          non-commercial community utility tool created by independent BGMI players
          to help other players find owners of in-game cards and arrange voluntary
          card exchanges. The platform is provided free of charge.
        </Section>

        <Section title="2. Not affiliated">
          This platform is <strong className="text-foreground">not affiliated with, endorsed by, sponsored by,
          or connected to</strong> Krafton Inc., Battlegrounds Mobile India (BGMI),
          PUBG Mobile, the rights holders of the Blue Lock manga or anime, or any
          of their licensees. All product names, logos, trademarks, character names
          and visual references are property of their respective owners and used
          only for nominal identification in a community context.
        </Section>

        <Section title="3. No real-money transactions">
          This platform does not facilitate buying, selling, renting, or any
          monetary exchange of in-game items, cards, accounts, or virtual currency.
          The "Request Gift" feature is a voluntary request mechanism with no
          payment processing, escrow, or financial guarantee. Any monetary
          transaction arranged off-platform is solely the users' responsibility
          and is <strong className="text-foreground">not endorsed</strong> by us.
        </Section>

        <Section title="4. Popularity (BGMI in-game)">
          Any references to "popularity" on this platform (including the amount
          shown on gift requests) refer to <strong className="text-foreground">BGMI
          in-game popularity</strong>, an in-game asset controlled and tracked by
          BGMI / Krafton. Blue Lock Exchange does not hold, transfer, award, or
          verify popularity. If two players agree to exchange popularity as part
          of a gift, the transfer happens directly between them inside BGMI.
        </Section>

        <Section title="5. User responsibilities">
          <ul className="list-disc list-inside space-y-1">
            <li>Maintain only one active card listing per user account.</li>
            <li>Provide accurate information in card listings and gift requests.</li>
            <li>Do not impersonate other users, brands, or rights holders.</li>
            <li>Do not post abusive, harassing, sexual, hateful, or illegal content.</li>
            <li>Do not use the platform to advertise, sell, scam, phish, or distribute malware.</li>
            <li>You are solely responsible for any contact or exchange arranged with another user.</li>
          </ul>
          <p className="mt-2">We are a directory; we do not validate trades and do not act as escrow.</p>
        </Section>

        <Section title="6. No guarantees">
          The platform is provided "as is" without warranty. We do not guarantee
          that trades will succeed, that listings are accurate, that other users
          will respond, or that the service will be available, uninterrupted, or
          error-free.
        </Section>

        <Section title="7. Moderation">
          We may, without prior notice, remove listings or gift requests, suspend
          users, or remove content that we believe violates these terms or that we
          deem harmful to the community. Administrators cannot access user
          passwords or read users' personal email inboxes.
        </Section>

        <Section title="8. Account deletion">
          You may request deletion of your account and all associated data at any
          time by emailing the address in §11. We will action requests within 30 days.
        </Section>

        <Section title="9. Changes to these terms">
          We may update these terms at any time. Continued use after a change
          constitutes acceptance of the updated terms.
        </Section>

        <Section title="10. Limitation of liability">
          To the maximum extent permitted by law, we (the volunteer maintainers of
          this fan project) are not liable for any direct, indirect, incidental,
          consequential, or punitive damages arising from your use of the platform
          or any interaction with another user.
        </Section>

        <Section title="11. Contact">
          For takedown requests by rights holders, account deletion, or any other
          inquiry, contact: <a className="text-primary hover:underline" href="mailto:mythcipher.ai@gmail.com">mythcipher.ai@gmail.com</a>.
          We respond in good faith and will honor reasonable takedown requests for
          any third-party IP we have inadvertently used.
        </Section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
    <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
  </section>
);

export default Terms;
