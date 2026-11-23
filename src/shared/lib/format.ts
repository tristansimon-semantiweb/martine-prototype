// Display helpers. Figures follow the canvas: days with up to two decimals,
// ranges written "2 to 4 d", dates "January 15".

export function days(n: number): string {
	return String(Math.round(n * 100) / 100);
}

export function dayRange(min: number, max: number): string {
	return min === max ? `${days(min)} d` : `${days(min)} to ${days(max)} d`;
}

export function dueDate(iso: string): string {
	return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export function plural(n: number, one: string, many = `${one}s`): string {
	return `${n} ${n === 1 ? one : many}`;
}
