// cadmin-web/src/pages/Communications/comps/CommunicationCard.jsx (do not remove this comment)
// src/pages/Communications/comps/CommunicationCard.jsx

import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useMenuStore } from "../../../store/useMenuStore";

const CommunicationCard = ({
  title,
  description,
  icon: Icon,
  path,
  stats,
  gradientFrom,
  gradientTo,
  isLoading,
  breadcrumbs,
}) => {
  const navigate = useNavigate();
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const handleClick = () => {
    setBreadcrumbs(breadcrumbs);
    navigate(path);
  };

  return (
    <div
      onClick={handleClick}
      className="
        relative overflow-hidden rounded-2xl border border-gray-200 bg-white
        p-6 cursor-pointer group transition-all duration-300
        hover:shadow-xl hover:border-gray-300 hover:-translate-y-1
      "
    >
      {/* Background Gradient Decoration */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientFrom} ${gradientTo} 
                    opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 
                    group-hover:opacity-30 transition-opacity`}
      />

      {/* Icon */}
      <div
        className={`
          relative w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo}
          flex items-center justify-center mb-4
          group-hover:scale-110 transition-transform duration-300
          shadow-lg
        `}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>

      {/* Title & Description */}
      <div className="relative mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-gray-800">
          {title}
        </h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      {/* Stats */}
      <div className="relative min-h-[60px] mb-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading stats...</span>
          </div>
        ) : stats && stats.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                >
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400">No stats available</div>
        )}
      </div>

      {/* Action */}
      <div
        className="
          relative flex items-center gap-2 text-sm font-medium text-gray-600
          group-hover:text-gray-900 group-hover:gap-3 transition-all
        "
      >
        <span>View all</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default CommunicationCard;