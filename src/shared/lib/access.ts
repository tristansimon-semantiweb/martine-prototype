import { createHash, timingSafeEqual } from "node:crypto";

// The access code that guards the whole prototype. It lives in the
// MARTINE_ACCESS_CODE environment variable, never in the repository. The
// cookie holds a hash of it, not the code itself; changing the code signs
// everyone out.
export const ACCESS_COOKIE = "martine_access";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function accessCode(): string | null {
	return process.env.MARTINE_ACCESS_CODE?.trim() || null;
}

export function accessToken(code: string): string {
	return createHash("sha256").update(`martine-prototype:${code}`).digest("hex");
}

function same(a: string, b: string): boolean {
	const x = Buffer.from(a);
	const y = Buffer.from(b);
	return x.length === y.length && timingSafeEqual(x, y);
}

export function isValidCode(input: string): boolean {
	const code = accessCode();
	return Boolean(code) && same(accessToken(input.trim()), accessToken(code!));
}

export function isValidToken(token: string | undefined): boolean {
	const code = accessCode();
	return Boolean(code && token) && same(token!, accessToken(code!));
}

// Where to send the visitor after the code: a path inside the app only.
export function safeNext(next: string | null | undefined): string {
	return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/access") ? next : "/";
}
