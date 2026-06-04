const fs = require("fs");

// 1. lê config de linguagem + geral.json sempre ativo
function loadLanguage(lang) {
    const geralPath = "Cfg/Language/geral.json";
    const langPath = `Cfg/Language/${lang.toLowerCase()}.json`;

    let geral = {};
    let specific = {};

    if (fs.existsSync(geralPath)) {
        geral = JSON.parse(fs.readFileSync(geralPath, "utf-8"));
    }

    if (fs.existsSync(langPath)) {
        specific = JSON.parse(fs.readFileSync(langPath, "utf-8"));
    } else {
        throw new Error(`Linguagem não encontrada: ${lang}`);
    }

    return {
        ...geral,
        ...specific
    };
}

// 2. aplica abreviações (¶)
function applyAbbreviations(text, dict) {
    return text.replace(/¶([a-zA-Z0-9_]+)/g, (_, key) => {
        return dict[key] ?? `¶${key}`;
    });
}

// 3. repetição
function applyRepeats(text) {
    return text.replace(/\((.*?)\)(\d+)/g, (_, content, count) => {
        return content.repeat(Number(count));
    });
}

// 4. split seguro (quebra linha fora de string)
function splitTNL(raw) {
    const lines = [];
    let current = "";
    let insideString = false;

    for (let i = 0; i < raw.length; i++) {
        const char = raw[i];

        if (char === '"') insideString = !insideString;

        if (char === "\n" && !insideString) {
            lines.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }

    if (current.trim()) lines.push(current.trim());

    return lines;
}

// 5. parse do .tnl
function parseTNL(raw) {
    const lines = splitTNL(raw)
        .map(l => l.trim())
        .filter(Boolean);

    let lang = "";
    let dict = {};
    let prefix = "";
    let rules = [];

    for (let line of lines) {

        if (!lang) {
            lang = line;
            dict = loadLanguage(lang);
            continue;
        }

        if (line.startsWith("Prefix:")) {
            prefix = line.substring(7).trim();
            continue;
        }

        if (line.startsWith("If")) {
            const match = line.match(/If"(.*)"/);
            if (match) {
                rules.push({
                    input: match[1],
                    output: ""
                });
            }
            continue;
        }

        if (line.startsWith("S")) {
            const match = line.match(/S"(.*)"/);
            if (match && rules.length) {
                rules[rules.length - 1].output = match[1];
            }
            continue;
        }
    }

    return { dict, prefix, rules };
}

// 6. execução
function run(input, data) {
    for (const rule of data.rules) {

        if (
            input === rule.input ||
            input === data.prefix + rule.input
        ) {
            let output = rule.output;

            output = applyRepeats(output);
            output = applyAbbreviations(output, data.dict);

            console.log(output);
            return output;
        }
    }

    console.log("null");
    return null;
}

// =====================
// RUN
// =====================

const raw = fs.readFileSync(
    "Excode/Exampleptbr.tnl",
    "utf-8"
);

const data = parseTNL(raw);

const input = process.argv[2];
run(input, data);
