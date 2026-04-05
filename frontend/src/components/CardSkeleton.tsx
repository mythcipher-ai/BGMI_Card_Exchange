const CardSkeleton = () => (
  <div className="rounded-lg border border-border bg-card p-3 animate-pulse">
    <div className="aspect-[4/3] w-full rounded-md bg-secondary mb-3" />
    <div className="space-y-2">
      <div className="flex justify-between">
        <div className="h-4 w-24 rounded bg-secondary" />
        <div className="h-4 w-16 rounded bg-secondary" />
      </div>
      <div className="h-3 w-16 rounded bg-secondary" />
      <div className="h-3 w-full rounded bg-secondary" />
      <div className="h-8 w-full rounded bg-secondary" />
    </div>
  </div>
);

export default CardSkeleton;
