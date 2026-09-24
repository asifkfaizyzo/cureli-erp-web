// pharmacy-web/src/components/common/ErrorScreen.jsx (do not remove this comment)
import React from "react";

const ErrorScreen = ({ onBack }) => {
    return (
        <div className="w-full flex justify-center mt-10 px-4 font-poppins">

            {/* CARD WRAPPER */}
            <div 
                className="w-full max-w-3xl bg-white rounded-xl shadow-md flex flex-col items-center py-14 px-6"
                style={{ boxShadow: "0px 4px 35px rgba(0,0,0,0.08)" }}
            >
                {/* ICON */}
                <img 
                    src="/warning.gif" 
                    alt="error"
                    className="w-28 h-28 mb-6 select-none"
                />

                {/* TITLE */}
                <h2 className="text-[26px] font-semibold text-[#000060] mb-2 text-center">
                    Whoops! Something went wrong
                </h2>

                {/* SUBTEXT */}
                <p className="text-gray-600 text-sm text-center max-w-md leading-relaxed">
                    Try again or contact 
                    <span className="text-[#000060] font-medium cursor-pointer"> Chat support </span>
                    if you need additional help.
                </p>
            </div>

            {/* BACK BUTTON */}
            <div className="w-full max-w-md mt-6 flex justify-center">
                <button
                    onClick={onBack}
                    className="w-full bg-[#000060] text-white py-3 rounded-xl text-center 
                               font-medium hover:bg-[#000060d1] transition"
                >
                    Back
                </button>
            </div>
        </div>
    );
};

export default ErrorScreen;
