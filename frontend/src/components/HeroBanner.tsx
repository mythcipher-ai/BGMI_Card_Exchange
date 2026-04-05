const HERO_BG = "https://mythcipher.s3.ap-southeast-2.amazonaws.com/bgmi/hero-banner.jpg";

const HeroBanner = () => {
  return (
    <section className="relative overflow-hidden min-h-[220px] sm:min-h-[320px]">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={HERO_BG}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="container relative py-12 sm:py-20 text-center space-y-4">
        <div className="inline-block mb-2">
          <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest bg-primary/20 text-primary border border-primary/30 rounded-full backdrop-blur-sm">
            BGMI x Jujutsu Kaisen Event
          </span>
        </div>
        <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight drop-shadow-lg">
          JJK CARD<br />
          <span className="text-primary glow-text-green">EXCHANGE</span>
        </h1>
        <p className="text-sm sm:text-base text-foreground/80 max-w-md mx-auto leading-relaxed drop-shadow">
          Trade your Jujutsu Kaisen event cards with other BGMI players.
          List your cards, find the ones you need, complete your collection.
        </p>
        <div className="flex items-center justify-center gap-6 pt-2 text-xs text-foreground/70">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Live Trades</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>Secure Exchange</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-neon-yellow animate-pulse" />
            <span>5 Claims/Day</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </section>
  );
};

export default HeroBanner;
