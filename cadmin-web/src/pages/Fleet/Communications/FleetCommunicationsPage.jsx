// cadmin-web/src/pages/Fleet/Communications/FleetCommunicationsPage.jsx (do not remove this comment)
import { MessageSquare } from "lucide-react";

export default function FleetCommunicationsPage() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-400">
      <MessageSquare size={64} className="opacity-30" />
      <h2 className="text-xl font-semibold text-gray-500">Fleet Communications</h2>
      <p className="text-sm">Coming soon — rider tickets, broadcasts, and announcements.</p>
    </div>
  );
}