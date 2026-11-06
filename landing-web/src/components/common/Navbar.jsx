// landing-web/src/components/common/Navbar.jsx (do not remove this comment)

import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../../assets/icons/cureliwhitewithtext.svg";

const SIGN_IN_URL = import.meta.env.VITE_SIGN_IN_URL;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => setIsOpen(false), [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 50);
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/services", label: "Services" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ease-out ${
          scrolled ? "px-4 sm:px-6 lg:px-8" : "px-0"
        }`}
      >
        <div
          className={`transition-all duration-700 ease-out ${
            scrolled ? "py-3" : "py-0"
          }`}
        >
          <div
            className={`relative mx-auto transition-all duration-700 ease-out ${
              scrolled
                ? "max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[70%]"
                : "max-w-full w-full"
            }`}
          >
            {/* Background Layer */}
            <div
              className={`absolute inset-0 transition-all duration-700 ease-out
              ${
                scrolled
                  ? "bg-[#0a0a20]/80 backdrop-blur-xl opacity-100 rounded-2xl shadow-2xl shadow-black/20"
                  : "bg-[#0a0a20]/0 backdrop-blur-0 opacity-0 rounded-none shadow-none"
              }`}
            />

            <div
              className={`relative z-10 flex items-center justify-between transition-all duration-700 ${
                scrolled
                  ? "px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5"
                  : "px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
              }`}
            >
              {/* LEFT — LOGO */}
              <Link
                to="/"
                className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group"
              >
                <img
                  src={logo}
                  alt="Cureli"
                  className={`w-auto transition-all duration-700 ${
                    scrolled ? "h-7 sm:h-9" : "h-8 sm:h-10 md:h-11"
                  }`}
                />

                {/* <div className="flex items-center gap-1 sm:gap-2">
                  <span
                    className={`font-bold text-white font-manrope transition-all duration-700 ${
                      scrolled
                        ? "text-base sm:text-lg"
                        : "text-lg sm:text-xl md:text-2xl"
                    }`}
                  >
                    Cureli
                  </span>
                </div> */}
              </Link>

              {/* CENTER — NAV LINKS */}
              <div className="hidden md:flex items-center justify-center gap-1 lg:gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-4 lg:px-5 py-2 lg:py-2.5 rounded-full font-manrope text-sm lg:text-base font-medium transition-all duration-300 ${
                      isActive(item.path)
                        ? "text-white"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {isActive(item.path) && (
                      <span className="absolute inset-0 rounded-full bg-white/15 transition-all duration-300" />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* RIGHT — BUTTONS & MENU */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Desktop */}
                <div className="hidden lg:flex items-center gap-2 sm:gap-3">
                  <a
                    href={SIGN_IN_URL}
                    className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-full font-manrope font-semibold text-sm
                               text-white hover:bg-white/10 transition-all duration-300"
                  >
                    Sign In
                  </a>

                  <Link
                    to="/contact"
                    className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-full font-manrope font-semibold text-sm
                               bg-white text-[#0a0a20] hover:bg-white/90 transition-all duration-300"
                  >
                    Book a Demo
                  </Link>
                </div>

                {/* Tablet */}
                <div className="hidden md:flex lg:hidden items-center gap-2">
                  <a
                    href={SIGN_IN_URL}
                    className="px-3 py-2 text-white rounded-full font-manrope font-semibold text-sm
                               hover:bg-white/10 transition-all duration-300"
                  >
                    Sign In
                  </a>

                  <Link
                    to="/contact"
                    className="px-3 py-2 bg-white text-[#0a0a20] rounded-full font-manrope font-semibold text-sm
                               hover:bg-white/90 transition-all duration-300"
                  >
                    Demo
                  </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={toggleMenu}
                  className="md:hidden relative p-2.5 rounded-full bg-white/10 hover:bg-white/15
                             transition-all duration-300"
                  aria-label="Toggle menu"
                  aria-expanded={isOpen}
                >
                  <span className="relative text-white block w-5 h-5">
                    <Menu
                      size={20}
                      className={`absolute inset-0 transition-all duration-300 ${
                        isOpen
                          ? "opacity-0 rotate-90 scale-50"
                          : "opacity-100 rotate-0 scale-100"
                      }`}
                    />

                    <X
                      size={20}
                      className={`absolute inset-0 transition-all duration-300 ${
                        isOpen
                          ? "opacity-100 rotate-0 scale-100"
                          : "opacity-0 -rotate-90 scale-50"
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* MOBILE MENU OVERLAY */}
      {/* ============================================ */}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleMenu}
        aria-hidden="true"
      />

      {/* Slide-in Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[280px] xs:w-[320px] bg-[#0a0a20] shadow-2xl shadow-black/40 transition-transform duration-500 ease-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close Button Only */}
        <div className="flex items-center justify-end px-5 pt-5 pb-4 border-b border-white/10">
          <button
            onClick={toggleMenu}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 transition-all duration-300"
            aria-label="Close menu"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex flex-col px-5 py-6 gap-1">
          {navItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-manrope text-base font-medium transition-all duration-300 ${
                isActive(item.path)
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              style={{
                transitionDelay: isOpen ? `${index * 50 + 100}ms` : "0ms",
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? "translateX(0)" : "translateX(20px)",
              }}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-white/10" />

        {/* Action Buttons */}
        <div
          className="flex flex-col gap-3 px-5 py-6"
          style={{
            transitionDelay: isOpen ? "350ms" : "0ms",
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.4s ease-out",
          }}
        >
          <a
            href={SIGN_IN_URL}
            onClick={() => setIsOpen(false)}
            className="w-full text-center px-4 py-3 rounded-xl font-manrope font-semibold text-sm
                       text-white border border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            Sign In
          </a>

          <Link
            to="/contact"
            onClick={() => setIsOpen(false)}
            className="w-full text-center px-4 py-3 rounded-xl font-manrope font-semibold text-sm
                       bg-white text-[#0a0a20] hover:bg-white/90 transition-all duration-300"
          >
            Book a Demo
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
