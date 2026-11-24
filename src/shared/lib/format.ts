// Display helpers. Figures follow the canvas: days with up to two decimals,
// ranges written "2 to 4 d", dates "January 15".

export function days(n: number): string {
	return String(Math.round(n * 100) / 100);
}

export function dayRange(min: number, max: number): string {
	return min === max ? `${days(min)} d` : `${days(min)} to ${days(max)} d`;
}

// A planned range that may be missing from the method file.
export function costed(d: { min: number; max: number } | null, unit = "d"): string {
	if (!d) return "not costed";
	return dayRange(d.min, d.max).replace(/ d$/, unit === "d" ? " d" : ` ${unit}`);
}

// The planned days as the method file's summary states them, in English:
// "14.76 à 18.76 (8 étapes chiffrées)" → "14.76 to 18.76 days (8 phases costed)".
export function plannedLabel(s: string | null | undefined): string | null {
	if (!s) return null;
	if (/non chiffr/.test(s)) return "not costed";
	const m = s.match(/^([\d.]+)(?: à ([\d.]+))?(?: \((\d+) étapes chiffrées\))?/);
	if (!m) return s;
	return `${m[2] ? `${m[1]} to ${m[2]}` : m[1]} days${m[3] ? ` (${m[3]} phases costed)` : ""}`;
}

// The same, spelled out: "1 day", "2 to 4 days".
export function costedDays(d: { min: number; max: number } | null): string {
	if (!d) return "not costed";
	return `${dayRange(d.min, d.max).replace(/ d$/, "")} ${d.max === 1 ? "day" : "days"}`;
}

export function dueDate(iso: string): string {
	return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

// "in 52 days", "tomorrow", "3 days ago": how far a date is from today.
export function fromToday(iso: string): string {
	const today = new Date();
	today.setHours(12, 0, 0, 0);
	const n = Math.round((new Date(`${iso}T12:00:00`).getTime() - today.getTime()) / 86_400_000);
	if (n === 0) return "today";
	if (n === 1) return "tomorrow";
	if (n === -1) return "yesterday";
	return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
	return `${n} ${n === 1 ? one : many}`;
}
