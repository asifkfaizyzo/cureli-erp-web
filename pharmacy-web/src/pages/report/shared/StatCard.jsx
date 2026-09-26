// pharmacy-web/src/pages/report/shared/StatCard.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/shared/StatCard.jsx

const StatCard = ({
  label,
  value,
  subValue,
  color = "indigo",
  prefix = "",
  suffix = "",
}) => {
  const colors = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    green: "bg-green-50 border-green-200 text-green-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    red: "bg-red-50 border-red-200 text-red-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    gray: "bg-gray-50 border-gray-200 text-gray-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${colors[color] || colors.indigo}`}
    >
      <p className="text-[10px] font-medium opacity-70 mb-1">{label}</p>
      <p className="text-lg font-bold">
        {prefix}
        {value}
        {suffix}
      </p>
      {subValue !== undefined && (
        <p className="text-[10px] opacity-60 mt-0.5">{subValue}</p>
      )}
    </div>
  );
};

export default StatCard;