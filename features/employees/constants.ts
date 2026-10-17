// Must match the backend's employee model enum.
export const STATUSES = ["online", "away", "busy", "in meeting"] as const;

// i18n key under `virtualOffice.` for each status label.
export const STATUS_LABEL_KEYS: Record<(typeof STATUSES)[number], string> = {
  online: "online",
  away: "away",
  busy: "busy",
  "in meeting": "inMeeting",
};

export const STATUS_COLORS: Record<(typeof STATUSES)[number], string> = {
  online: "#22C55E",
  away: "#F59E0B",
  busy: "#EF4444",
  "in meeting": "#8B5CF6",
};
