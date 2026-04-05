interface TrustBadgeProps {
  score: number;
}

const TrustBadge = ({ score }: TrustBadgeProps) => {
  const getColor = () => {
    if (score >= 80) return "bg-trust-high/20 text-trust-high border-trust-high/30";
    if (score >= 50) return "bg-trust-mid/20 text-trust-mid border-trust-mid/30";
    return "bg-trust-low/20 text-trust-low border-trust-low/30";
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${getColor()}`}>
      {score}% trust
    </span>
  );
};

export default TrustBadge;
