// landing-web/src/components/common/SitemapPage.jsx (do not remove this comment)
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { Link } from "react-router-dom";
import {
  Home,
  Info,
  Wrench,
  Phone,
  FileText,
  Shield,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";

// ============================================
// SITEMAP DATA
// ============================================
const SITEMAP_SECTIONS = [
  {
    title: "Main Pages",
    description: "Core pages of the Cureli website",
    links: [
      { label: "Home",     path: "/",        icon: Home,     description: "Welcome to Cureli" },
      { label: "About",    path: "/about",    icon: Info,     description: "Our story and mission" },
      { label: "Services", path: "/Services", icon: Wrench,   description: "What we offer" },
      { label: "Contact",  path: "/contact",  icon: Phone,    description: "Get in touch with us" },
    ],
  },
  {
    title: "Legal & Policies",
    description: "Important legal documents and policies",
    links: [
      { label: "Terms & Conditions",  path: "/terms",               icon: FileText,  description: "Our terms of service" },
      { label: "Privacy Policy",      path: "/privacy",             icon: Shield,    description: "How we handle your data" },
      { label: "Refund Policy",       path: "/refund-policy",       icon: RotateCcw, description: "Our refund process" },
      { label: "Delivery Policy",     path: "/delivery-policy",     icon: Truck,     description: "Service delivery terms" },
      { label: "Cancellation Policy", path: "/cancellation-policy", icon: XCircle,   description: "How to cancel your plan" },
    ],
  },
];

// ============================================
// SITEMAP CARD
// ============================================
const SitemapCard = ({ section }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
    <h2 className="text-lg font-semibold text-white mb-1">
      {section.title}
    </h2>
    <p className="text-xs text-blue-200/50 mb-5">
      {section.description}
    </p>

    <div className="flex flex-col gap-2">
      {section.links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.path}
            to={link.path}
            className="
              group flex items-center gap-4 px-4 py-3
              rounded-xl border border-white/5
              bg-white/[0.03] hover:bg-white/10
              hover:border-white/20
              transition-all duration-200
            "
          >
            {/* Icon */}
            <div className="
              flex-shrink-0 w-9 h-9 rounded-lg
              bg-[#000060]/60 border border-white/10
              flex items-center justify-center
              group-hover:bg-[#000060] group-hover:border-white/20
              transition-all duration-200
            ">
              <Icon size={16} className="text-blue-300 group-hover:text-white transition-colors" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                {link.label}
              </p>
              <p className="text-xs text-blue-200/40 group-hover:text-blue-200/60 transition-colors truncate">
                {link.description}
              </p>
            </div>

            {/* Arrow */}
            <span className="
              text-white/20 group-hover:text-white/60
              group-hover:translate-x-1
              transition-all duration-200 text-sm
            ">
              →
            </span>
          </Link>
        );
      })}
    </div>
  </div>
);

// ============================================
// SITEMAP PAGE
// ============================================
const SitemapPage = () => {
  return (
    <div className="bg-[linear-gradient(90deg,#1D0A36,#1D025E,#020245)] w-full min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-32 pb-12 px-4 text-center">
        <p className="text-xs font-semibold tracking-[0.3em] text-blue-300/70 uppercase mb-3">
          Navigation
        </p>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
          Sitemap
        </h1>
        <p className="text-blue-100/60 text-base sm:text-lg max-w-md mx-auto">
          A complete overview of all pages on the Cureli website.
        </p>

        {/* Divider */}
        <div className="w-16 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mt-8 rounded-full" />
      </section>

      {/* ── Sitemap Grid ── */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SITEMAP_SECTIONS.map((section) => (
            <SitemapCard key={section.title} section={section} />
          ))}
        </div>

        {/* Total page count */}
        <p className="text-center text-blue-200/30 text-xs mt-10">
          {SITEMAP_SECTIONS.reduce((acc, s) => acc + s.links.length, 0)} pages
          total · Last updated {new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </section>

      <Footer />
    </div>
  );
};

export default SitemapPage;