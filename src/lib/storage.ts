import type { VidaLaboral } from "./types";

const STORAGE_KEY = "vida-laboral-data";

export function saveVidaLaboral(data: VidaLaboral): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
  }
}

export function loadVidaLaboral(): VidaLaboral | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    parsed.personalData.birthDate = new Date(parsed.personalData.birthDate);
    parsed.personalData.reportDate = new Date(parsed.personalData.reportDate);
    parsed.workPeriods = parsed.workPeriods.map(
      (p: Record<string, unknown>) => ({
        ...p,
        startDate: new Date(p.startDate as string),
        effectiveStartDate: new Date(p.effectiveStartDate as string),
        endDate: p.endDate ? new Date(p.endDate as string) : null,
      })
    );

    return parsed as VidaLaboral;
  } catch {
    return null;
  }
}

export function clearVidaLaboral(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}
