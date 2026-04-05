interface ProfileStatsProps {
  totalClaims: number;
  successfulExchanges: number;
  trustScore: number;
}

const ProfileStats = ({ totalClaims, successfulExchanges, trustScore }: ProfileStatsProps) => {
  const stats = [
    { label: "Claims", value: totalClaims },
    { label: "Exchanges", value: successfulExchanges },
    { label: "Trust", value: `${trustScore}%` },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value }) => (
        <div key={label} className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="font-heading text-lg font-semibold text-primary">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
};

export default ProfileStats;
