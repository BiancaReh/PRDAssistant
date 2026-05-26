import type { TGIAnalysisResult } from "@/lib/tgi-types";

export const MOCK_TGI_RESULT: TGIAnalysisResult = {
  waveDate: "TGI GB Q4 2024, Kantar Media (MOCK DATA)",
  sheetsDetected: ["Target Audience", "Demographics", "Attitudes"],
  topFindings: [
    {
      statement: "This audience has an exceptionally strong affinity with BBC Good Food digital — they are far more likely to visit the site than the average UK adult, and a meaningful proportion actually do",
      index: 198,
      horzPct: 28.4,
      universe: "1,842",
      unwgt: 412,
      lowBase: false,
    },
    {
      statement: "Radio Times print readers over-index heavily in this target — a surprising finding given the audience's younger-skewing demographics",
      index: 167,
      horzPct: 14.2,
      universe: "921",
      unwgt: 218,
      lowBase: false,
    },
    {
      statement: "This audience is significantly more likely to agree that they try to keep up with developments in technology — pointing to a progressive, forward-thinking mindset",
      index: 154,
      horzPct: 62.1,
      universe: "4,031",
      unwgt: 887,
      lowBase: false,
    },
    {
      statement: "Intention to buy an electric vehicle is a strong signal in this audience — they are notably more likely to be EV-curious than the UK average",
      index: 143,
      horzPct: 18.7,
      universe: "1,214",
      unwgt: 273,
      lowBase: false,
    },
    {
      statement: "Made For Mums is effectively irrelevant for this group — their strong under-index confirms this is not a family-oriented audience despite household size data suggesting otherwise",
      index: 34,
      horzPct: 2.1,
      universe: "136",
      unwgt: 31,
      lowBase: true,
    },
  ],
  themeTables: [
    {
      themeName: "Media Affinity",
      headline: "BBC Good Food digital is the standout sweet spot — this audience visits it at nearly twice the rate of the average UK adult, and over a quarter of them actually do",
      rows: [
        {
          variable: "BBC Good Food Website (L4W)",
          index: 198,
          whatThisMeans: "98% more likely than the average UK adult",
          horzPct: 28.4,
          universe: "1,842",
          unwgt: 412,
          signal: "Sweet spot",
        },
        {
          variable: "Radio Times Print",
          index: 167,
          whatThisMeans: "67% more likely than the average UK adult",
          horzPct: 14.2,
          universe: "921",
          unwgt: 218,
          signal: "Sweet spot",
        },
        {
          variable: "Gardeners World Website (L4W)",
          index: 143,
          whatThisMeans: "43% more likely than the average UK adult",
          horzPct: 6.8,
          universe: "441",
          unwgt: 98,
          signal: "Sweet spot",
        },
        {
          variable: "Top Gear Magazine Print",
          index: 128,
          whatThisMeans: "28% more likely than the average UK adult",
          horzPct: 3.2,
          universe: "208",
          unwgt: 47,
          signal: "Niche",
        },
        {
          variable: "Made For Mums Website (L4W)",
          index: 34,
          whatThisMeans: "66% less likely than the average UK adult",
          horzPct: 2.1,
          universe: "136",
          unwgt: 31,
          signal: "Under-index",
        },
      ],
    },
    {
      themeName: "Audience Character",
      headline: "This audience combines a tech-forward outlook with a genuine interest in lifestyle and quality — they are progressive, premium-leaning, and environmentally aware",
      rows: [
        {
          variable: "I try to keep up with developments in technology [Any Agree]",
          index: 154,
          whatThisMeans: "54% more likely than the average UK adult",
          horzPct: 62.1,
          universe: "4,031",
          unwgt: 887,
          signal: "Sweet spot",
        },
        {
          variable: "I value car manufacturers who are socially and environmentally committed [Any Agree]",
          index: 138,
          whatThisMeans: "38% more likely than the average UK adult",
          horzPct: 44.3,
          universe: "2,876",
          unwgt: 634,
          signal: "Sweet spot",
        },
        {
          variable: "I look on the work I do as a career rather than just a job [Any Agree]",
          index: 132,
          whatThisMeans: "32% more likely than the average UK adult",
          horzPct: 51.8,
          universe: "3,363",
          unwgt: 741,
          signal: "Sweet spot",
        },
        {
          variable: "My car is only there to get me from A to B [Any Agree]",
          index: 72,
          whatThisMeans: "28% less likely than the average UK adult",
          horzPct: 28.4,
          universe: "1,844",
          unwgt: 406,
          signal: "Under-index",
        },
      ],
    },
    {
      themeName: "Commercial Behaviour",
      headline: "EV intent is a meaningful signal in this audience — they are notably more likely to be considering an electric vehicle, and this aligns with their environmental attitudes",
      rows: [
        {
          variable: "Intention to Buy a Car — Electric [Yes]",
          index: 143,
          whatThisMeans: "43% more likely than the average UK adult",
          horzPct: 18.7,
          universe: "1,214",
          unwgt: 273,
          signal: "Sweet spot",
        },
        {
          variable: "Intention to Buy a Car — Hybrid [Yes]",
          index: 127,
          whatThisMeans: "27% more likely than the average UK adult",
          horzPct: 22.3,
          universe: "1,448",
          unwgt: 319,
          signal: "Sweet spot",
        },
        {
          variable: "Part of the Decision Making Process for Car Purchase [Yes]",
          index: 121,
          whatThisMeans: "21% more likely than the average UK adult",
          horzPct: 48.6,
          universe: "3,156",
          unwgt: 695,
          signal: "Notable",
        },
      ],
    },
  ],
  detailedAnalysis: `> **This is mock data for development purposes. Connect an Anthropic API key to see a real analysis.**

## 1. Audience at a glance

This target audience represents approximately 6.5 million UK adults — a meaningful scale with strong commercial relevance. They skew slightly older (35-54), are career-oriented, and combine a tech-forward outlook with genuine lifestyle interests. The single most striking finding is the tension between their strong environmental commitment and their above-average car purchase intent — this is a progressive audience, not an anti-car one.

## 2. Findings by theme

### Media Affinity

BBC Good Food digital is the standout channel — this audience visits at nearly twice the rate of the average UK adult, and over a quarter of them actually do (Index 198, Horz% 28.4%). This is the sweet spot: high index AND meaningful penetration. Radio Times print follows closely, which is a surprising finding given the audience's broader digital orientation — it suggests premium, considered media consumption rather than a purely digital diet.

### Audience Character

This audience is defined by a progressive, achievement-oriented mindset. They over-index heavily on tech interest (Index 154) and environmental values (Index 138), while strongly under-indexing on "my car is just to get me from A to B" (Index 72). That last finding is important: this is an audience for whom vehicles carry meaning — they want a car that reflects their values and identity, not just transport.

### Commercial Behaviour

EV intent is genuine and consistent with their attitudinal profile — not just stated preference but a coherent signal across EV intent, hybrid intent, and environmental commitment. About 1 in 5 of this audience are actively considering an electric vehicle, at 43% above average likelihood.

## 3. The so what

The channel picture points clearly toward premium lifestyle and food media (BBC Good Food, Radio Times) as the sweet spot — combining strong affinity with meaningful reach. Creative territory should lean into the "values-led" dimension of car ownership rather than performance or status. This audience will respond to environmental credibility backed by substance, not greenwashing.

## 4. Reliability flags

- ⚠️ Made For Mums Website (L4W): Low base (Unwgt 31) — under-index finding should be treated as directional only
- Source: TGI GB Q4 2024, Kantar Media (MOCK DATA — for development use only)`,
};

export function isMockMode(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return process.env.NODE_ENV === "development" && (!key || key === "placeholder");
}
