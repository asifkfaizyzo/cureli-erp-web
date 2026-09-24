// pharmacy-web/src/pages/marketplace-dashboard/components/DashboardSkeleton.jsx (do not remove this comment)
// src/pages/marketplace-dashboard/components/DashboardSkeleton.jsx

const Pulse = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />
);

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">

      {/* Header skeleton */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-white/[0.06]">
        <Pulse className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="space-y-2">
          <Pulse className="h-5 w-52" />
          <Pulse className="h-3 w-72" />
        </div>
      </div>

      <div className="px-6 space-y-6">

        {/* KPI row skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Pulse key={i} className="h-28 rounded-2xl" />
          ))}
        </div>

        {/* Mid row skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Pulse className="lg:col-span-3 h-48 rounded-2xl" />
          <Pulse className="lg:col-span-2 h-48 rounded-2xl" />
        </div>

        {/* Chart + listings row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Pulse className="lg:col-span-2 h-56 rounded-2xl" />
          <Pulse className="lg:col-span-3 h-56 rounded-2xl" />
        </div>

        {/* Branch table skeleton */}
        <div className="space-y-2">
          <Pulse className="h-10 rounded-xl" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Pulse key={i} className="h-14 rounded-xl" />
          ))}
        </div>

        {/* Recent orders skeleton */}
        <div className="space-y-2">
          <Pulse className="h-10 rounded-xl" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Pulse key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;