export type TGIFinding = {
  statement: string;
  index: number;
  horzPct: number;
  universe: string;
  unwgt: number;
  lowBase: boolean;
};

export type ThemeTableRow = {
  variable: string;
  index: number;
  whatThisMeans: string;
  horzPct: number;
  universe: string;
  unwgt: number;
  signal: "Sweet spot" | "Notable" | "Niche" | "Under-index";
};

export type ThemeTable = {
  themeName: string;
  headline: string;
  rows: ThemeTableRow[];
};

export type TGIAnalysisResult = {
  topFindings: TGIFinding[];
  detailedAnalysis: string;
  themeTables: ThemeTable[];
  waveDate: string;
  sheetsDetected: string[];
};
