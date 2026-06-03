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

    // O idioma específico sobrescreve o geral em caso de conflito
    return {
        ...geral,
        ...specific
    };
}

// 2. aplica abreviações (SEM exceção)
function applyAbbreviations(text, dict) {
    for (let short in dict) {
        const full = dict[short];

        // replace global seguro
        text = text.split(short).join(full);
    }

    return text;
}

// 3. processa repetição (PARENTÊSES)
function applyRepeats(text) {
    return text.replace(/\((.*?)\)(\d+)/g, (_, content, count) => {
        return content.repeat(Number(count));
    });
}

// 4. parse do .tnl
function parseTNL(raw) {
    const lines = raw
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);

    let lang = "";
    let dict = {};
    let prefix = "";
    let rules = [];

    for (let line of lines) {

        // primeira linha = linguagem
        if (!lang) {
            lang = line;
            dict = loadLanguage(lang);
            continue;
        }

        // prefixo
        if (line.startsWith("Prefix:")) {
            prefix = line.substring(7).trim();
            continue;
        }

        // regra If
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

        // saída
        if (line.startsWith("S")) {
            const match = line.match(/S"(.*)"/);

            if (match && rules.length) {
                rules[rules.length - 1].output = match[1];
            }

            continue;
        }
    }

    return {
        dict,
        prefix,
        rules
    };
}

// 5. executa input
function run(input, data) {

    for (const rule of data.rules) {

        if (
            input === rule.input ||
            input === data.prefix + rule.input
        ) {

            let output = rule.output;

            // repetições primeiro
            output = applyRepeats(output);

            // abreviações depois
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
    "Excode/exampleptbr.tnl",
    "utf-8"
);

const input = process.argv[2];
run(input, data);
