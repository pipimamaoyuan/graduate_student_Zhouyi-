const fs = require("fs");
const path = require("path");
const vm = require("vm");

const filePath = path.join(__dirname, "hexagrams.js");
const source = fs.readFileSync(filePath, "utf8");
const context = {};

vm.createContext(context);
vm.runInContext(`${source}\nthis.__data = { HEXAGRAMS, TRIGRAMS, VALUE_TO_TRIGRAM };`, context, {
  filename: "hexagrams.js"
});

const { HEXAGRAMS, TRIGRAMS, VALUE_TO_TRIGRAM } = context.__data;
const errors = [];
const warnings = [];

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function isBinaryKey(key, length) {
  return new RegExp(`^[01]{${length}}$`).test(key);
}

const hexEntries = Object.entries(HEXAGRAMS || {});
const trigramEntries = Object.entries(TRIGRAMS || {});

if (hexEntries.length !== 64) {
  addError(`HEXAGRAMS 应为 64 卦，当前为 ${hexEntries.length} 条。`);
}

const numbers = new Map();
const names = new Map();

for (const [key, hexagram] of hexEntries) {
  if (!isBinaryKey(key, 6)) addError(`卦 key 不合法：${key}`);

  if (!Number.isInteger(hexagram.number) || hexagram.number < 1 || hexagram.number > 64) {
    addError(`${key} 的 number 不在 1-64：${hexagram.number}`);
  } else if (numbers.has(hexagram.number)) {
    addError(`卦号重复：${hexagram.number}，${numbers.get(hexagram.number)} 与 ${key}`);
  } else {
    numbers.set(hexagram.number, key);
  }

  if (!hexagram.name || typeof hexagram.name !== "string") {
    addError(`${key} 缺少 name。`);
  } else if (names.has(hexagram.name)) {
    addError(`卦名重复：${hexagram.name}，${names.get(hexagram.name)} 与 ${key}`);
  } else {
    names.set(hexagram.name, key);
  }

  for (const field of ["palace", "judgement", "image", "advice"]) {
    if (!hexagram[field] || typeof hexagram[field] !== "string") {
      addError(`${key} ${hexagram.name || ""} 缺少 ${field}。`);
    }
  }

  if (!Array.isArray(hexagram.keywords) || hexagram.keywords.length < 3) {
    addError(`${key} ${hexagram.name || ""} keywords 少于 3 个。`);
  } else {
    for (const keyword of hexagram.keywords) {
      if (!keyword || typeof keyword !== "string") addError(`${key} ${hexagram.name || ""} 存在空 keyword。`);
    }
  }

  if (!Array.isArray(hexagram.lines) || hexagram.lines.length !== 6) {
    addError(`${key} ${hexagram.name || ""} lines 应为 6 条，当前为 ${Array.isArray(hexagram.lines) ? hexagram.lines.length : "非数组"}。`);
  } else {
    const expectedPatterns = [
      /^初[九六]/,
      /^[九六]二/,
      /^[九六]三/,
      /^[九六]四/,
      /^[九六]五/,
      /^上[九六]/
    ];
    hexagram.lines.forEach((line, index) => {
      if (!line || typeof line !== "string") {
        addError(`${key} ${hexagram.name || ""} 第 ${index + 1} 爻为空。`);
        return;
      }
      if (!line.includes("：")) {
        addWarning(`${key} ${hexagram.name || ""} 第 ${index + 1} 爻缺少中文冒号。`);
      }
      if (!expectedPatterns[index].test(line)) {
        addWarning(`${key} ${hexagram.name || ""} 第 ${index + 1} 爻开头格式异常：${line}`);
      }
    });
  }

  const lower = key.slice(0, 3);
  const upper = key.slice(3);
  if (!TRIGRAMS[lower]) addError(`${key} ${hexagram.name || ""} 下卦 key ${lower} 不存在于 TRIGRAMS。`);
  if (!TRIGRAMS[upper]) addError(`${key} ${hexagram.name || ""} 上卦 key ${upper} 不存在于 TRIGRAMS。`);
}

for (let number = 1; number <= 64; number += 1) {
  if (!numbers.has(number)) addError(`缺少卦号 ${number}。`);
}

if (trigramEntries.length !== 8) {
  addError(`TRIGRAMS 应为 8 条，当前为 ${trigramEntries.length} 条。`);
}

const trigramValues = new Map();
for (const [key, trigram] of trigramEntries) {
  if (!isBinaryKey(key, 3)) addError(`八卦 key 不合法：${key}`);
  if (!trigram.name || !trigram.nature || !Number.isInteger(trigram.value)) {
    addError(`TRIGRAMS ${key} 字段不完整。`);
  }
  if (trigramValues.has(trigram.value)) {
    addError(`八卦 value 重复：${trigram.value}`);
  } else {
    trigramValues.set(trigram.value, key);
  }
}

for (let value = 1; value <= 8; value += 1) {
  const key = VALUE_TO_TRIGRAM?.[String(value)];
  if (!key) addError(`VALUE_TO_TRIGRAM 缺少 ${value}。`);
  else if (!TRIGRAMS[key]) addError(`VALUE_TO_TRIGRAM ${value} 指向不存在的八卦 key：${key}`);
}

const report = {
  checkedAt: new Date().toISOString(),
  totals: {
    hexagrams: hexEntries.length,
    trigrams: trigramEntries.length,
    uniqueNumbers: numbers.size,
    uniqueNames: names.size
  },
  errors,
  warnings
};

fs.writeFileSync(path.join(__dirname, "hexagrams-validation-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log(`HEXAGRAMS: ${hexEntries.length}/64`);
console.log(`TRIGRAMS: ${trigramEntries.length}/8`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exitCode = 1;
}

if (warnings.length) {
  for (const warning of warnings) console.warn(`WARN: ${warning}`);
}
