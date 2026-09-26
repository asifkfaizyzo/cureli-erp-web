// cadmin-web/src/pages/Communications/pages/Broadcast/BroadcastPage.jsx (do not remove this comment)
// src/pages/Communications/pages/Broadcast/BroadcastPage.jsx

import { useNavigate } from "react-router-dom";
import { useMenuStore } from "../../../../store/useMenuStore";
import {
  Radio,
  Mail,
  Bell,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

// ============================================
// BROADCAST CARD
// ============================================
const BroadcastCard = ({
  title,
  description,
  icon: Icon,
  path,
  breadcrumbs,
  iconBg,
  iconColor,
  isComingSoon = false,
}) => {
  const navigate = useNavigate();
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const handleClick = () => {
    if (isComingSoon) return;
    setBreadcrumbs(breadcrumbs);
    navigate(path);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-white rounded-xl border border-gray-200 p-5
        transition-all duration-200
        ${isComingSoon
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:border-gray-300 hover:shadow-md"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>

        {isComingSoon && (
          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-md uppercase">
            Coming Soon
          </span>
        )}
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        {title}
      </h3>
      <p className="text-xs text-gray-500 mb-6 line-clamp-2">
        {description}
      </p>

      {/* Action */}
      {!isComingSoon && (
        <div className="flex items-center gap-1.5 pt-4 border-t border-gray-100">
          <span className="text-xs font-medium text-[#000060]">
            Create broadcast
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-[#000060]" />
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN PAGE
// ============================================
const BroadcastPage = () => {
  const broadcastOptions = [
    {
      id: "inapp",
      title: "In-App Broadcast",
      description:
        "Send announcements that appear directly inside the ERP for users.",
      icon: Bell,
      path: "/communications/broadcast/in-app",
      breadcrumbs: ["Communications", "Broadcast", "In-App"],
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
    },
    {
      id: "email",
      title: "Email Broadcast",
      description:
        "Send custom email announcements to selected users or roles.",
      icon: Mail,
      path: "/communications/broadcast/email",
      breadcrumbs: ["Communications", "Broadcast", "Email"],
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: "sms",
      title: "SMS Broadcast",
      description:
        "Send short SMS alerts to users. Requires DLT compliance.",
      icon: MessageSquare,
      path: "/communications/broadcast/sms",
      breadcrumbs: ["Communications", "Broadcast", "SMS"],
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      isComingSoon: true,
    },
  ];

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
          <Radio className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Broadcast
          </h1>
          <p className="text-sm text-gray-500">
            Send announcements and notifications to users
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {broadcastOptions.map((option) => (
          <BroadcastCard
            key={option.id}
            title={option.title}
            description={option.description}
            icon={option.icon}
            path={option.path}
            breadcrumbs={option.breadcrumbs}
            iconBg={option.iconBg}
            iconColor={option.iconColor}
            isComingSoon={option.isComingSoon}
          />
        ))}
      </div>
    </div>
  );
};

export default BroadcastPage;
