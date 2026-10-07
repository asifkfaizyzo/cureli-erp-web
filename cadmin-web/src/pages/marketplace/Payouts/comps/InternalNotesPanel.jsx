import { useState } from "react";
import { Send } from "lucide-react";
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
      <h3 className="text-sm font-bold text-gray-900">Internal Notes</h3>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add an internal note..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]"
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="px-3 py-1.5 bg-[#05015A] text-white rounded-lg hover:bg-[#05015A]/90 disabled:opacity-40"
        >
          <Send size={14} />
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No notes yet.</p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {[...notes].reverse().map((note, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-800">{note.text}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(note.at).toLocaleString("en-IN")} · {note.by?.slice(0, 8)}...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InternalNotesPanel;