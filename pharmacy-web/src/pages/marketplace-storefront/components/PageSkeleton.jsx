// pharmacy-web/src/pages/marketplace-storefront/components/PageSkeleton.jsx (do not remove this comment)
const PageSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-6 w-32 rounded-lg bg-white/[0.06]" />
        <div className="h-4 w-64 rounded-lg bg-white/[0.03]" />
      </div>
      <div className="h-9 w-40 rounded-xl bg-white/[0.06]" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.04]" />
      ))}
    </div>
    <div className="h-64 rounded-2xl bg-white/[0.02] border border-white/[0.06]" />
    <div className="h-48 rounded-2xl bg-white/[0.02] border border-white/[0.06]" />
  </div>
);

export default PageSkeleton;