import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Check } from "lucide-react";

const UserGuide = () => {
  return (
    <div className="min-h-screen pb-16 sm:pb-0 flex flex-col">
      <Navbar onSearch={() => {}} />

      <main className="container py-8 flex-1 max-w-3xl mx-auto space-y-10">
        <header className="space-y-2">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">&larr; Back to Home</Link>
          <h1 className="font-heading text-3xl font-bold text-foreground">What you can do</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A quick tour of every feature on Blue Lock Exchange.
          </p>
        </header>

        <Group title="Manage your card">
          <Item>
            <strong className="text-foreground">Create one active listing.</strong> Pick the
            card you have and the card you want.
          </Item>
          <Item>
            <strong className="text-foreground">Update your listing.</strong> Edit the wanted
            card or the trade code anytime.
          </Item>
          <Item>
            <strong className="text-foreground">Delete your listing.</strong> Frees your slot
            so you can list a different card.
          </Item>
        </Group>

        <Group title="Discover &amp; connect">
          <Item><strong className="text-foreground">Search the community.</strong> By card name, owner trust score, or category. Typos within a couple of letters still match.</Item>
          <Item><strong className="text-foreground">View other listings.</strong> See who has what you need.</Item>
          <Item><strong className="text-foreground">Claim a card.</strong> Get the owner's trade code and arrange the exchange in-game.</Item>
        </Group>

        <Group title="Trade gracefully">
          <Item><strong className="text-foreground">Request a gift.</strong> Politely ask a user to gift you their card. You can offer BGMI in-game popularity, which you would transfer directly to the owner in the game if they agree. No payment, no obligation.</Item>
          <Item><strong className="text-foreground">Coordinate in-game.</strong> Blue Lock Exchange does not move the card or any in-game popularity. Everything happens between you and the owner inside BGMI.</Item>
        </Group>

        <Group title="Reputation">
          <Item><strong className="text-foreground">Trust score</strong> reflects how often a player completes claims successfully on this site.</Item>
          <Item><strong className="text-foreground">In-game popularity</strong> is a BGMI in-game asset. It is not awarded, tracked, or controlled by this platform.</Item>
        </Group>

        <Group title="Stay connected">
          <Item><strong className="text-foreground">Join the Instagram community</strong> for updates and highlights.</Item>
          <Item><strong className="text-foreground">Share the WhatsApp link</strong> to find traders fast.</Item>
        </Group>

        <Group title="Privacy &amp; control">
          <Item><strong className="text-foreground">Manage your profile.</strong> Update display name and Instagram handle.</Item>
          <Item><strong className="text-foreground">Request account deletion</strong> anytime at the contact email.</Item>
          <Item><strong className="text-foreground">Report abuse.</strong> Flag listings or users for moderator review.</Item>
        </Group>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
    <ul className="space-y-1.5">{children}</ul>
  </section>
);

const Item = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
    <Check size={14} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
    <span>{children}</span>
  </li>
);

export default UserGuide;
