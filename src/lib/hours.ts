export function hoursInputToMinutes(raw: string): number | null {
  const value = Number(String(raw).trim());
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 60);
}

export function minutesToHoursInput(minutes: number | null | undefined): string {
  if (minutes == null) return "";
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return String(hours);
  return String(Math.round(hours * 10) / 10);
}

export function formatCapHours(minutes: number): string {
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${Math.round(hours * 10) / 10}h`;
}
