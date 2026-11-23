// Imports the methods markdown export (both method files, M&T and SML) into
// the prototype's data:
//   data/methods/<id>.json              one file per method
//   data/methods-index.json             the list of methods with their counts
//   src/shared/lib/methodFiles.generated.ts   the imports the app reads
//
// Usage: node scripts/import-methods.mjs <path/to/martine-methods.md>
//
// The export is said to be anonymised, but real client, brand and people names
// were left in it. SCRUB below removes the ones found so far; check the output
// (and extend SCRUB) each time a new export comes in. The markdown itself is
// never committed.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2];
if (!src) {
	console.error("Usage: node scripts/import-methods.mjs <martine-methods.md>");
	process.exit(1);
}

// ── Anonymisation ──
const SCRUB = [
	[/LESSONS FOR THE NEXT DANONE STUDY/g, "LESSONS FOR THE NEXT STUDY FOR THIS CLIENT"],
	[/\b(DANONE|Danone)\b/g, "[client]"],
	[/\(e\.g\. LVMH, the client\)/g, "(e.g. a group with several brands)"],
	[/\bLVMH\b/g, "[client]"],
	[/\bCOTY\b/g, "[client]"],
	[/\bpureology\b/gi, "[brand]"],
	[/Born in Roma/g, "[franchise]"],
	[/Yves Saint Laurent/g, "[competitor brand]"],
	[/Coachella and Zara Larsson/g, "[event] and [artist]"],
	[/Sophie Volmer/g, "the R&R crawl owner"],
	[/Mathias Morel/g, "the Meltwater account owner"],
	[/Ziling\/Chao \(topic owner\)/g, "the topic owner"],
	[/\bthe the client\b/g, "the client"],
	// People's e-mail addresses ("[brand] <first_last@client.com>")
	[/\s*<[^<>\s]+@[^<>\s]+>/g, ""],
	[/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/gi, "[e-mail removed]"],
	// A client brand's hashtags (#valentinofans, spikevalentino…)
	[/#?\w*valentino\w*/gi, "[brand hashtag]"],
	[/@lorealpro\b/gi, "@[brand]"],
	[/#burberry\b/gi, "#[brand]"],
	// Internal tools' addresses stay inside Semantiweb
	[/https?:\/\/(?:[\w-]+\.)*(?:semantiweb\.com|notion\.com|notion\.so)\S*/gi, "[internal link]"],
];
// A long Boolean query pasted as an example is a client's query: drop it.
const QUERY = /(\bOR\b.*){6,}/;

function clean(s) {
	let out = s.replace(/\\\|/g, "|").trim();
	for (const [re, by] of SCRUB) out = out.replace(re, by);
	return out
		.split("; ")
		.map((part) => (QUERY.test(part) ? "[client query example removed]" : part))
		.join("; ");
}

// "• a.; • b." → "a.\nb." (one line per point)
function bullets(s) {
	const c = clean(s);
	if (!c.includes("•")) return c;
	return c
		.split(/;?\s*•\s*/)
		.map((x) => x.replace(/;$/, "").trim())
		.filter(Boolean)
		.join("\n");
}

// ── Days ──
// Tasks format: "0.25 à 0.5" or "0.1". Steps format: free text ("1 day",
// "2 to 4 days", "3 hours", "2 weeks", "Ongoing"): only the leading figures count.
function range(text) {
	const t = text.trim();
	if (!t || t === "-") return [null, null];
	const m = t.match(/^(\d+(?:\.\d+)?)(?:\s*(?:à|to)\s*(\d+(?:\.\d+)?))?\s*(days?|hours?|weeks?)?/i);
	if (!m) return [null, null];
	const unit = (m[3] ?? "day").toLowerCase();
	const f = unit.startsWith("hour") ? 1 / 8 : unit.startsWith("week") ? 5 : 1;
	const a = Number(m[1]) * f;
	const b = m[2] ? Number(m[2]) * f : a;
	return [round(a), round(b)];
}
const round = (n) => Math.round(n * 1000) / 1000;

const catalog = JSON.parse(readFileSync(join(ROOT, "data/catalog.json"), "utf8"));
const SKILL_IDS = catalog.skills.map((s) => s.id);
// A skill is named by its id, with hyphens or spaces ("building radarly queries").
const skillPattern = (id) => new RegExp(`\\b${id.replace(/-/g, "[-\\s]")}\\b`, "i");
// The SML file has no Tools column: the tools a step uses are read from its
// text (the applications a person works in, as named in the method file).
const TOOLS = [
	"Radarly", "Meltwater", "Talkwalker", "Visibrain", "Sprinklr", "Synthesio", "Spate", "Trajaan",
	"Corpus Manager", "Live Fix", "HypeAuditor", "Traackr", "Export Comments", "Sorter",
	"Claude", "ChatGPT", "Gemini", "Perplexity",
	["Google Drive", /\b(?:Google )?Drive\b/], "Google News", "Google Trends", "Slack", "Float", "Notion",
	"Excel", "PowerPoint", "Canva", "WordArt",
];
const toolsIn = (...texts) =>
	TOOLS.filter((t) => {
		const re = Array.isArray(t) ? t[1] : new RegExp(`\\b${t}\\b`);
		return texts.some((x) => re.test(x));
	})
		.map((t) => (Array.isArray(t) ? t[0] : t))
		.join(", ");

// Skills named by a description rather than their id.
const ALIASES = [[/\bradarly query skill\b/i, "building-radarly-queries"]];
const skillsIn = (...texts) => [
	...new Set([
		...SKILL_IDS.filter((id) => texts.some((t) => skillPattern(id).test(t))),
		...ALIASES.filter(([re]) => texts.some((t) => re.test(t))).map(([, id]) => id),
	]),
];
// Skills a method names ('the Claude skill "x"') that the catalog doesn't have.
const unknownSkills = new Set();
const noteUnknown = (...texts) => {
	for (const t of texts)
		for (const m of t.matchAll(/skill "([^"]+)"/gi)) {
			const id = m[1].trim().toLowerCase().replace(/\s+/g, "-");
			if (!SKILL_IDS.includes(id)) unknownSkills.add(id);
		}
};

const cells = (line) =>
	line
		.trim()
		.replace(/^\|/, "")
		.replace(/\|$/, "")
		.split(/(?<!\\)\|/)
		.map((c) => c.trim());

// ── Parse ──
const md = readFileSync(src, "utf8").split("\n");

// Summary table: family, format, planned days, and the methods still empty.
const summary = [];
for (const line of md) {
	if (!line.startsWith("| ") || line.startsWith("| ---") || line.startsWith("| Méthode")) continue;
	const c = cells(line);
	if (c.length !== 7 || !["SML", "Monitoring", "Trends"].includes(c[1])) continue;
	const link = c[0].match(/\[(.+)\]\(#(.+)\)/);
	summary.push({ name: link ? link[1] : c[0], id: link ? link[2] : null, family: c[1], format: c[2], planned: c[6] });
}

const methods = [];
let m = null;
let phase = null;
let block = null; // "deck" | "notes" | null

for (const raw of md) {
	const line = raw.trimEnd();
	const h2 = line.match(/^## (.+?) <a id="(.+)"><\/a>/);
	if (h2) {
		m = { id: h2[2], name: h2[1], phases: [], deck: null, notes: [], glossary: [] };
		methods.push(m);
		phase = null;
		block = null;
		continue;
	}
	if (line.startsWith("## ")) {
		m = null;
		continue;
	}
	if (!m) continue;

	const meta = line.match(/^Famille : (.+?)\. Format : (\w+)\. Propriétaire : (.+?)\. Version : (.+?)\. Source : (.+?)\./);
	if (meta) {
		Object.assign(m, { family: meta[1], format: meta[2], owner: meta[3] === "à nommer" ? null : meta[3], version: meta[4], source: meta[5] });
		continue;
	}

	const h3 = line.match(/^### Phase (\S+) : (.+)$/);
	if (h3) {
		block = null;
		let name = h3[2];
		const optional = /\(optionnelle\)\s*$/.test(name);
		name = name.replace(/\s*\(optionnelle\)\s*$/, "");
		let id = h3[1];
		if (m.format === "steps") {
			// "0. KICK-OFF" → phase "0"; a heading without a number is a glossary term.
			const n = name.match(/^(\d+)\.\s*(.+)$/);
			if (!n) {
				phase = { glossary: name };
				continue;
			}
			id = n[1];
			name = n[2];
		}
		phase = { phase: id, name: clean(name), optional, time: null, days_min: null, days_max: null, tasks: [] };
		m.phases.push(phase);
		continue;
	}
	// "### Phase 2 bis : …" (the heading above only takes one-word numbers)
	const bis = line.match(/^### Phase (\S+) bis : (.+)$/);
	if (bis) {
		const optional = /\(optionnelle\)\s*$/.test(bis[2]);
		phase = { phase: `${bis[1]} bis`, name: clean(bis[2].replace(/\s*\(optionnelle\)\s*$/, "")), optional, time: null, days_min: null, days_max: null, tasks: [] };
		m.phases.push(phase);
		block = null;
		continue;
	}
	if (line.startsWith("### Structure du deck")) {
		block = "deck";
		phase = null;
		m.deck = { title: "", description: "", columns: [], rows: [] };
		continue;
	}
	if (line.startsWith("### Notes du fichier")) {
		block = "notes";
		phase = null;
		continue;
	}

	if (block === "deck" && line.startsWith("- ")) {
		const parts = cells(line.slice(2).replace(/\\\|/g, "|"));
		const d = m.deck;
		if (!d.title) d.title = clean(parts.join(" | "));
		else if (!d.description) d.description = clean(parts.join(" | "));
		else if (!d.columns.length) d.columns = parts.map(clean);
		else d.rows.push(parts.map(clean));
		continue;
	}
	if (block === "notes" && line.startsWith("- ")) {
		m.notes.push(clean(line.slice(2)));
		continue;
	}

	if (!phase || !line.startsWith("| ") || line.startsWith("| ---") || line.startsWith("| Étape") || line.startsWith("| Tâche")) continue;
	const c = cells(line);

	if (phase.glossary) {
		if (c[0] && c[0] !== "DEFINITION") m.glossary.push({ term: phase.glossary.charAt(0) + phase.glossary.slice(1).toLowerCase(), definition: clean(c[0]) });
		continue;
	}

	if (m.format === "tasks") {
		const [task, how, tools, check, output, daysText, owner] = c;
		const [min, max] = range(daysText ?? "");
		phase.tasks.push({
			task: clean(task),
			how: clean(how),
			tools: clean(tools),
			check: clean(check),
			output: clean(output),
			days_min: min,
			days_max: max,
			owner: clean(owner ?? ""),
			skills: (noteUnknown(tools, how), skillsIn(tools, how)),
		});
	} else {
		const [step, what, how, watch, owner, time, output] = c;
		// The first row of a step table names the phase and holds its time.
		if (!what && !how && !watch && !/^\d+\.\d+/.test(step)) {
			if (!phase.tasks.length && !phase.time) {
				const t = clean(time ?? "");
				phase.time = t && t !== "-" ? t : null;
				[phase.days_min, phase.days_max] = range(time ?? "");
				const n = clean(step).replace(/^\d+\.?\s*/, "");
				if (n) phase.name = n;
				continue;
			}
		}
		const [min, max] = range(time ?? "");
		phase.tasks.push({
			task: clean(step.replace(/^\d+\.\d+\s*/, "")),
			what: clean(what ?? ""),
			how: bullets(how ?? ""),
			watch_out: bullets(watch ?? ""),
			tools: toolsIn(what ?? "", how ?? "", watch ?? ""),
			check: "",
			output: clean(output ?? ""),
			time: clean(time ?? "").replace(/^-$/, "") || null,
			days_min: min,
			days_max: max,
			owner: clean(owner ?? ""),
			skills: (noteUnknown(how ?? "", watch ?? ""), skillsIn(how ?? "", watch ?? "")),
		});
	}
}

// ── Write ──
mkdirSync(join(ROOT, "data/methods"), { recursive: true });
const index = [];
for (const x of methods) {
	const s = summary.find((r) => r.id === x.id);
	const file = {
		_meta: {
			id: x.id,
			name: x.name,
			family: x.family,
			format: x.format,
			owner: x.owner,
			version: x.version,
			source: x.source,
			planned: s?.planned ?? null,
		},
		phases: x.phases,
		...(x.deck ? { deck: x.deck } : {}),
		...(x.glossary.length ? { glossary: x.glossary } : {}),
		...(x.notes.length ? { notes: x.notes } : {}),
	};
	writeFileSync(join(ROOT, `data/methods/${x.id}.json`), JSON.stringify(file, null, "\t") + "\n");
	const tasks = x.phases.flatMap((p) => p.tasks);
	index.push({
		id: x.id,
		name: x.name,
		family: x.family,
		format: x.format,
		owner: x.owner,
		version: x.version,
		status: "published",
		phases: x.phases.filter((p) => !p.optional).length,
		tasks: tasks.length,
		skills: new Set(tasks.flatMap((t) => t.skills)).size,
		planned: s?.planned ?? null,
	});
}
for (const r of summary.filter((r) => !r.id)) {
	index.push({
		id: r.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
		name: r.name,
		family: r.family,
		format: null,
		owner: null,
		version: null,
		status: "to_document",
	});
}
writeFileSync(
	join(ROOT, "data/methods-index.json"),
	JSON.stringify(
		{
			_meta: {
				note: "Generated by scripts/import-methods.mjs from the method files export. Client, brand and people names removed; owners other than the trend report are to name.",
			},
			methods: index,
		},
		null,
		"\t",
	) + "\n",
);

const gen = [
	"// Generated by scripts/import-methods.mjs. Do not edit by hand.",
	'import type { MethodFile } from "./types";',
	...methods.map((x, i) => `import m${i} from "../../../data/methods/${x.id}.json";`),
	"",
	"export const METHOD_FILES: Record<string, MethodFile> = {",
	...methods.map((x, i) => `\t${x.id}: m${i} as MethodFile,`),
	"};",
	"",
];
writeFileSync(join(ROOT, "src/shared/lib/methodFiles.generated.ts"), gen.join("\n"));

console.log(`${methods.length} methods imported, ${index.length - methods.length} to document.`);
for (const x of index) console.log(`  ${x.id}: ${x.phases ?? "-"} phases, ${x.tasks ?? "-"} tasks, ${x.skills ?? "-"} skills`);
if (unknownSkills.size) console.log(`Skills named in the methods but missing from data/catalog.json: ${[...unknownSkills].join(", ")}`);
