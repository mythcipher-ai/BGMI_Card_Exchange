import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { ArrowRight, Heart, Shield, Users, type LucideIcon } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar onSearch={() => {}} />

      <main className="container py-8 flex-1 max-w-3xl mx-auto space-y-10">
        <header className="space-y-3">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">&larr; Back to Home</Link>
          <h1 className="font-heading text-3xl font-bold text-foreground">About Blue Lock Exchange</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A fan-made community tool that helps BGMI players find owners of the
            cards they're missing, and arrange trades that complete their
            collection.
          </p>
        </header>

        <section className="grid sm:grid-cols-3 gap-3">
          <Tile icon={Users} title="Community-first">
            Built by players, for players. No ads, no premium tier, no paywalls.
          </Tile>
          <Tile icon={Shield} title="Safe by design">
            Encrypted trade codes, abuse reports, rate limits, and one active
            listing per user keep the directory healthy.
          </Tile>
          <Tile icon={Heart} title="Voluntary &amp; non-commercial">
            No money changes hands on the platform. Gifts are requests, not
            transactions.
          </Tile>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold text-foreground">What this is, what it isn't</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
            <li>This is a directory that helps players find each other.</li>
            <li>This is not a marketplace.</li>
            <li>This is not a gambling platform.</li>
            <li>This is not affiliated with Krafton, BGMI, or any anime rights holder.</li>
            <li>This is not an official BGMI product.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold text-foreground">How trades work</h2>
          <ol className="text-sm text-muted-foreground leading-relaxed list-decimal list-inside space-y-1">
            <li>A player lists the one card they have and the card they're looking for.</li>
            <li>Other players can browse, search, and claim the code in-app, or request the card as a gift.</li>
            <li>Players coordinate the actual exchange in the game. We don't touch in-game assets or accounts.</li>
            <li>Players coordinate the actual exchange in BGMI. Any in-game popularity offered is transferred player-to-player in the game; we don't handle it.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold text-foreground">Get involved</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Join the conversation on Instagram, share the platform with friends on
            WhatsApp, and report any abuse you see. The community runs on its
            members.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/guide"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              What you can do <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link
              to="/terms"
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Read the terms
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

const Tile = ({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-border bg-card p-4 space-y-2">
    <Icon size={18} className="text-primary" aria-hidden="true" />
    <h3 className="font-heading text-sm font-semibold text-foreground">{title}</h3>
    <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
  </div>
);

export default About;
