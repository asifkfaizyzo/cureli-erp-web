// cadmin-web/src/pages/Fleet/Pricing/comps/BasePay/SlabTable.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Pricing/comps/BasePay/SlabTable.jsx
import { Plus, Trash2, Infinity as InfinityIcon } from "lucide-react";
import StyledSelect from "../../../../../components/common/StyledSelect";

const RATE_TYPE_OPTIONS = [
  { value: "FLAT_FIXED", label: "Flat Fixed (₹)" },
  { value: "PER_KM", label: "Per KM (₹/km)" },
];

export default function SlabTable({ slabs, onChange, legLabel }) {
  const updateSlab = (index, key, value) => {
    const next = [...slabs];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  const addSlab = () => {
    const last = slabs[slabs.length - 1];
    const nextFrom = last ? Number(last.to_km ?? last.from_km) || 0 : 0;
    onChange([
      ...slabs,
      { from_km: nextFrom, to_km: nextFrom + 2, rate_type: "PER_KM", rate: 0 },
    ]);
  };

  const removeSlab = (index) => {
    const next = slabs.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-600">
          Distance Slabs — {legLabel}
        </p>
        <button
          type="button"
          onClick={addSlab}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                     text-[#05015A] bg-[#05015A]/8 hover:bg-[#05015A]/12
                     rounded-lg transition-colors"
        >
          <Plus size={12} /> Add Slab
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-500 w-20">From (km)</th>
              <th className="text-left px-3 py-2 font-medium text-gray-500 w-24">To (km)</th>
              <th className="text-left px-3 py-2 font-medium text-gray-500">Rate Type</th>
              <th className="text-left px-3 py-2 font-medium text-gray-500 w-28">Rate (₹)</th>
              <th className="text-center px-2 py-2 font-medium text-gray-500 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {slabs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-xs text-gray-400">
                  No slabs configured. Click "Add Slab" to begin.
                </td>
              </tr>
            ) : (
              slabs.map((slab, i) => (
                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={slab.from_km ?? 0}
                      onChange={(e) => updateSlab(i, "from_km", parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded
                                 focus:outline-none focus:ring-1 focus:ring-[#05015A]/40 focus:border-[#05015A]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {slab.to_km === null || slab.to_km === undefined ? (
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-gray-500">
                        <InfinityIcon size={12} />
                        <button
                          type="button"
                          onClick={() => updateSlab(i, "to_km", (Number(slab.from_km) || 0) + 2)}
                          className="text-[10px] text-[#05015A] hover:underline"
                        >
                          set
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={slab.to_km ?? ""}
                          onChange={(e) => updateSlab(i, "to_km", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded
                                     focus:outline-none focus:ring-1 focus:ring-[#05015A]/40 focus:border-[#05015A]"
                        />
                        <button
                          type="button"
                          onClick={() => updateSlab(i, "to_km", null)}
                          title="Set to unbounded (∞)"
                          className="p-1 text-gray-400 hover:text-[#05015A]"
                        >
                          <InfinityIcon size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <StyledSelect
                      value={slab.rate_type}
                      onChange={(v) => updateSlab(i, "rate_type", v)}
                      options={RATE_TYPE_OPTIONS}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={slab.rate ?? 0}
                        onChange={(e) => updateSlab(i, "rate", parseFloat(e.target.value) || 0)}
                        className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded
                                   focus:outline-none focus:ring-1 focus:ring-[#05015A]/40 focus:border-[#05015A]"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeSlab(i)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}