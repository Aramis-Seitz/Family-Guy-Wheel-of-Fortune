import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const localeFiles = {
    de: resolve("public/locales/de/common.json"),
    en: resolve("public/locales/en/common.json"),
};

function flatten(value, prefix = "", result = new Map()) {
    for (const [key, child] of Object.entries(value)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (child && typeof child === "object" && !Array.isArray(child)) flatten(child, path, result);
        else result.set(path, child);
    }
    return result;
}

function variables(value) {
    return typeof value === "string"
        ? [...value.matchAll(/{{\s*([^},\s]+).*?}}/g)].map((match) => match[1]).sort()
        : [];
}

const locales = Object.fromEntries(await Promise.all(
    Object.entries(localeFiles).map(async ([language, file]) => [
        language,
        flatten(JSON.parse(await readFile(file, "utf8"))),
    ]),
));

const errors = [];
const keys = new Set(Object.values(locales).flatMap((entries) => [...entries.keys()]));

for (const key of [...keys].sort()) {
    for (const [language, entries] of Object.entries(locales)) {
        if (!entries.has(key)) errors.push(`${language}: missing key "${key}"`);
        else if (typeof entries.get(key) !== "string" || entries.get(key).trim() === "") errors.push(`${language}: invalid value "${key}"`);
    }

    const de = locales.de.get(key);
    const en = locales.en.get(key);
    if (de !== undefined && en !== undefined && variables(de).join("|") !== variables(en).join("|")) {
        errors.push(`placeholder mismatch in "${key}"`);
    }
}

for (const key of keys) {
    if (key.endsWith("_one") || key.endsWith("_other")) {
        const pair = key.endsWith("_one") ? `${key.slice(0, -4)}_other` : `${key.slice(0, -6)}_one`;
        if (!keys.has(pair)) errors.push(`missing plural pair for "${key}"`);
    }
}

if (errors.length > 0) {
    console.error(`Locale validation failed with ${errors.length} error(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
} else {
    console.log(`Locale validation passed: ${keys.size} keys.`);
}