import { useState } from "react";
import { Send, User } from "lucide-react";
import { addPharmacyPayoutNote } from "../../../../api/cadminPharmacyPayouts";
import { useToast } from "../../../../components/common/Toast";

const InternalNotesPanel = ({ payout, onUpdated }) => {
  const toast = useToast();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const notes = payout?.internal_notes && Array.isArray(payout.internal_notes) ? payout.internal_notes : [];

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await addPharmacyPayoutNote(payout.payout_id, text.trim());
      setText("");
      toast.success("Note Added");
      onUpdated();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to add note");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Internal Audit Notes</h3>
          <p className="text-xs text-gray-500">CAdmin-only communication history for this payout.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type an internal note and hit Enter..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 h-9 px-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="px-3.5 py-2 bg-[#05015A] text-white rounded-lg hover:bg-[#05015A]/90 disabled:opacity-40 transition-all flex items-center justify-center"
        >
          <Send size={13} />
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-xs text-gray-400">No notes recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
          {[...notes].reverse().map((note, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
              <p className="text-gray-900 font-medium">{note.text}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <User size={10} /> Admin: {note.by ? `${note.by.slice(0, 8)}...` : "System"}
                </span>
                <span>•</span>
                <span>{new Date(note.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InternalNotesPanel;