"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Papa from "papaparse";

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete";

interface ParsedData {
    headers: string[];
    rows: string[][];
}

interface ColumnMapping {
    email: number;
    first_name: number | null;
    last_name: number | null;
    organization: number | null;
    country: number | null;
    role: number | null;
}

export default function ImportContactsPage() {
    const [step, setStep] = useState<ImportStep>("upload");
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [mapping, setMapping] = useState<ColumnMapping>({
        email: 0,
        first_name: null,
        last_name: null,
        organization: null,
        country: null,
        role: null,
    });
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>([]);
    const [importResult, setImportResult] = useState<{
        success: number;
        errors: Array<{ row: number; email: string; error: string }>;
    } | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Fetch tags on mount
    useState(() => {
        const fetchTags = async () => {
            const supabase = createClient();
            const { data } = await supabase.from("newsletter_tags").select("*");
            if (data) setTags(data);
        };
        fetchTags();
    });

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);

        // Parse CSV
        Papa.parse(uploadedFile, {
            complete: (results) => {
                const data = results.data as string[][];
                if (data.length > 1) {
                    setParsedData({
                        headers: data[0],
                        rows: data.slice(1).filter((row) => row.some((cell) => cell.trim())),
                    });

                    // Auto-detect email column
                    const emailIdx = data[0].findIndex(
                        (h) => h.toLowerCase().includes("email") || h.toLowerCase().includes("e-mail")
                    );
                    const firstNameIdx = data[0].findIndex(
                        (h) => h.toLowerCase().includes("first") || h.toLowerCase() === "imię"
                    );
                    const lastNameIdx = data[0].findIndex(
                        (h) => h.toLowerCase().includes("last") || h.toLowerCase() === "nazwisko"
                    );
                    const orgIdx = data[0].findIndex(
                        (h) => h.toLowerCase().includes("org") || h.toLowerCase().includes("company") || h.toLowerCase().includes("firma")
                    );
                    const countryIdx = data[0].findIndex(
                        (h) => h.toLowerCase().includes("country") || h.toLowerCase().includes("kraj")
                    );

                    setMapping({
                        email: emailIdx >= 0 ? emailIdx : 0,
                        first_name: firstNameIdx >= 0 ? firstNameIdx : null,
                        last_name: lastNameIdx >= 0 ? lastNameIdx : null,
                        organization: orgIdx >= 0 ? orgIdx : null,
                        country: countryIdx >= 0 ? countryIdx : null,
                        role: null,
                    });

                    setStep("mapping");
                }
            },
            error: (error) => {
                console.error("Error parsing file:", error);
            },
        });
    }, []);

    const handleImport = async () => {
        if (!parsedData) return;

        setIsImporting(true);
        setStep("importing");

        const supabase = createClient();
        const errors: Array<{ row: number; email: string; error: string }> = [];
        let successCount = 0;

        // Validate emails
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        for (let i = 0; i < parsedData.rows.length; i++) {
            const row = parsedData.rows[i];
            const email = row[mapping.email]?.trim().toLowerCase();

            if (!email || !emailRegex.test(email)) {
                errors.push({ row: i + 2, email: email || "empty", error: "Invalid email format" });
                continue;
            }

            const contact = {
                email,
                first_name: mapping.first_name !== null ? row[mapping.first_name]?.trim() || null : null,
                last_name: mapping.last_name !== null ? row[mapping.last_name]?.trim() || null : null,
                organization: mapping.organization !== null ? row[mapping.organization]?.trim() || null : null,
                country: mapping.country !== null ? row[mapping.country]?.trim() || null : null,
                role: mapping.role !== null ? row[mapping.role]?.trim() || null : null,
                consent_given_at: new Date().toISOString(),
                consent_source: "import",
                status: "active" as const,
            };

            const { data, error } = await supabase
                .from("newsletter_contacts")
                .upsert(contact, { onConflict: "email" })
                .select("id")
                .single();

            if (error) {
                errors.push({ row: i + 2, email, error: error.message });
            } else {
                successCount++;

                // Assign tags
                if (selectedTags.length > 0 && data?.id) {
                    const tagAssignments = selectedTags.map((tagId) => ({
                        contact_id: data.id,
                        tag_id: tagId,
                    }));
                    await supabase.from("newsletter_contact_tags").upsert(tagAssignments);
                }
            }
        }

        setImportResult({ success: successCount, errors });
        setStep("complete");
        setIsImporting(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Import Contacts</h1>
                <p className="text-gray-500">Upload a CSV or Excel file to import your member list</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
                {["Upload", "Map Columns", "Preview", "Import", "Complete"].map((label, idx) => {
                    const steps: ImportStep[] = ["upload", "mapping", "preview", "importing", "complete"];
                    const currentIdx = steps.indexOf(step);
                    const isActive = idx === currentIdx;
                    const isComplete = idx < currentIdx;

                    return (
                        <div key={label} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isComplete
                                    ? "bg-green-500 text-white"
                                    : isActive
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-200 text-gray-500"
                                    }`}
                            >
                                {isComplete ? <Check className="h-4 w-4" /> : idx + 1}
                            </div>
                            <span
                                className={`ml-2 text-sm ${isActive ? "text-indigo-600 font-medium" : "text-gray-500"
                                    }`}
                            >
                                {label}
                            </span>
                            {idx < 4 && (
                                <div className="w-12 h-0.5 mx-4 bg-gray-200">
                                    <div
                                        className={`h-full ${isComplete ? "bg-green-500" : "bg-gray-200"}`}
                                        style={{ width: isComplete ? "100%" : "0%" }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                {step === "upload" && (
                    <div className="text-center">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-indigo-400 transition-colors">
                            <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Upload your CSV or Excel file
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Drag and drop or click to browse
                            </p>
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
                            >
                                <Upload className="h-5 w-5" />
                                Choose File
                            </label>
                        </div>

                        <div className="mt-8 text-left">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">File Requirements:</h4>
                            <ul className="text-sm text-gray-500 space-y-1">
                                <li>• CSV or Excel format (.csv, .xlsx)</li>
                                <li>• First row must contain column headers</li>
                                <li>• Email column is required</li>
                                <li>• Recommended columns: First Name, Last Name, Organization, Country</li>
                            </ul>
                        </div>
                    </div>
                )}

                {step === "mapping" && parsedData && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Map Your Columns</h3>
                        <p className="text-gray-500 mb-6">
                            Match the columns from your file to the contact fields.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { key: "email", label: "Email *", required: true },
                                { key: "first_name", label: "First Name" },
                                { key: "last_name", label: "Last Name" },
                                { key: "organization", label: "Organization" },
                                { key: "country", label: "Country" },
                                { key: "role", label: "Role" },
                            ].map((field) => (
                                <div key={field.key} className="flex items-center gap-4">
                                    <label className="w-32 text-sm font-medium text-gray-700">
                                        {field.label}
                                    </label>
                                    <select
                                        value={
                                            mapping[field.key as keyof ColumnMapping] === null
                                                ? ""
                                                : String(mapping[field.key as keyof ColumnMapping])
                                        }
                                        onChange={(e) =>
                                            setMapping({
                                                ...mapping,
                                                [field.key]: e.target.value === "" ? null : parseInt(e.target.value),
                                            })
                                        }
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        {!field.required && <option value="">-- Skip --</option>}
                                        {parsedData.headers.map((header, idx) => (
                                            <option key={idx} value={idx}>
                                                {header}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {/* Tag Selection */}
                        <div className="mt-8">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Assign Tags to Imported Contacts
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        onClick={() =>
                                            setSelectedTags((prev) =>
                                                prev.includes(tag.id)
                                                    ? prev.filter((t) => t !== tag.id)
                                                    : [...prev, tag.id]
                                            )
                                        }
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTags.includes(tag.id)
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button
                                onClick={() => setStep("upload")}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </button>
                            <button
                                onClick={() => setStep("preview")}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Preview
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {step === "preview" && parsedData && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview Import</h3>
                        <p className="text-gray-500 mb-6">
                            Review the first 5 rows before importing all {parsedData.rows.length} contacts.
                        </p>

                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">Email</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">First Name</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">Last Name</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">Organization</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {parsedData.rows.slice(0, 5).map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2">{row[mapping.email]}</td>
                                            <td className="px-4 py-2">
                                                {mapping.first_name !== null ? row[mapping.first_name] : "-"}
                                            </td>
                                            <td className="px-4 py-2">
                                                {mapping.last_name !== null ? row[mapping.last_name] : "-"}
                                            </td>
                                            <td className="px-4 py-2">
                                                {mapping.organization !== null ? row[mapping.organization] : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                            <p className="text-sm text-indigo-800">
                                <strong>{parsedData.rows.length}</strong> contacts will be imported.
                                {selectedTags.length > 0 && (
                                    <> Tags: {tags.filter((t) => selectedTags.includes(t.id)).map((t) => t.name).join(", ")}</>
                                )}
                            </p>
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button
                                onClick={() => setStep("mapping")}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </button>
                            <button
                                onClick={handleImport}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Start Import
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {step === "importing" && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Importing Contacts...</h3>
                        <p className="text-gray-500 mt-2">Please wait while we process your file.</p>
                    </div>
                )}

                {step === "complete" && importResult && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Import Complete!</h3>
                        <p className="text-gray-500">
                            Successfully imported <strong>{importResult.success}</strong> contacts.
                        </p>

                        {importResult.errors.length > 0 && (
                            <div className="mt-6 text-left bg-red-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-red-800 mb-2">
                                    <AlertCircle className="h-5 w-5" />
                                    <span className="font-medium">
                                        {importResult.errors.length} errors occurred
                                    </span>
                                </div>
                                <div className="max-h-40 overflow-y-auto text-sm text-red-700">
                                    {importResult.errors.slice(0, 10).map((err, idx) => (
                                        <p key={idx}>
                                            Row {err.row}: {err.email} - {err.error}
                                        </p>
                                    ))}
                                    {importResult.errors.length > 10 && (
                                        <p className="text-red-500">
                                            ...and {importResult.errors.length - 10} more errors
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-center gap-4">
                            <a
                                href="/contacts"
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                View Contacts
                            </a>
                            <button
                                onClick={() => {
                                    setStep("upload");
                                    setFile(null);
                                    setParsedData(null);
                                    setImportResult(null);
                                }}
                                className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Import More
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
