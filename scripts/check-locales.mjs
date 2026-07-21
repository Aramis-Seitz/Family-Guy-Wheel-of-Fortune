import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const localeFiles = {
    en: resolve("public/locales/en/common.json"),
    de: resolve("public/locales/de/common.json"),
};

function flatten(value, prefix = "", result = new Map()) {
    for (const [key, child] of Object.entries(value)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (child && typeof child === "object" && !Array.isArray(child)) flatten(child, path, result);
        else result.set(path, child);
    }
    return result;
}

function interpolationVariables(value) {
    if (typeof value !== "string") return [];
    return [...value.matchAll(/{{\s*([^},\s]+).*?}}/g)].map((match) => match[1]).sort();
}

const locales = Object.fromEntries(
    await Promise.all(Object.entries(localeFiles).map(async ([language, file]) => {
        const parsed = JSON.parse(await readFile(file, "utf8"));
        return [language, flatten(parsed)];
    })),
);

const errors = [];
const allKeys = new Set(Object.values(locales).flatMap((entries) => [...entries.keys()]));
for (const key of [...allKeys].sort()) {
    for (const [language, entries] of Object.entries(locales)) {
        if (!entries.has(key)) errors.push(`${language}: missing key "${key}"`);
        else if (typeof entries.get(key) === "string" && entries.get(key).trim() === "") {
            errors.push(`${language}: empty translation "${key}"`);
        }
    }

    if (locales.en.has(key) && locales.de.has(key)) {
        const enVariables = interpolationVariables(locales.en.get(key));
        const deVariables = interpolationVariables(locales.de.get(key));
        if (enVariables.join("|") !== deVariables.join("|")) {
            errors.push(`placeholder mismatch in "${key}": en=[${enVariables}] de=[${deVariables}]`);
        }
    }
}

if (errors.length > 0) {
    console.error(`Locale validation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
} else {
    console.log(`Locale validation passed: ${allKeys.size} keys in ${Object.keys(locales).join(" and ")}.`);
}
