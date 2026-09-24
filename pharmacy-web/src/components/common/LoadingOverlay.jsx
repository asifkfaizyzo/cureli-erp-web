// pharmacy-web/src/components/common/LoadingOverlay.jsx (do not remove this comment)
// src/components/common/LoadingOverlay.jsx
const LoadingOverlay = ({ message = "Processing..." }) => (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white rounded-xl p-6 shadow-2xl flex items-center gap-4 animate-in fade-in zoom-in duration-200">
      <div className="relative">
        <div className="w-10 h-10 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600" />
        <div className="absolute inset-0 w-10 h-10 border-4 border-transparent rounded-full animate-ping border-t-indigo-400 opacity-20" />
      </div>
      <div>
        <p className="text-slate-800 font-semibold">{message}</p>
        <p className="text-slate-500 text-sm">Please wait...</p>
      </div>
    </div>
  </div>
);

export default LoadingOverlay;