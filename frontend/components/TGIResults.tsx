"use client";

import ReactMarkdown from "react-markdown";
import type { TGIAnalysisResult, ThemeTable } from "@/lib/tgi-types";

function Tooltip({ children, text, className = "", direction = "up" }: { children: React.ReactNode; text: string; className?: string; direction?: "up" | "down" }) {
  const popupPos = direction === "down"
    ? "top-full left-1/2 -translate-x-1/2 mt-2"
    : "bottom-full left-1/2 -translate-x-1/2 mb-2";
  return (
    <span className={`relative group cursor-default ${className}`}>
      {children}
      <span className={`pointer-events-none absolute ${popupPos} hidden group-hover:block z-50 w-52 bg-black text-white font-body text-xs font-normal normal-case tracking-normal leading-snug p-2 text-center whitespace-normal`}>
        {text}
      </span>
    </span>
  );
}

const SIGNAL_STYLES: Record<string, string> = {
  "Sweet spot": "bg-black text-white",
  "Notable": "bg-primary-container text-black",
  "Niche": "border-2 border-black text-black",
  "Under-index": "bg-surface-container text-on-surface-variant",
};

function FindingCard({ finding, rank }: { finding: TGIAnalysisResult["topFindings"][0]; rank: number }) {
  return (
    <div className="border-4 border-black p-6 bg-surface-container-lowest flex gap-4">
      <span className="font-headline font-black text-4xl text-black/10 shrink-0 leading-none">{rank}</span>
      <div className="flex flex-col gap-3 min-w-0">
        <p className="font-body text-sm text-on-surface leading-relaxed">{finding.statement}</p>
        <div className="flex gap-2">
          <Tooltip text="Index — how much more (or less) likely this audience is compared to the average UK adult. Index 100 = average. Index 150 = 50% more likely.">
            <div className="bg-black text-white px-3 py-2 text-center font-label text-xs font-black uppercase tracking-widest whitespace-nowrap">
              INDEX {finding.index}
            </div>
          </Tooltip>
          <Tooltip text="Penetration — what % of the target audience actually reads or uses this, regardless of how distinctive that is.">
            <div className="bg-black text-white px-3 py-2 text-center font-label text-xs font-black uppercase tracking-widest whitespace-nowrap">
              HORZ% {finding.horzPct}%
            </div>
          </Tooltip>
          <Tooltip text="Universe — estimated number of UK adults this represents, in thousands. 1,000 = roughly 1 million people.">
            <div className="bg-black text-white px-3 py-2 text-center font-label text-xs font-black uppercase tracking-widest whitespace-nowrap">
              {finding.universe} (000s)
            </div>
          </Tooltip>
          {finding.lowBase && (
            <Tooltip text="Low unweighted base (under 100 respondents) — treat this finding as directional only, not conclusive.">
              <div className="border-2 border-amber-500 bg-amber-50 px-3 py-2 text-center font-label text-xs font-black uppercase tracking-widest text-amber-600 whitespace-nowrap">
                ⚠ LOW BASE
              </div>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemeTableBlock({ theme }: { theme: ThemeTable }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-body text-sm font-semibold text-on-surface leading-relaxed">{theme.headline}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs font-body">
          <thead>
            <tr className="bg-black text-white">
              <th className="p-2 text-left font-label font-black uppercase tracking-widest">Variable</th>
              <th className="p-2 text-right font-label font-black uppercase tracking-widest">Index</th>
              <th className="p-2 text-left font-label font-black uppercase tracking-widest">What this means</th>
              <th className="p-2 text-right font-label font-black uppercase tracking-widest">
                <Tooltip text="Penetration — what % of the target audience actually reads or uses this." direction="down">
                  <span className="border-b border-dashed border-white/60 cursor-default">Horz%</span>
                </Tooltip>
              </th>
              <th className="p-2 text-right font-label font-black uppercase tracking-widest">
                <Tooltip text="Universe — estimated number of UK adults this represents, in thousands." direction="down">
                  <span className="border-b border-dashed border-white/60 cursor-default">000s</span>
                </Tooltip>
              </th>
              <th className="p-2 text-right font-label font-black uppercase tracking-widest">
                <Tooltip text="Unweighted base — the actual number of survey respondents behind this figure. Under 100 should be treated with caution." direction="down">
                  <span className="border-b border-dashed border-white/60 cursor-default">Unwgt</span>
                </Tooltip>
              </th>
              <th className="p-2 text-left font-label font-black uppercase tracking-widest">Signal</th>
            </tr>
          </thead>
          <tbody>
            {theme.rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface-container"}>
                <td className="p-2 border border-black/10">{row.variable}</td>
                <td className="p-2 border border-black/10 text-right font-bold">{row.index}</td>
                <td className="p-2 border border-black/10 text-on-surface-variant">{row.whatThisMeans}</td>
                <td className="p-2 border border-black/10 text-right">{row.horzPct}%</td>
                <td className="p-2 border border-black/10 text-right">{row.universe}</td>
                <td className="p-2 border border-black/10 text-right">
                  {row.unwgt < 100 ? <span className="text-amber-600">⚠ {row.unwgt}</span> : row.unwgt}
                </td>
                <td className="p-2 border border-black/10">
                  <span className={`font-label text-xs font-black uppercase tracking-widest px-2 py-0.5 ${SIGNAL_STYLES[row.signal] ?? ""}`}>
                    {row.signal}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Props = {
  result: TGIAnalysisResult;
  jsonParseFailed: boolean;
  preFiltered: boolean;
  reportTitle?: string;
  onNewAnalysis: () => void;
};

export function TGIResults({ result, jsonParseFailed, preFiltered, reportTitle, onNewAnalysis }: Props) {
  return (
    <div className="flex flex-col gap-8">

      {/* Warnings */}
      {jsonParseFailed && (
        <div className="border-4 border-amber-500 bg-amber-50 p-4">
          <p className="font-label text-xs font-black uppercase tracking-widest text-amber-700">
            Note: The structured analysis could not be parsed — showing raw output below.
          </p>
        </div>
      )}

      {/* Report title */}
      {reportTitle && (
        <div>
          <h1 className="font-headline font-black text-3xl uppercase tracking-tighter">{reportTitle}</h1>
        </div>
      )}

      {/* Metadata */}
      <div className="border-l-4 border-black pl-4">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {result.sheetsDetected.length > 0 && `Sheets: ${result.sheetsDetected.join(", ")}`}
          {result.waveDate && ` · Source: ${result.waveDate}`}
          {preFiltered && " · Pre-filtered to threshold signals"}
        </p>
      </div>

      {/* Top 5 findings */}
      {result.topFindings.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-headline font-black text-2xl uppercase tracking-tighter">
            TOP_5_FINDINGS
          </h2>
          <div className="flex flex-col gap-3">
            {result.topFindings.map((f, i) => (
              <FindingCard key={i} finding={f} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Theme tables */}
      {result.themeTables.length > 0 && (
        <div className="flex flex-col gap-8">
          <h2 className="font-headline font-black text-2xl uppercase tracking-tighter border-t-4 border-black pt-8">
            DETAILED_FINDINGS
          </h2>
          {result.themeTables.map((theme, i) => (
            <div key={i} className="flex flex-col gap-3">
              <h3 className="font-headline font-black text-lg uppercase tracking-tighter">
                {theme.themeName}
              </h3>
              <ThemeTableBlock theme={theme} />
            </div>
          ))}
        </div>
      )}

      {/* Detailed analysis (markdown) */}
      <div className="border-t-4 border-black pt-8">
        <h2 className="font-headline font-black text-2xl uppercase tracking-tighter mb-6">
          FULL_ANALYSIS
        </h2>
        <div className="prose prose-sm max-w-none font-body
          prose-headings:font-headline prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter
          prose-h2:text-lg prose-h2:border-t-2 prose-h2:border-black prose-h2:pt-6 prose-h2:mt-8
          prose-h3:text-sm prose-h3:font-black prose-h3:uppercase prose-h3:tracking-widest prose-h3:mt-6
          prose-p:text-sm prose-p:leading-relaxed prose-p:text-on-surface
          prose-li:text-sm prose-li:leading-relaxed
          prose-table:border-collapse prose-table:w-full
          prose-th:border prose-th:border-black prose-th:p-2 prose-th:bg-black prose-th:text-white prose-th:font-label prose-th:text-xs prose-th:uppercase prose-th:tracking-widest
          prose-td:border prose-td:border-black/20 prose-td:p-2 prose-td:text-xs
          prose-strong:font-black
          prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:bg-surface-container prose-blockquote:px-4 prose-blockquote:py-3 prose-blockquote:not-italic prose-blockquote:text-on-surface-variant
        ">
          <ReactMarkdown
            components={{
              h2({ children }) {
                return (
                  <h2 className="font-headline font-black text-lg uppercase tracking-tighter border-t-2 border-black pt-6 mt-8 mb-3">
                    {children}
                  </h2>
                );
              },
              h3({ children }) {
                return (
                  <h3 className="font-headline font-black text-sm uppercase tracking-widest mt-5 mb-2">
                    {children}
                  </h3>
                );
              },
              th({ children }) {
                const text = String(children ?? "");
                const tooltips: Record<string, string> = {
                  "Horz%": "Penetration — what % of the target audience actually reads or uses this.",
                  "000s": "Universe — estimated number of UK adults this represents, in thousands.",
                  "Unwgt": "Unweighted base — the actual number of survey respondents. Under 100 should be treated with caution.",
                };
                const tip = tooltips[text.trim()];
                return (
                  <th>
                    {tip ? (
                      <Tooltip text={tip} direction="down">
                        <span className="border-b border-dashed border-white/60 cursor-default">{children}</span>
                      </Tooltip>
                    ) : children}
                  </th>
                );
              },
            }}
          >
            {result.detailedAnalysis}
          </ReactMarkdown>
        </div>
      </div>

      {/* Download placeholder (Issue 5) + New Analysis */}
      <div className="border-t-4 border-black pt-8 flex flex-col gap-4">
        <button
          disabled
          className="w-full bg-black text-white px-10 py-5 border-4 border-black font-headline font-black uppercase tracking-widest text-lg opacity-40 cursor-not-allowed"
        >
          ↓ DOWNLOAD_WORD_DOC
        </button>
        <button
          onClick={onNewAnalysis}
          className="w-full px-6 py-5 border-4 border-black font-headline font-black uppercase tracking-widest text-sm bg-surface-container-lowest hover:bg-black hover:text-white transition-colors"
        >
          NEW_ANALYSIS ↺
        </button>
      </div>
    </div>
  );
}
