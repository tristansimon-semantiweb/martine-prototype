"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, ACCESS_MAX_AGE, accessCode, accessToken, isValidCode, safeNext } from "@/shared/lib/access";

export async function enter(_prev: string | null, form: FormData): Promise<string | null> {
	if (!accessCode()) return "Access is not set up yet. Ask the Semantiweb team.";
	const code = String(form.get("code") ?? "");
	if (!isValidCode(code)) {
		// A short pause makes guessing slower.
		await new Promise((r) => setTimeout(r, 600));
		return "This code is not right. Check it and try again.";
	}
	(await cookies()).set(ACCESS_COOKIE, accessToken(code), {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: ACCESS_MAX_AGE,
	});
	redirect(safeNext(String(form.get("next") ?? "")));
}
