// pharmacy-web/src/pages/marketplace-storefront/components/primitives/SectionCard.jsx (do not remove this comment)
const SectionCard = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] ${className}`}>
    {children}
  </div>
);

export default SectionCard;