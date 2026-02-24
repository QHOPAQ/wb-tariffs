export function getTodayISODate(): string {
  return new Date().toISOString().split("T")[0];
}
