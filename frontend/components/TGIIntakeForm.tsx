"use client";

import { useState, useRef } from "react";
import { parseFile, validateSurveyFile } from "@/lib/context-upload";

type UploadedFile = {
  name: string;
  text: string;
};

export type TGIFormData = {
  reportTitle: string;
  briefText: string;
  briefFiles: UploadedFile[];
  tgiFile: File | null;
};

const MAX_BRIEF_FILES = 3;
const MAX_EXCEL_MB = 4;

const emptyForm = (): TGIFormData => ({
  reportTitle: "",
  briefText: "",
  briefFiles: [],
  tgiFile: null,
});

type Props = {
  onSubmit: (data: TGIFormData) => void;
  isLoading: boolean;
};

export function TGIIntakeForm({ onSubmit, isLoading }: Props) {
  const [form, setForm] = useState<TGIFormData>(emptyForm());
  const [briefFileError, setBriefFileError] = useState("");
  const [excelError, setExcelError] = useState("");
  const [noInputError, setNoInputError] = useState(false);

  const briefRef = useRef<HTMLInputElement>(null);
  const excelRef = useRef<HTMLInputElement>(null);

  function handleClear() {
    setForm(emptyForm());
    setBriefFileError("");
    setExcelError("");
    setNoInputError(false);
  }

  function set<K extends keyof TGIFormData>(field: K, value: TGIFormData[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    setNoInputError(false);
  }

  async function handleAddBriefFile(file: File) {
    const validation = validateSurveyFile(file);
    if (!validation.valid) {
      setBriefFileError(validation.error!);
      return;
    }
    setBriefFileError("");
    try {
      const text = await parseFile(file);
      setForm((f) => ({
        ...f,
        briefFiles: [...f.briefFiles, { name: file.name, text }],
      }));
    } catch {
      setBriefFileError("Could not read file — it may be corrupt or password-protected.");
    }
  }

  function handleRemoveBriefFile(index: number) {
    setForm((f) => ({
      ...f,
      briefFiles: f.briefFiles.filter((_, i) => i !== index),
    }));
  }

  function handleExcelFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls"].includes(ext)) {
      setExcelError("Please upload an Excel file (.xlsx or .xls).");
      return;
    }
    if (file.size > MAX_EXCEL_MB * 1024 * 1024) {
      setExcelError(`File is too large. Maximum size is ${MAX_EXCEL_MB}MB.`);
      return;
    }
    setExcelError("");
    setForm((f) => ({ ...f, tgiFile: file }));
  }

  function handleSubmit() {
    if (!form.tgiFile) {
      setNoInputError(true);
      return;
    }
    onSubmit(form);
  }

  const atMaxBriefFiles = form.briefFiles.length >= MAX_BRIEF_FILES;

  return (
    <div className="flex flex-col gap-8">

      {/* Report title */}
      <div className="flex flex-col gap-2">
        <label className="font-label text-xs font-black uppercase tracking-widest">
          Report Title <span className="font-normal normal-case tracking-normal text-on-surface-variant">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Honda UK — TGI Q1 2025 Analysis"
          value={form.reportTitle}
          onChange={(e) => set("reportTitle", e.target.value)}
          className="border-4 border-black p-4 font-body text-sm bg-surface-container-lowest focus:outline-none focus:bg-primary-container transition-colors"
        />
      </div>

      {/* Brief text */}
      <div className="flex flex-col gap-2">
        <label className="font-label text-xs font-black uppercase tracking-widest">
          Brief / Notes <span className="font-normal normal-case tracking-normal text-on-surface-variant">(optional)</span>
        </label>
        <textarea
          rows={4}
          placeholder="Paste a brief, email, or notes describing what you're looking for. What target audience? What category context? Any specific variables to investigate?"
          value={form.briefText}
          onChange={(e) => set("briefText", e.target.value)}
          className="border-4 border-black p-4 font-body text-sm bg-surface-container-lowest resize-none focus:outline-none focus:bg-primary-container transition-colors"
        />
      </div>

      {/* Brief file upload */}
      <div className="flex flex-col gap-2">
        <label className="font-label text-xs font-black uppercase tracking-widest">
          Brief Documents <span className="font-normal normal-case tracking-normal text-on-surface-variant">(optional — PDF, DOCX or PPTX)</span>
        </label>

        {form.briefFiles.length > 0 && (
          <div className="flex flex-col gap-1">
            {form.briefFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between border-2 border-black px-4 py-2 bg-surface-container-lowest">
                <span className="font-label text-xs font-bold uppercase tracking-widest truncate">✓ {f.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBriefFile(i)}
                  className="font-label text-xs font-black uppercase tracking-widest ml-4 hover:text-red-600 shrink-0"
                >
                  REMOVE ×
                </button>
              </div>
            ))}
          </div>
        )}

        {!atMaxBriefFiles && (
          <div
            className="border-4 border-black p-4 bg-surface-container-lowest cursor-pointer hover:bg-primary-container transition-colors flex items-center justify-between gap-4"
            onClick={() => briefRef.current?.click()}
          >
            <span className="font-body text-sm text-on-surface-variant">
              {form.briefFiles.length === 0
                ? "Click to upload PDF, DOCX or PPTX"
                : `Add another file (${form.briefFiles.length}/${MAX_BRIEF_FILES})`}
            </span>
            <span className="font-label text-xs font-black uppercase tracking-widest shrink-0">UPLOAD</span>
          </div>
        )}
        {atMaxBriefFiles && (
          <p className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Maximum {MAX_BRIEF_FILES} files reached.
          </p>
        )}

        <input
          ref={briefRef}
          type="file"
          accept=".pdf,.docx,.pptx"
          className="hidden"
          onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAddBriefFile(file);
          }}
        />

        {briefFileError && (
          <p className="font-label text-xs font-bold uppercase tracking-widest text-red-600">{briefFileError}</p>
        )}
      </div>

      {/* Excel upload */}
      <div className="flex flex-col gap-2">
        <label className="font-label text-xs font-black uppercase tracking-widest">
          TGI Cross-Tab Report <span className="font-normal normal-case tracking-normal text-on-surface-variant">(Excel .xlsx or .xls — max 4MB)</span>
        </label>

        {form.tgiFile ? (
          <div className="flex items-center justify-between border-2 border-black px-4 py-2 bg-surface-container-lowest">
            <span className="font-label text-xs font-bold uppercase tracking-widest truncate">✓ {form.tgiFile.name}</span>
            <button
              type="button"
              onClick={() => { set("tgiFile", null); setExcelError(""); }}
              className="font-label text-xs font-black uppercase tracking-widest ml-4 hover:text-red-600 shrink-0"
            >
              REMOVE ×
            </button>
          </div>
        ) : (
          <div
            className="border-4 border-black p-4 bg-surface-container-lowest cursor-pointer hover:bg-primary-container transition-colors flex items-center justify-between gap-4"
            onClick={() => excelRef.current?.click()}
          >
            <span className="font-body text-sm text-on-surface-variant">Click to upload Excel file</span>
            <span className="font-label text-xs font-black uppercase tracking-widest shrink-0">UPLOAD</span>
          </div>
        )}

        <input
          ref={excelRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleExcelFile(file);
          }}
        />

        {excelError && (
          <p className="font-label text-xs font-bold uppercase tracking-widest text-red-600">{excelError}</p>
        )}
      </div>

      {/* No input error */}
      {noInputError && (
        <div className="border-4 border-black bg-primary-container p-4">
          <p className="font-label text-xs font-black uppercase tracking-widest">
            Please upload a TGI Excel file before analysing.
          </p>
        </div>
      )}

      {/* Submit + Clear */}
      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 bg-black text-white px-10 py-5 border-4 border-black font-headline font-black uppercase tracking-widest text-lg hover:bg-primary-container hover:text-black transition-colors transform hover:-translate-x-1 hover:-translate-y-1 neo-brutalist-shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? "ANALYSING..." : "ANALYSE_REPORT →"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading}
          className="px-6 py-5 border-4 border-black font-headline font-black uppercase tracking-widest text-sm bg-surface-container-lowest hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          CLEAR_ALL
        </button>
      </div>
    </div>
  );
}
