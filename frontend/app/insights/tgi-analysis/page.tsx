"use client";

import { AuthGate } from "@/components/AuthGate";
import { TGIIntakeForm, TGIFormData } from "@/components/TGIIntakeForm";
import { TGIResults } from "@/components/TGIResults";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import type { TGIAnalysisResult } from "@/lib/tgi-types";

const LOADING_STEPS = [
  "Reading Excel data...",
  "Scanning for audience signals...",
  "Applying analyst knowledge...",
  "Verifying findings against source...",
  "Writing analysis...",
];

export default function TGIAnalysisPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [tooLarge, setTooLarge] = useState<{ charCount: number; sheetCount: number } | null>(null);
  const [result, setResult] = useState<TGIAnalysisResult | null>(null);
  const [jsonParseFailed, setJsonParseFailed] = useState(false);
  const [preFiltered, setPreFiltered] = useState(false);
  const [pendingForm, setPendingForm] = useState<TGIFormData | null>(null);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isLoading) {
      setLoadingStep(0);
      stepIntervalRef.current = setInterval(() => {
        setLoadingStep((s) => (s + 1) % LOADING_STEPS.length);
      }, 4000);
    } else {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    }
    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, [isLoading]);

  async function submit(data: TGIFormData, preFilter = false) {
    setIsLoading(true);
    setError("");
    setTooLarge(null);
    setResult(null);
    setJsonParseFailed(false);
    setPreFiltered(preFilter);
    setPendingForm(data);

    const formData = new FormData();
    formData.append("tgiFile", data.tgiFile!);
    formData.append("reportTitle", data.reportTitle);
    formData.append("briefText", data.briefText);
    formData.append("briefFiles", JSON.stringify(data.briefFiles));
    formData.append("preFilter", String(preFilter));

    try {
      const res = await fetch("/api/insights/tgi-analysis/analyse", {
        method: "POST",
        body: formData,
      });

      let json: {
        status?: string;
        charCount?: number;
        sheetCount?: number;
        result?: TGIAnalysisResult;
        jsonParseFailed?: boolean;
        preFiltered?: boolean;
        error?: string;
      };
      try {
        json = await res.json();
      } catch {
        throw new Error("The server returned an unreadable response. Please try again.");
      }

      if (!res.ok) {
        throw new Error(json.error || "Analysis failed. Please try again.");
      }

      if (json.status === "too_large") {
        if (preFilter) {
          setError("This file is too large to analyse even after pre-filtering. Try splitting the report into fewer sheets and re-uploading.");
          return;
        }
        setTooLarge({ charCount: json.charCount!, sheetCount: json.sheetCount! });
        return;
      }

      setResult(json.result!);
      setJsonParseFailed(json.jsonParseFailed ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewAnalysis() {
    setResult(null);
    setTooLarge(null);
    setError("");
    setJsonParseFailed(false);
    setPendingForm(null);
  }

  const showResults = result && !isLoading;
  const showForm = !result && !isLoading;

  return (
    <AuthGate>
      <section className="px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link
              href="/insights"
              className="font-label text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-black mb-4 inline-block"
            >
              ← INSIGHTS_TOOLS
            </Link>
            <h1 className="font-headline font-black text-4xl uppercase tracking-tighter mt-4">
              TGI_ANALYSIS
            </h1>
            <p className="font-body text-on-surface-variant mt-2">
              Upload a TGI cross-tab Excel report and get a structured audience analysis with key findings, themed insights, and Word download.
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="border-4 border-black bg-primary-container p-8 text-center mb-8 neo-brutalist-shadow">
              <p className="font-headline font-black text-xl uppercase tracking-tighter">
                Analysing your report — this may take a minute
              </p>
              <p className="font-body text-sm text-on-primary-container mt-3">
                {LOADING_STEPS[loadingStep]}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <span className="w-3 h-3 bg-black inline-block animate-bounce [animation-delay:0ms]" />
                <span className="w-3 h-3 bg-black inline-block animate-bounce [animation-delay:150ms]" />
                <span className="w-3 h-3 bg-black inline-block animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border-4 border-black bg-surface-container-lowest p-6 mb-8">
              <p className="font-label text-xs font-black uppercase tracking-widest text-red-600 mb-3">{error}</p>
              <button
                onClick={handleNewAnalysis}
                className="font-label text-xs font-black uppercase tracking-widest hover:underline"
              >
                ← TRY AGAIN
              </button>
            </div>
          )}

          {/* Too large warning */}
          {tooLarge && !isLoading && (
            <div className="border-4 border-black bg-surface-container-lowest p-6 mb-8">
              <p className="font-label text-xs font-black uppercase tracking-widest mb-2">
                File too large to send in full
              </p>
              <p className="font-body text-sm text-on-surface-variant mb-4">
                Your report contains approximately {Math.round(tooLarge.charCount / 1000)}k characters across {tooLarge.sheetCount} sheet{tooLarge.sheetCount !== 1 ? "s" : ""} — above the limit for a full send. Pre-filtering will keep only rows with a significant index signal (above or below threshold) before analysing.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => pendingForm && submit(pendingForm, true)}
                  className="bg-black text-white px-8 py-4 border-4 border-black font-headline font-black uppercase tracking-widest text-sm hover:bg-primary-container hover:text-black transition-colors"
                >
                  PRE-FILTER AND ANALYSE →
                </button>
                <button
                  onClick={() => setTooLarge(null)}
                  className="px-8 py-4 border-4 border-black font-headline font-black uppercase tracking-widest text-sm bg-surface-container-lowest hover:bg-black hover:text-white transition-colors"
                >
                  EDIT INPUTS
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {showResults && (
            <TGIResults
              result={result}
              jsonParseFailed={jsonParseFailed}
              preFiltered={preFiltered}
              reportTitle={pendingForm?.reportTitle}
              onNewAnalysis={handleNewAnalysis}
            />
          )}

          {/* Form */}
          {showForm && (
            <TGIIntakeForm onSubmit={(data) => submit(data)} isLoading={isLoading} />
          )}
        </div>
      </section>
    </AuthGate>
  );
}
