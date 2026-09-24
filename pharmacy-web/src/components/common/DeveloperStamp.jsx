// pharmacy-web/src/components/common/DeveloperStamp.jsx (do not remove this comment)
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DeveloperStamp = () => {
  const navigate = useNavigate();

  const teamMembers = [
    {
      name: "Asif K Faizal",
      role: "Full Stack Developer",
    },
    {
      name: "Kiran S Pradeep",
      role: "Full Stack Developer",
    },
    {
      name: "Akhilkrishna K B",
      role: "UI/UX Designer",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Back</span>
      </button>

      {/* Main Content */}
      <div className="max-w-md w-full text-center">
        {/* Round Seal */}
        <div className="relative w-44 h-44 mx-auto mb-10">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-gray-800" />

          {/* Inner Ring */}
          <div className="absolute inset-3 rounded-full border border-gray-800" />

          {/* Circular Text */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 176 176">
            <defs>
              <path
                id="topCircle"
                d="M 88,88 m -62,0 a 62,62 0 1,1 124,0"
                fill="none"
              />
              <path
                id="bottomCircle"
                d="M 88,88 m 62,0 a 62,62 0 1,1 -124,0"
                fill="none"
              />
            </defs>

            {/* Top Text */}
            <text
              className="fill-gray-800 uppercase"
              style={{
                fontSize: "11px",
                fontWeight: "600",
                letterSpacing: "0.15em",
              }}
            >
              <textPath href="#topCircle" startOffset="50%" textAnchor="middle">
                Your Zeroes And Ones
              </textPath>
            </text>

            {/* Bottom Text */}
            <text
              className="fill-gray-800 uppercase"
              style={{
                fontSize: "11px",
                fontWeight: "600",
                letterSpacing: "0.15em",
              }}
            >
              <textPath
                href="#bottomCircle"
                startOffset="50%"
                textAnchor="middle"
              >
                Software Company
              </textPath>
            </text>

            {/* Stars - Positioned at sides */}
            <text
              x="16"
              y="92"
              className="fill-gray-800"
              style={{ fontSize: "10px" }}
            >
              ★
            </text>
            <text
              x="152"
              y="92"
              className="fill-gray-800"
              style={{ fontSize: "10px" }}
            >
              ★
            </text>
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800 tracking-wider">
                YZO
              </div>
              <div className="text-[9px] text-gray-500 tracking-[0.2em] uppercase mt-1">
                Est. 2024
              </div>
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 tracking-wide">
          Your Zeroes And Ones
        </h1>

        {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-sm mx-auto">
          A software development company crafting digital solutions with
          precision and passion.
        </p>

        {/* Divider */}
        <div className="w-12 h-px bg-gray-300 mx-auto mb-10" />

        {/* Team Section */}
        <div className="mb-10">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
            The Team
          </h2>

          <div className="space-y-4">
            {teamMembers.map((member, index) => (
              <div key={index} className="py-2">
                <p className="text-gray-800 font-medium">{member.name}</p>
                <p className="text-gray-400 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-12 h-px bg-gray-300 mx-auto mb-8" />

        {/* Project Info */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Cureli — Pharmacy Management System</p>
          <p>© {new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    </div>
  );
};

export default DeveloperStamp;
