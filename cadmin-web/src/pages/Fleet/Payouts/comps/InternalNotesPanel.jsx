// cadmin-web/src/pages/Fleet/Payouts/comps/InternalNotesPanel.jsx (do not remove this comment)
import { useState } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { addRiderPayoutNote } from "../../../../api/cadminFleetRiderPayouts";
import { useToast } from "../../../../components/common/Toast";

const InternalNotesPanel = ({ payout, onUpdated }) => {
  const toast = useToast();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const notes = Array.isArray(payout?.internal_notes) ? payout.internal_notes : [];

  const handleSend = async () => {
    if (!text.trim() || !payout?.payout_id) return;
    setSending(true);
    try {
      await addRiderPayoutNote(payout.payout_id, text.trim());
      setText("");
      toast.success("Note added");
      onUpdated();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to add note");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
        <MessageSquare size={14} /> Internal Notes
        <span className="text-xs text-gray-400 font-normal">(visible to CAdmin only)</span>
      </h3>

      {/* Notes Timeline */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {notes.length === 0 && (
          <p className="text-sm text-gray-400">No notes yet.</p>
        )}
        {notes.map((note, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">
                Admin {note.by?.slice(0, 8)}...
              </span>
              <span className="text-xs text-gray-400">
                {new Date(note.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-sm text-gray-800">{note.text}</p>
          </div>
        ))}
      </div>

      {/* Add Note */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add an internal note..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 h-10 px-3 border border-gray-300 rounded-lg text-sm"
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="px-4 h-10 bg-[#05015A] text-white rounded-lg text-sm font-medium hover:bg-[#0a0280] disabled:opacity-40 flex items-center gap-1"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
};

export default InternalNotesPanel;