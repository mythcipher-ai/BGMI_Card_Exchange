interface ProfileStatsProps {
  listed: number;
  claimed: number;
}

const ProfileStats = ({ listed, claimed }: ProfileStatsProps) => {
  const stats = [
    { label: "Listed", value: listed },
    { label: "Claimed", value: claimed },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
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
