// pharmacy-web/src/pages/onboarding/comps/details-docs/UploadDrugLicense.jsx (do not remove this comment)
import { useState, useRef } from "react";
import { IoCloudUploadOutline } from "react-icons/io5";
import { uploadShopFile } from "../../../../api/shopFiles";
import { Loader2 } from "lucide-react";

const UploadDrugLicense = ({ onContinue }) => {
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef(null);

    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/eps",
    ];

    const MAX_SIZE = 5 * 1024 * 1024;

    const handleFileSelect = (selectedFile) => {
        if (!selectedFile) return;

        if (!allowedTypes.includes(selectedFile.type)) {
            setError("Invalid file format. Use PDF, JPEG, PNG, EPS.");
            return;
        }

        if (selectedFile.size > MAX_SIZE) {
            setError("File is too large. Maximum size is 5MB.");
            return;
        }

        setError("");
        setFile(selectedFile);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files[0]);
    };

    const handleSubmit = async () => {
        if (!file) {
            setError("Please upload a valid document");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("file_type", "drug_license");

            await uploadShopFile(formData);

            
            onContinue();
        } catch (err) {
            console.error("UPLOAD ERROR:", err);
            setError(err?.response?.data?.message || "Failed to upload file");
        }

        setLoading(false);
    };

    return (
        <div
            className="w-full max-w-2xl font-poppins"
            style={{ marginTop: "28px" }}
        >
            <h2 className="text-[28px] font-semibold text-[#000006]">
                Upload Your Drug License
            </h2>

            <p className="text-gray-500 text-xs mt-1 mb-4">
                Eg: <span className="font-bold">PDF, JPEG, PNG</span> — Max <span className="font-bold">5MB</span>
            </p>

            <div
                className="w-[470px] h-[230px] border border-gray-300 rounded-xl bg-white 
                           flex flex-col items-center justify-center cursor-pointer shadow-sm"
                onClick={() => fileInputRef.current.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
            >
                <IoCloudUploadOutline className="text-5xl text-gray-500" />

                <p className="text-gray-500 mt-3 text-sm">
                    {file ? (
                        <span className="font-semibold text-[#000060]">
                            {file.name}
                        </span>
                    ) : (
                        "*Upload verified drug license*"
                    )}
                </p>

                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept=".pdf,.jpeg,.jpg,.png,.eps"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                />
            </div>

            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

            {/* 🔥 UPDATED LOADER BUTTON */}
            <button
                onClick={handleSubmit}
                disabled={!file || loading}
                className={`w-[470px] bg-[#000060] text-white py-3 rounded-xl mt-8 
                           hover:bg-[#000060d1] transition disabled:bg-gray-400 disabled:cursor-not-allowed
                           ${!file ? "opacity-60 cursor-not-allowed" : ""}`}
            >
                {loading ? (
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Uploading...
                    </div>
                ) : (
                    "Continue"
                )}
            </button>
        </div>
    );
};

export default UploadDrugLicense;
