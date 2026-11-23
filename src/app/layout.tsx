import type { Metadata } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/shared/components/layout/AppShell";

const heading = Newsreader({
	variable: "--font-heading",
	subsets: ["latin"],
	display: "swap",
});

const sourceSans = Source_Sans_3({
	variable: "--font-body",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Martine",
	description: "Martine, the living method file of Semantiweb studies (prototype).",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${heading.variable} ${sourceSans.variable} h-full`}>
			<body className="min-h-full">
				<AppShell>{children}</AppShell>
			</body>
		</html>
	);
}
