// landing-web/src/pages/landingPages/contact/components/OpeningHours.jsx (do not remove this comment)
// import { useState } from "react";
// import { Clock, ChevronDown, Check } from "lucide-react";

// const HOURS = [
//   { day: "Monday - Friday", time: "5:00 am - 9:00 pm" },
//   { day: "Saturday", time: "6:00 am - 6:00 pm" },
//   { day: "Sunday", time: "Holiday", isClosed: true },
// ];

// const OpeningHours = () => {
//   const [isHovered, setIsHovered] = useState(false);

//   return (
//     <div className="w-full flex ml-20 justify-start px-4 sm:px-6 lg:px-8">
//       <div
//         className={`
//           relative 
//           bg-[#000060] 
//           shadow-xl 
//           rounded-lg
//           w-full 
//           max-w-[160px] sm:max-w-[180px] 
//           transition-all duration-300 ease-in-out
//           cursor-pointer
//           z-30
//           ${isHovered ? "md:max-w-[220px] md:shadow-2xl" : ""}
//         `}
//         onMouseEnter={() => setIsHovered(true)}
//         onMouseLeave={() => setIsHovered(false)}
//       >
//         {/* Header */}
//         <div className="
//           flex items-center justify-between gap-1.5 
//           px-3 py-2 sm:px-3.5 sm:py-2.5 
//           border-b border-white/10
//         ">
//           <div className="flex items-center gap-1.5 min-w-0">
//             <div className="
//               w-6 h-6 sm:w-7 sm:h-7 
//               bg-white/10 
//               flex items-center justify-center
//               flex-shrink-0
//             ">
//               <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
//             </div>
//             <h4 className="
//               font-manrope 
//               font-bold 
//               text-white 
//               text-xs sm:text-sm
//               truncate
//             ">
//               Opening Hours
//             </h4>
//           </div>
//           <div className="
//             w-5 h-5 sm:w-6 sm:h-6 
//             bg-green-500 
//             flex items-center justify-center
//             flex-shrink-0
//           ">
//             <Check 
//               className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" 
//               strokeWidth={3} 
//             />
//           </div>
//         </div>

//         {/* Hours List - Always absolute positioned to overlay map */}
//         <div
//           className={`
//             absolute top-full left-0 right-0
//             bg-[#000060]
//             rounded-b-lg
//             overflow-hidden 
//             transition-all duration-300 ease-in-out
//             shadow-2xl
//             max-h-96 opacity-100
//             ${isHovered ? "" : "md:max-h-0 md:opacity-0 md:shadow-none"}
//           `}
//         >
//           <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 space-y-1.5 sm:space-y-2">
//             {HOURS.map(({ day, time, isClosed }) => (
//               <div key={day} className="flex items-start gap-1.5">
//                 <div
//                   className={`
//                     w-1 h-1 
//                     mt-1.5 
//                     flex-shrink-0 
//                     ${isClosed ? "bg-red-400" : "bg-white/60"}
//                   `}
//                 />
//                 <div className="min-w-0 flex-1">
//                   <p className="
//                     font-manrope 
//                     text-white 
//                     text-[11px] sm:text-xs 
//                     font-medium
//                     leading-tight
//                   ">
//                     {day}
//                   </p>
//                   <p
//                     className={`
//                       font-manrope 
//                       text-[10px] sm:text-[11px] 
//                       leading-tight
//                       mt-0.5
//                       ${isClosed ? "text-red-400 font-semibold" : "text-white/70"}
//                     `}
//                   >
//                     {time}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Hover Indicator - Desktop Only */}
//         <div className={`
//           hidden md:block
//           absolute 
//           ${isHovered ? 'bottom-0.5' : 'bottom-1'}
//           left-1/2 -translate-x-1/2
//           transition-all duration-300 ease-in-out
//         `}>
//           <ChevronDown
//             className={`
//               w-3 h-3 
//               text-white/50 
//               transition-transform duration-300 ease-in-out
//               ${isHovered ? "rotate-180" : "rotate-0"}
//             `}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OpeningHours;