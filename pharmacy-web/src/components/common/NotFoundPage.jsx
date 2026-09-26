// pharmacy-web/src/components/common/NotFoundPage.jsx (do not remove this comment)
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/icons/cureliwhitenew.svg';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const goHome = () => navigate('/');
  const goBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000060] via-[#000040] to-black 
                    flex flex-col items-center justify-center px-4 py-6 relative overflow-hidden font-sans">

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random(),
              animationDuration: `${Math.random() * 3 + 2}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* MAIN CONTENT */}
      <div className="text-center z-10 w-full max-w-3xl flex flex-col items-center">

        <img src={logo} alt="Cureli Logo" className="h-12 mb-4" />
        <div className="mb-6">
          <span className="text-3xl font-bold tracking-wide text-white">Cureli</span>
        </div>

        {/* 404 */}
        <div className="relative">
          <h1 className="text-[100px] sm:text-[140px] md:text-[180px] font-black text-transparent leading-none
                         bg-clip-text bg-gradient-to-b from-white to-white/10
                         drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] select-none">
            404
          </h1>
          <div className="absolute inset-0 text-[100px] sm:text-[140px] md:text-[180px] font-black text-transparent leading-none
                          [-webkit-text-stroke:2px_rgba(255,255,255,0.1)] select-none pointer-events-none">
            404
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-4xl font-light text-white mt-4 tracking-[0.2em] uppercase">
          Page Not Found
        </h2>

        <div className="w-16 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent mx-auto mt-6 rounded-full" />

        <p className="text-sm sm:text-lg text-blue-100/70 mt-6 mb-8 max-w-md mx-auto leading-relaxed px-4">
          Oops! It seems the cure for this broken link hasn't been discovered yet.
          The page you are looking for might have been moved or doesn't exist.
        </p>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4">
          <button
            onClick={goHome}
            className="group relative px-8 py-3.5 rounded-full bg-white text-[#000060] font-bold text-base sm:text-lg
                       shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4)]
                       hover:-translate-y-1 active:scale-95 transition-all duration-300 w-full sm:w-auto"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Back to Home
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </button>

          <button
            onClick={goBack}
            className="px-8 py-3.5 rounded-full bg-transparent text-white font-semibold text-base sm:text-lg
                       border border-white/30 hover:bg-white/10 hover:border-white/60
                       active:scale-95 transition-all duration-300 w-full sm:w-auto"
          >
            Go Back
          </button>
        </div>

        {/* HELPFUL LINKS — Contact goes to /tickets in the ERP */}
        <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-blue-200/60">
          <Link
            to="/erp/tickets"
            className="hover:text-white hover:underline underline-offset-4 decoration-white/30 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-white/20 text-xs text-center w-full px-4">
        © {new Date().getFullYear()} Cureli. All rights reserved.
      </div>
    </div>
  );
};

export default NotFoundPage;