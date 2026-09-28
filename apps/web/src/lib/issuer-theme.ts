/**
 * Issuer brand color accents for CardO card summaries.
 * Color inspiration only — not bank logos or card designs.
 *
 * Sources (brand / public identity guides, sampled 2026):
 * - BPI: Primary Red #B11116, Selective Yellow #FFBA00 (Brandfetch / BPI identity)
 * - BDO: Corporate Blue #204399, Accent Yellow #FFD324 (BDO brand materials)
 * - Metrobank: Corporate Blue #00539F, Sunglow #FFD324 (Metrobank identity)
 * - RCBC: Congress Blue #023F7E, Havelock Blue #5D93DB (RCBC brand refresh)
 * - Other PH issuers: widely used corporate brand hues (approximate UI accents)
 */

export interface IssuerTheme {
  /** Solid brand primary */
  primary: string;
  /** Secondary / highlight */
  accent: string;
  /** Soft tint for chips / left rail */
  soft: string;
  /** Text color on primary */
  onPrimary: string;
  /** Card surface gradient start */
  surfaceFrom: string;
  /** Card surface gradient end */
  surfaceTo: string;
  /** Muted text on brand surface */
  onSurfaceMuted: string;
  /** Hairline / track on brand surface */
  onSurfaceTrack: string;
}

const FALLBACK: IssuerTheme = {
  primary: "#1565C0",
  accent: "#1E90FF",
  soft: "#E3F2FD",
  onPrimary: "#FFFFFF",
  surfaceFrom: "#0B3D91",
  surfaceTo: "#1E90FF",
  onSurfaceMuted: "rgba(255,255,255,0.72)",
  onSurfaceTrack: "rgba(255,255,255,0.28)",
};

function hexToSoft(hex: string, alpha = 0.14): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shade(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  let r = (parseInt(full, 16) >> 16) & 255;
  let g = (parseInt(full, 16) >> 8) & 255;
  let b = parseInt(full, 16) & 255;
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function theme(primary: string, accent: string): IssuerTheme {
  return {
    primary,
    accent,
    soft: hexToSoft(primary, 0.12),
    onPrimary: "#FFFFFF",
    // Flat solid — no gradient wash
    surfaceFrom: primary,
    surfaceTo: primary,
    onSurfaceMuted: "rgba(255,255,255,0.74)",
    onSurfaceTrack: "rgba(255,255,255,0.3)",
  };
}

function goldTheme(): IssuerTheme {
  const primary = "#B8860B";
  return {
    primary,
    accent: "#E8C547",
    soft: hexToSoft(primary, 0.14),
    onPrimary: "#1A1408",
    surfaceFrom: "#C9A227",
    surfaceTo: "#C9A227",
    onSurfaceMuted: "rgba(26, 20, 8, 0.72)",
    onSurfaceTrack: "rgba(26, 20, 8, 0.22)",
  };
}

const BY_ISSUER: Record<string, IssuerTheme> = {
  // --- PH majors (researched brand hues) ---
  bpi: theme("#B11116", "#FFBA00"),
  "bank of the philippine islands": theme("#B11116", "#FFBA00"),
  bdo: theme("#204399", "#FFD324"),
  "bdo unibank": theme("#204399", "#FFD324"),
  metrobank: theme("#00539F", "#FFD324"),
  "metropolitan bank": theme("#00539F", "#FFD324"),
  rcbc: goldTheme(),
  "rizal commercial": goldTheme(),
  "rcbc flex": goldTheme(),
  "flex gold": goldTheme(),
  "rcbc flex gold": goldTheme(),

  // --- Other PH / intl (UI accent approximations) ---
  unionbank: theme("#E87722", "#F4A261"),
  "union bank": theme("#E87722", "#F4A261"),
  securitybank: theme("#005BAA", "#4DA3E3"),
  "security bank": theme("#005BAA", "#4DA3E3"),
  landbank: theme("#00843D", "#5CB85C"),
  "land bank": theme("#00843D", "#5CB85C"),
  pnb: theme("#003B70", "#0077C8"),
  "philippine national bank": theme("#003B70", "#0077C8"),
  eastwest: theme("#0091AE", "#5BC8CE"),
  "east west": theme("#0091AE", "#5BC8CE"),
  chinabank: theme("#0033A0", "#5B7FD6"),
  "china bank": theme("#0033A0", "#5B7FD6"),
  cimb: theme("#C8102E", "#FF6B6B"),
  hsbc: theme("#DB0011", "#FF8A8A"),
  citi: theme("#003B70", "#1E90FF"),
  citibank: theme("#003B70", "#1E90FF"),
  amex: theme("#016FD0", "#6EB1FF"),
  "american express": theme("#016FD0", "#6EB1FF"),
  visa: theme("#1A1F71", "#4B6CB7"),
  mastercard: theme("#EB001B", "#F79E1B"),
  jcb: theme("#0E4C96", "#E30613"),
};

/** Resolve accent colors from card issuer / nickname text. */
export function issuerTheme(issuer: string, nickname?: string): IssuerTheme {
  const key = `${issuer} ${nickname ?? ""}`.toLowerCase().trim();

  // Gold product line (e.g. RCBC Flex Gold) wins over generic issuer blue.
  if (key.includes("gold") && (key.includes("rcbc") || key.includes("flex"))) {
    return goldTheme();
  }

  const direct = BY_ISSUER[key] ?? BY_ISSUER[issuer.toLowerCase().trim()];
  if (direct) return direct;

  for (const [token, value] of Object.entries(BY_ISSUER)) {
    if (token.length > 3 && key.includes(token)) return value;
  }
  return FALLBACK;
}

export const knownIssuers = Object.keys(BY_ISSUER).filter(
  (k) => !k.includes(" ") && k !== "visa" && k !== "mastercard"
);
