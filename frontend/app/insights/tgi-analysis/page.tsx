"use client";

import { AuthGate } from "@/components/AuthGate";
import Link from "next/link";

export default function TGIAnalysisPage() {
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

          <div className="border-4 border-black bg-surface-container-lowest p-8">
            <p className="font-label text-xs font-black uppercase tracking-widest text-on-surface-variant">
              Coming soon — analysis form loading
            </p>
          </div>
        </div>
      </section>
    </AuthGate>
  );
}
