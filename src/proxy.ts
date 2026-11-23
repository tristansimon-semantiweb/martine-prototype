import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, accessCode, isValidToken } from "@/shared/lib/access";

// Every page asks for the access code until the visitor has entered it. In
// local development, with no code set, the prototype stays open; anywhere
// else it stays closed until MARTINE_ACCESS_CODE is set.
export function proxy(request: NextRequest) {
	if (!accessCode() && process.env.NODE_ENV === "development") return NextResponse.next();
	if (isValidToken(request.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.next();

	const url = new URL("/access", request.url);
	const next = request.nextUrl.pathname + request.nextUrl.search;
	if (next !== "/") url.searchParams.set("next", next);
	return NextResponse.redirect(url);
}

export const config = {
	// Everything but the code page itself, Next's static files and the favicon.
	matcher: ["/((?!access|_next/static|_next/image|favicon.ico).*)"],
};
