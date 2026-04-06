import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar onSearch={() => {}} />

      <main className="container py-8 flex-1 max-w-3xl mx-auto space-y-8">
        <div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">&larr; Back to Home</Link>
          <h1 className="font-heading text-2xl font-bold text-foreground mt-3">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground mt-1">Last updated: April 6, 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">About This Platform</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            BGMI JJK Exchange Cards is a <strong className="text-foreground">fan-made, non-commercial</strong> tool
            created solely to help BGMI players trade their Jujutsu Kaisen event cards with each other.
            This platform is <strong className="text-foreground">not affiliated with, endorsed by, or connected to
            Krafton, PUBG Mobile, Bandai Namco, or any official Jujutsu Kaisen rights holders</strong>.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We do not run ads, charge fees, or monetize this platform in any way. It exists purely as a
            community service for gamers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Game Assets &amp; Intellectual Property</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All game-related assets, including but not limited to card names, character names, logos, and imagery
            associated with <strong className="text-foreground">Battlegrounds Mobile India (BGMI)</strong> and{" "}
            <strong className="text-foreground">Jujutsu Kaisen (JJK)</strong>, are the intellectual property of their
            respective owners — <strong className="text-foreground">Krafton Inc.</strong> and{" "}
            <strong className="text-foreground">Gege Akutami / Shueisha / MAPPA</strong>.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These assets are used here under fair use for the purpose of facilitating a community trading tool.
            No copyright infringement is intended. If any rights holder has concerns, please contact us and we
            will promptly address them.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Information We Collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When you use this platform, we may collect the following information:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
            <li><strong className="text-foreground">Account info</strong> — Name and email via Auth0 login (Google/social sign-in)</li>
            <li><strong className="text-foreground">Listing data</strong> — Cards you list for trade and your trade preferences</li>
            <li><strong className="text-foreground">Analytics</strong> — Anonymous usage data via Google Analytics to understand how the platform is used</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">How We Use Your Information</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
            <li>To display your card listings to other traders</li>
            <li>To enable you to manage your trades</li>
            <li>To improve the platform experience through anonymous analytics</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We <strong className="text-foreground">never sell, share, or monetize</strong> your personal data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Third-Party Services</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
            <li><strong className="text-foreground">Auth0</strong> — For secure authentication</li>
            <li><strong className="text-foreground">Google Analytics</strong> — For anonymous usage statistics</li>
            <li><strong className="text-foreground">Netlify</strong> — For hosting</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Each service has its own privacy policy. We encourage you to review them.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Data Deletion</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You can delete your listings at any time from your profile. If you want your account data fully
            removed, contact the developer and we will delete it promptly.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Disclaimer</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This platform is provided <strong className="text-foreground">"as is"</strong> without warranties of any kind.
            We are not responsible for any trades, disputes, or losses that occur between users.
            Use this tool at your own discretion.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For any questions or concerns, reach out to the developer —{" "}
            <a href="https://www.linkedin.com/in/furqanansari/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Furqan Ansari
            </a>.
          </p>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default PrivacyPolicy;
