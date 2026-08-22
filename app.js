const state = {
  lines: [],
  moving: [],
  log: [],
  isAnimating: false,
  finished: false,
  currentResult: null,
  aiLoading: false,
  currentHistoryId: null,
  castMode: "coin",
  audience: ""
};

let currentModule = "divination";
let treeholeMode = "vent";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const AUDIENCE_OPTIONS = [
  { value: "", label: "自动" },
  { value: "研究生", label: "研究生·博士生" },
  { value: "青年教师", label: "青年高校教师" }
];

const AUDIENCE_SCENARIOS = {
  "研究生": [
    { value: "学业科研", label: "学业科研" },
    { value: "导师关系", label: "导师关系" },
    { value: "经济生活", label: "经济生活" },
    { value: "人际孤独", label: "人际孤独" },
    { value: "就业发展", label: "就业发展" },
    { value: "心态认同", label: "心态认同" }
  ],
  "青年教师": [
    { value: "考核晋升", label: "考核晋升" },
    { value: "教学学生", label: "教学学生" },
    { value: "学术行政", label: "学术行政" },
    { value: "经济生活", label: "经济生活" },
    { value: "身份认同", label: "身份认同" },
    { value: "家庭失衡", label: "家庭失衡" }
  ]
};

const SCENARIO_OFFLINE_TIPS = {
  "学业科研": "放到学业科研的处境里看，重点是分清哪些是你能控制的努力、哪些要等时机：顺时就推进、主动请教，不顺就先补短板、把目标拆小，别急着否定自己。",
  "导师关系": "放到师生相处的处境里看，重在守正与自保：守住原则与底线，用理性沟通代替情绪对抗，必要时向学院、学校或可信的人求助。",
  "经济生活": "放到经济的处境里看，眼下的拮据或落差是真实的：量入为出、做长期规划，看到当下投入或积累的长期价值，别为一时的钱透支健康。",
  "人际孤独": "放到人际的处境里看，孤独不是你的错：可以主动但有边界地走出去一小步，同门或同事相处和而不同，亲密关系重在沟通。",
  "就业发展": "放到择业的处境里看，卦象提示的是取向而非结论：对照自己更看重进取、安稳还是避险，梳理沉没成本与真实意愿，再理性权衡。",
  "心态认同": "放到心态的处境里看，眼下更需要稳住节奏：把「我不适合」换成「我遇到了什么具体困难」，允许自己慢一点，先动一小步。",
  "考核晋升": "放到考核晋升的处境里看，制度性压力是真实的：分清可控的努力与不可控的规则，顺时打磨本子、主动合作，逆时调整节奏、留好后路。",
  "教学学生": "放到教学的处境里看，重在初心与边界的平衡：不必两头自责，学生沟通因材施教、留出边界，找到教学与科研的节奏。",
  "学术行政": "放到学术生态的处境里看，对规则的失望是正常的：守住初心，适应规则的同时保护真正的科研时间，在制度内找自主空间。",
  "身份认同": "放到身份转换的处境里看，过渡期的笨拙与孤独都是正常的：接纳它，主动寻找同行支持，重新定义自己作为学者与教师的身份。",
  "家庭失衡": "放到工作与生活的处境里看，可持续比透支更重要：给家庭、健康和自我留出时间，把节奏拉长，别让短期指标耗尽长期的自己。"
};

function getSelectedScenario() {
  const active = $("#scenario-tags .scenario-tag.active");
  return active ? active.dataset.value : "";
}

function setScenario(value) {
  $$("#scenario-tags .scenario-tag").forEach((tag) => {
    const active = tag.dataset.value === value;
    tag.classList.toggle("active", active);
    tag.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function getSelectedAudience() {
  const active = $("#audience-tags .scenario-tag.active");
  return active ? active.dataset.value : "";
}

function setAudience(value) {
  $$("#audience-tags .scenario-tag").forEach((tag) => {
    const active = tag.dataset.value === value;
    tag.classList.toggle("active", active);
    tag.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function renderAudienceTags() {
  const container = $("#audience-tags");
  container.innerHTML = "";
  AUDIENCE_OPTIONS.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scenario-tag";
    button.dataset.value = item.value;
    button.textContent = item.label;
    button.setAttribute("aria-pressed", item.value === "" ? "true" : "false");
    if (item.value === "") button.classList.add("active");
    container.appendChild(button);
  });
}

function renderScenarioTags() {
  const container = $("#scenario-tags");
  container.innerHTML = "";
  const list = [{ value: "", label: "自动" }].concat(AUDIENCE_SCENARIOS[getSelectedAudience()] || []);
  list.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scenario-tag";
    button.dataset.value = item.value;
    button.textContent = item.label;
    button.setAttribute("aria-pressed", item.value === "" ? "true" : "false");
    if (item.value === "") button.classList.add("active");
    container.appendChild(button);
  });
}

const HISTORY_KEY = "zhouyi-history-v1";
const HISTORY_LIMIT = 50;

function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch (error) {
    // localStorage 不可用或已满时静默失败，不影响起卦本身。
  }
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function formatHistoryTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function refreshHistoryCount() {
  const n = loadHistory().length;
  $("#history-toggle").textContent = n ? `历史记录（${n}）` : "历史记录";
}

function recordHistory() {
  const entries = loadHistory();
  const id = Date.now();
  entries.unshift({
    id,
    time: id,
    question: $("#question").value.trim(),
    audience: getSelectedAudience(),
    scenario: getSelectedScenario(),
    lines: state.lines.slice(),
    moving: state.moving.slice(),
    ai: null
  });
  if (entries.length > HISTORY_LIMIT) entries.length = HISTORY_LIMIT;
  saveHistory(entries);
  state.currentHistoryId = id;
  refreshHistoryCount();
}

function updateHistoryAi(text) {
  if (state.currentHistoryId == null) return;
  const entries = loadHistory();
  const entry = entries.find((e) => e.id === state.currentHistoryId);
  if (!entry) return;
  entry.ai = text;
  saveHistory(entries);
}

function deleteHistoryEntry(id) {
  saveHistory(loadHistory().filter((e) => e.id !== id));
}

function restoreHistoryEntry(id) {
  const entry = loadHistory().find((e) => e.id === id);
  if (!entry) return;

  state.lines = entry.lines.slice();
  state.moving = entry.moving.slice();
  state.log = [];
  state.isAnimating = false;
  state.finished = true;
  state.aiLoading = false;
  state.currentHistoryId = entry.id;

  $("#question").value = entry.question || "";
  setAudience(entry.audience || "");
  renderScenarioTags();
  setScenario(entry.scenario || "");

  updateReading(state.lines, state.moving);
  renderProgress();

  if (entry.ai) {
    $("#ai-output").textContent = entry.ai;
  }

  $("#primary-hexagram").classList.add("result-pulse");
  window.setTimeout(() => $("#primary-hexagram").classList.remove("result-pulse"), 700);
}

function renderHistoryList() {
  const entries = loadHistory();
  const list = $("#history-list");
  if (!entries.length) {
    list.innerHTML = `<div class="history-empty">还没有记录，起一卦后会自动保存。</div>`;
    return;
  }
  list.innerHTML = entries.map((e) => {
    const primary = HEXAGRAMS[e.lines.join("")];
    const name = primary ? `${primary.number}. ${primary.name}` : "未知卦";
    const question = e.question || "（未填写问题）";
    const meta = [e.audience, e.scenario, formatHistoryTime(e.time), e.ai ? "已AI解读" : ""].filter(Boolean).join(" · ");
    return `
      <div class="history-item" data-id="${e.id}">
        <span class="history-q">${escapeHtml(question)} · ${escapeHtml(name)}</span>
        <span class="history-meta">${escapeHtml(meta)}</span>
        <button class="history-del" type="button" data-del="${e.id}">删除</button>
      </div>
    `;
  }).join("");
}

function sanitizeChineseText(text) {
  const traditionalMap = {
    "為": "为", "會": "会", "這": "这", "個": "个", "與": "与", "風": "风",
    "說": "说", "應": "应", "對": "对", "於": "于", "後": "后", "來": "来",
    "時": "时", "點": "点", "動": "动", "靜": "静", "辭": "辞", "義": "义",
    "氣": "气", "裡": "里", "壓": "压", "關": "关", "係": "系", "還": "还",
    "進": "进", "過": "过", "現": "现", "實": "实", "選": "选", "擇": "择",
    "險": "险", "調": "调", "計": "计", "劃": "划", "溝": "沟", "獲": "获",
    "認": "认", "證": "证", "較": "较", "穩": "稳", "當": "当", "務": "务",
    "廣": "广", "復": "复", "雜": "杂", "簡": "简", "體": "体", "漢": "汉",
    "貞": "贞", "無": "无", "斷": "断", "顯": "显", "將": "将", "從": "从",
    "給": "给", "並": "并", "讓": "让", "別": "别", "萬": "万", "種": "种",
    "長": "长", "處": "处", "產": "产", "業": "业", "權": "权"
  };

  return String(text || "")
    .replace(/\*\*/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[\u0060#>_~]/g, "")
    .replace(/[•●◆◇■□▪▫]/g, "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[為會這個與風說應對於後來時點動靜辭義氣裡壓關係還進過現實選擇險調計劃溝獲認證較穩當務廣復雜簡體漢貞無斷顯將從給並讓別萬種長處產業權]/g, (char) => traditionalMap[char] || char)
    .trim();
}

function keyFromLines(lines) {
  return lines.join("");
}

function changedLines(lines, moving) {
  return lines.map((line, index) => moving.includes(index) ? (line ? 0 : 1) : line);
}

function lineName(index) {
  return ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"][index];
}

function nextButtonText(count) {
  return count >= 6 ? "已经成卦" : `摇第${["一", "二", "三", "四", "五", "六"][count]}下`;
}

function numberToTrigram(n) {
  const r = n % 8;
  return VALUE_TO_TRIGRAM[String(r === 0 ? 8 : r)];
}

function movingIndexFromNumber(n) {
  const r = n % 6;
  return r === 0 ? 5 : r - 1;
}

function linesFromTrigrams(upper, lower) {
  return (lower + upper).split("").map(Number);
}

function buildMutual(lines) {
  return [lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]];
}

function diZhiHour(hour) {
  return (Math.floor((hour + 1) / 2) % 12) + 1;
}

function castFromTime(now) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const sum = year + month + day;
  const hour = diZhiHour(now.getHours());
  const upper = numberToTrigram(sum % 8);
  const lower = numberToTrigram((sum + hour) % 8);
  const movingIndex = movingIndexFromNumber((sum + hour) % 6);
  return { lines: linesFromTrigrams(upper, lower), moving: [movingIndex] };
}

function castFromNumbers(a, b) {
  const upper = numberToTrigram(a);
  const lower = numberToTrigram(b);
  const movingIndex = movingIndexFromNumber((a + b) % 6);
  return { lines: linesFromTrigrams(upper, lower), moving: [movingIndex] };
}

function renderHexagram(target, lines, moving = [], placeholder = false) {
  const displayLines = placeholder ? Array.from({ length: 6 }, (_, index) => lines[index]) : lines;

  target.innerHTML = displayLines.map((line, index) => {
    if (line == null) {
      return `<div class="yao empty" aria-label="${lineName(index)}未摇出"></div>`;
    }

    const movingClass = moving.includes(index) ? " moving" : "";
    const kind = line ? "yang" : "yin";
    const inner = line ? "<span></span>" : "";
    const mark = moving.includes(index) ? "<b class=\"mark\">变</b>" : "";
    return `<div class="yao ${kind}${movingClass}" aria-label="${lineName(index)}${line ? "阳" : "阴"}">${inner}${mark}</div>`;
  }).join("");
}

function buildOfflineExplanation(primary, changed, moving, question, scenario) {
  const asked = question.trim();
  const questionText = asked ? `你问的是“${asked}”。` : "你还没有写具体问题，所以这里只按卦象本身来说明。";
  const core = `${primary.name}这一卦的核心气质，可以从“${primary.keywords.join("、")}”这几个关键词来理解。`;
  const movement = moving.length
    ? `这次有${moving.map((index) => lineName(index)).join("、")}动，说明事情里有正在变化的位置，不能只看表面局面，还要看这些变化会把事情带向哪里。`
    : "这次没有动爻，说明事情暂时更偏稳定，重点是理解本卦所提示的处境和做事方式。";
  const trend = moving.length
    ? `变化之后成为${changed.name}，也就是说后续趋势会从${primary.keywords.join("、")}，慢慢转向${changed.keywords.join("、")}。`
    : "因为没有动爻，之卦不另起变化，可以把本卦看作当前和短期内最主要的参考。";
  const scenarioNote = Object.prototype.hasOwnProperty.call(SCENARIO_OFFLINE_TIPS, scenario)
    ? SCENARIO_OFFLINE_TIPS[scenario]
    : "";
  return `${questionText}${core}${primary.advice}${movement}${trend}${scenarioNote}`;
}

function refreshOfflineExplanation() {
  const result = state.currentResult;
  if (!result) return;
  $("#offline-explain").textContent = buildOfflineExplanation(
    result.primary,
    result.changedHex,
    state.moving,
    $("#question").value,
    getSelectedScenario()
  );
}

function renderLineGrid(lines, moving, primary) {
  const rows = [0, 1, 2, 3, 4, 5].map((index) => {
    const isMoving = moving.includes(index);
    const card = `
      <div class="line-card ${isMoving ? "moving-line" : "static-line"}">
        <strong>${lineName(index)}：${lines[index] ? "阳爻" : "阴爻"}${isMoving ? "动" : "静"}</strong>
        <p class="classic-text">${primary.lines[index]}</p>
      </div>
    `;
    return `
      <div class="line-grid-row">
        <div>${isMoving ? "" : card}</div>
        <div>${isMoving ? card : ""}</div>
      </div>
    `;
  }).join("");

  $("#line-grid").innerHTML = rows;
}

function buildResult(lines, moving) {
  const changed = changedLines(lines, moving);
  const primary = HEXAGRAMS[keyFromLines(lines)];
  const changedHex = HEXAGRAMS[keyFromLines(changed)];
  const mutualLines = buildMutual(lines);
  const mutualHex = HEXAGRAMS[keyFromLines(mutualLines)];
  const lower = TRIGRAMS[lines.slice(0, 3).join("")];
  const upper = TRIGRAMS[lines.slice(3).join("")];
  const changedLower = TRIGRAMS[changed.slice(0, 3).join("")];
  const changedUpper = TRIGRAMS[changed.slice(3).join("")];
  const mutualLower = TRIGRAMS[mutualLines.slice(0, 3).join("")];
  const mutualUpper = TRIGRAMS[mutualLines.slice(3).join("")];

  return { changed, primary, changedHex, mutualLines, mutualHex, lower, upper, changedLower, changedUpper, mutualLower, mutualUpper };
}

function updateReading(lines, moving) {
  const result = buildResult(lines, moving);
  const { changed, primary, changedHex, mutualLines, mutualHex, lower, upper, changedLower, changedUpper, mutualLower, mutualUpper } = result;
  state.currentResult = result;

  $("#primary-title").textContent = `${primary.number}. ${primary.name}`;
  $("#mutual-title").textContent = `${mutualHex.number}. ${mutualHex.name}`;
  $("#changed-title").textContent = moving.length ? `${changedHex.number}. ${changedHex.name}` : "无变卦";
  $("#primary-meta").textContent = `${upper.name}${lower.name}：上${upper.nature}下${lower.nature}。`;
  $("#mutual-meta").textContent = `${mutualUpper.name}${mutualLower.name}：上${mutualUpper.nature}下${mutualLower.nature}。`;
  $("#changed-meta").textContent = moving.length
    ? `${changedUpper.name}${changedLower.name}：上${changedUpper.nature}下${changedLower.nature}。`
    : "六爻皆静，之卦与本卦相同。";

  renderHexagram($("#primary-hexagram"), lines, moving);
  renderHexagram($("#mutual-hexagram"), mutualLines, []);
  renderHexagram($("#changed-hexagram"), changed, []);

  $("#judgement").textContent = `${primary.judgement}${primary.image}`;
  $("#judgement-keywords").innerHTML = primary.keywords.map((keyword) => `<span>${keyword}</span>`).join("");
  $("#mutual-note").textContent = `互卦（过程）：${mutualHex.name}。关键词：${mutualHex.keywords.join("、")}。${mutualHex.advice}`;
  $("#offline-explain").textContent = buildOfflineExplanation(primary, changedHex, moving, $("#question").value, getSelectedScenario());
  renderLineGrid(lines, moving, primary);

  $("#ai-interpret").disabled = false;
  $("#ai-output").textContent = "点击“AI 解读”，让大模型结合你的问题与研究生处境，参考本卦、互卦、动爻和之卦生成解读。";
}

function resetReadingText() {
  state.currentResult = null;
  $("#primary-title").textContent = "等待起卦";
  $("#mutual-title").textContent = "未定";
  $("#changed-title").textContent = "未定";
  $("#primary-meta").textContent = "请在左侧起卦。";
  $("#mutual-meta").textContent = "互卦（过程）会在这里显示。";
  $("#changed-meta").textContent = "有动爻时，会在这里显示之卦。";
  $("#judgement").textContent = "成卦后，这里会显示卦辞方向和现实问题的切入点。";
  $("#judgement-keywords").innerHTML = "";
  $("#mutual-note").textContent = "";
  $("#offline-explain").textContent = "离线白话解释会在成卦后显示。";
  $("#line-grid").textContent = "尚未起卦。";
  $("#ai-output").textContent = "完成起卦后，可请求 AI 结合研究生处境生成个性化解读。";
  $("#ai-interpret").disabled = true;
}

const coinSound = new Audio(encodeURI("铜钱.m4a"));
coinSound.preload = "auto";
coinSound.volume = 0.85;

function coinFace(value) {
  return value === 3 ? "阳" : "阴";
}

function playCoinSound() {
  try {
    const sound = coinSound.cloneNode(true);
    sound.volume = coinSound.volume;
    sound.currentTime = 0;
    const playTask = sound.play();
    if (playTask && typeof playTask.catch === "function") {
      playTask.catch((error) => console.warn("coin sound unavailable", error));
    }
  } catch (error) {
    console.warn("coin sound unavailable", error);
  }
}

function lineFromSum(sum) {
  if (sum === 6) return { line: 0, moving: true, name: "老阴", text: "阴爻动，变阳" };
  if (sum === 7) return { line: 1, moving: false, name: "少阳", text: "阳爻不变" };
  if (sum === 8) return { line: 0, moving: false, name: "少阴", text: "阴爻不变" };
  return { line: 1, moving: true, name: "老阳", text: "阳爻动，变阴" };
}

function coinMarkup(value) {
  if (value === 3) {
    return `
      <span class="coin-char coin-top">乾</span>
      <span class="coin-char coin-bottom">隆</span>
      <span class="coin-char coin-left">寶</span>
      <span class="coin-char coin-right">通</span>
      <span class="coin-hole" aria-hidden="true"></span>
    `;
  }

  return `
    <span class="coin-pattern coin-pattern-left" aria-hidden="true"></span>
    <span class="coin-pattern coin-pattern-right" aria-hidden="true"></span>
    <span class="coin-hole" aria-hidden="true"></span>
  `;
}

function setCoins(tosses) {
  $$('[data-coin]').forEach((coin, index) => {
    coin.innerHTML = coinMarkup(tosses[index]);
    coin.setAttribute("aria-label", coinFace(tosses[index]));
    coin.classList.toggle("coin-yang", tosses[index] === 3);
    coin.classList.toggle("coin-yin", tosses[index] === 2);
  });
}

function animateCoins(tosses) {
  const coins = $$('[data-coin]');
  playCoinSound();

  const table = $(".table-surface") || $(".coin-scene");
  const rect = table.getBoundingClientRect();
  const landingZones = [
    { x: [-0.22, 0.22], y: [-0.18, 0.06], rz: [-18, 18] },
    { x: [-0.28, -0.08], y: [0.00, 0.20], rz: [-22, 16] },
    { x: [0.08, 0.28], y: [0.00, 0.20], rz: [-16, 22] }
  ];
  const randomBetween = ([min, max]) => min + Math.random() * (max - min);

  coins.forEach((coin, index) => {
    const zone = landingZones[index] || landingZones[0];
    const x = Math.round(randomBetween(zone.x) * rect.width);
    const y = Math.round(randomBetween(zone.y) * rect.height);
    const rz = Math.round(randomBetween(zone.rz));
    coin.style.setProperty("--land-x", `${x}px`);
    coin.style.setProperty("--land-y", `${y}px`);
    coin.style.setProperty("--land-rz", `${rz}deg`);
    coin.style.animationDelay = "0ms";
    coin.classList.remove("flipping", "landed");
    void coin.offsetWidth;
    coin.classList.add("flipping");
  });

  window.setTimeout(() => {
    setCoins(tosses);
    coins.forEach((coin) => {
      coin.classList.remove("flipping");
      coin.classList.add("landed");
    });
  }, 1040);
}

function renderProgress() {
  if (!state.finished) {
    renderHexagram($("#primary-hexagram"), state.lines, state.moving, true);
    renderHexagram($("#changed-hexagram"), [], [], true);
  }

  $("#cast-preview").innerHTML = Array.from({ length: 6 }, (_, index) => {
    const line = state.lines[index];
    const isMoving = state.moving.includes(index);
    const label = line == null ? "未摇" : `${line ? "阳" : "阴"}${isMoving ? "变" : ""}`;
    return `<span class="${line == null ? "pending" : "done"}">${lineName(index)}：${label}</span>`;
  }).join("");

  $("#coin-log").innerHTML = state.log.map((item) => `<li>${item}</li>`).join("");

  $("#coin-toss").textContent = primaryActionText();
  $("#coin-toss").disabled = state.isAnimating || state.finished;
  $("#cast-step").textContent = castStepText();
  $("#cast-hint").textContent = castHintText();
}

function tossOneLine() {
  if (state.isAnimating || state.finished) return;

  state.isAnimating = true;
  renderProgress();

  const tosses = [0, 0, 0].map(() => Math.random() < 0.5 ? 2 : 3);
  const sum = tosses.reduce((total, item) => total + item, 0);
  const result = lineFromSum(sum);
  const index = state.lines.length;

  animateCoins(tosses);

  window.setTimeout(() => {
    state.lines.push(result.line);
    if (result.moving) state.moving.push(index);
    state.log.push(`${lineName(index)}：${tosses.map(coinFace).join("、")}，合 ${sum}，${result.name}（${result.text}）`);
    state.isAnimating = false;

    if (state.lines.length === 6) {
      state.finished = true;
      updateReading(state.lines, state.moving);
      recordHistory();
      $("#primary-hexagram").classList.add("result-pulse");
      window.setTimeout(() => $("#primary-hexagram").classList.remove("result-pulse"), 700);
    }

    renderProgress();
  }, 1230);
}

function resetCast() {
  state.lines = [];
  state.moving = [];
  state.log = [];
  state.isAnimating = false;
  state.finished = false;
  state.aiLoading = false;
  state.currentHistoryId = null;
  setCoins([3, 2, 3]);
  resetReadingText();
  renderProgress();
}

function primaryActionText() {
  if (state.castMode === "time") return state.finished ? "已经成卦" : "按时间起卦";
  if (state.castMode === "number") return state.finished ? "已经成卦" : "按数字起卦";
  return nextButtonText(state.lines.length);
}

function castStepText() {
  if (state.finished) return "六爻已成";
  if (state.castMode === "time") return "时间起卦";
  if (state.castMode === "number") return "数字起卦";
  return `已摇 ${state.lines.length} / 6`;
}

function castHintText() {
  if (state.finished) return "下拉页面查看参考和详解";
  if (state.castMode === "time") return "点击一次，按当前公历时间成卦。";
  if (state.castMode === "number") return "输入两个正整数后点击成卦。";
  return "每点一次摇出一爻，从初爻往上排。";
}

function setCastMode(mode) {
  state.castMode = mode;
  $$("#cast-mode .cast-mode-btn").forEach((btn) => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-checked", active ? "true" : "false");
  });
  $("#coin-scene").hidden = mode !== "coin";
  $("#time-panel").hidden = mode !== "time";
  $("#number-panel").hidden = mode !== "number";
  if (mode === "time") updateTimeInfo();
  renderProgress();
}

function timeInfoText(now) {
  const names = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}年${pad(now.getMonth() + 1)}月${pad(now.getDate())}日 ${names[diZhiHour(now.getHours()) - 1]}时`;
}

function updateTimeInfo() {
  $("#time-info").textContent = `当前：${timeInfoText(new Date())}。`;
}

function finishCast(lines, moving, logSummary) {
  state.lines = lines;
  state.moving = moving;
  state.log = [logSummary];
  state.isAnimating = false;
  state.finished = true;
  updateReading(state.lines, state.moving);
  recordHistory();
  renderProgress();
  $("#primary-hexagram").classList.add("result-pulse");
  window.setTimeout(() => $("#primary-hexagram").classList.remove("result-pulse"), 700);
}

function castByTime() {
  if (state.isAnimating || state.finished) return;
  const now = new Date();
  const { lines, moving } = castFromTime(now);
  finishCast(lines, moving, `时间起卦：${timeInfoText(now)}`);
}

function castByNumber() {
  if (state.isAnimating || state.finished) return;
  const a = parseInt($("#num-upper").value, 10);
  const b = parseInt($("#num-lower").value, 10);
  if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0) {
    alert("请输入两个正整数（上卦数、下卦数）。");
    return;
  }
  const { lines, moving } = castFromNumbers(a, b);
  finishCast(lines, moving, `数字起卦：${a}、${b}`);
}

function handlePrimaryAction() {
  if (state.castMode === "time") castByTime();
  else if (state.castMode === "number") castByNumber();
  else tossOneLine();
}

function buildAiPayload() {
  const { primary, changedHex, mutualHex } = state.currentResult;
  return {
    question: $("#question").value.trim(),
    audience: getSelectedAudience(),
    scenario: getSelectedScenario(),
    lines: state.lines,
    movingLineIndexes: state.moving,
    movingLines: state.moving.map((index) => ({
      position: lineName(index),
      text: primary.lines[index]
    })),
    primaryHexagram: {
      number: primary.number,
      name: primary.name,
      palace: primary.palace,
      judgement: primary.judgement,
      image: primary.image,
      keywords: primary.keywords,
      advice: primary.advice
    },
    changedHexagram: {
      number: changedHex.number,
      name: changedHex.name,
      palace: changedHex.palace,
      keywords: changedHex.keywords,
      advice: changedHex.advice
    },
    mutualHexagram: {
      number: mutualHex.number,
      name: mutualHex.name,
      keywords: mutualHex.keywords,
      advice: mutualHex.advice
    },
    staticAdvice: $("#offline-explain").textContent
  };
}

function setAiLoading(loading) {
  state.aiLoading = loading;
  $("#ai-interpret").disabled = loading || !state.finished;
  $("#ai-interpret").textContent = loading ? "解读中..." : "AI 解读";
}

async function requestAiInterpretation() {
  if (!state.finished || state.aiLoading || !state.currentResult) return;

  setAiLoading(true);
  $("#ai-output").textContent = "正在生成解读...";

  try {
    const response = await fetch("/api/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildAiPayload())
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI 解读请求失败");
    }

    const cleanInterpretation = sanitizeChineseText(data.interpretation);
    const modelNote = data.showModel ? `\n\n（本次由第 ${data.providerIndex} 组 API 的 ${data.model} 模型生成）` : "";
    const fullText = `${cleanInterpretation}${modelNote}`;
    $("#ai-output").textContent = fullText;
    updateHistoryAi(fullText);
  } catch (error) {
    $("#ai-output").textContent = `暂时无法生成 AI 解读：${error.message}`;
  } finally {
    setAiLoading(false);
  }
}

// ---- 心理树洞 ----
const TREEHOLE_ENTRIES_KEY = "treehole-entries-v1";
const TREEHOLE_CHAT_KEY = "treehole-chat-v1";
const TREEHOLE_MEMORY_KEY = "treehole-memory-v1";

function setModule(module) {
  currentModule = module;
  $$(".nav-btn").forEach((btn) => {
    const active = btn.dataset.module === module;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
  $("#landing-module").hidden = module !== "landing";
  $("#divination-module").hidden = module !== "divination";
  $("#treehole-module").hidden = module !== "treehole";
  $("#voice-module").hidden = module !== "voice";
  if (module === "treehole") {
    renderVentList();
    renderChatThread();
    renderMemory();
  }
  if (module === "voice") {
    connectVoice();
    renderVoiceHistory();
    renderVoiceMemory();
  }
}

function loadTreeholeEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TREEHOLE_ENTRIES_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) { return []; }
}

function saveTreeholeEntries(entries) {
  try { localStorage.setItem(TREEHOLE_ENTRIES_KEY, JSON.stringify(entries)); } catch (error) {}
}

function loadTreeholeChat() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TREEHOLE_CHAT_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) { return []; }
}

function saveTreeholeChat(chat) {
  try { localStorage.setItem(TREEHOLE_CHAT_KEY, JSON.stringify(chat)); } catch (error) {}
}

function loadMemory() {
  try { return localStorage.getItem(TREEHOLE_MEMORY_KEY) || ""; } catch (error) { return ""; }
}

function saveMemory(memory) {
  try { localStorage.setItem(TREEHOLE_MEMORY_KEY, memory || ""); } catch (error) {}
}

function setTreeholeMode(mode) {
  treeholeMode = mode;
  $$("#treehole-mode .cast-mode-btn").forEach((btn) => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-checked", active ? "true" : "false");
  });
  $("#memory-toggle-row").hidden = mode !== "vent";
  $("#chat-thread").hidden = mode !== "chat";
  $("#vent-list").hidden = mode === "chat";
  $("#treehole-prompt").textContent = mode === "vent" ? "写下此刻的心情…" : "和 AI 聊聊你的处境…";
  $("#treehole-submit").textContent = mode === "vent" ? "投进树洞" : "发送";
  $("#treehole-content-title").textContent = mode === "vent" ? "倾诉记录" : "对话记录";
  renderVentList();
  renderChatThread();
}

function renderVentList() {
  const entries = loadTreeholeEntries();
  const list = $("#vent-list");
  if (!entries.length) {
    list.innerHTML = `<div class="treehole-empty">还没有倾诉过。写点什么，把它投进树洞吧。</div>`;
    return;
  }
  list.innerHTML = entries.map((e) => `
    <div class="vent-item">
      <div class="vent-meta">${escapeHtml(formatHistoryTime(e.time))}</div>
      <div class="vent-text">${escapeHtml(e.text)}</div>
    </div>
  `).join("");
}

function appendChatMessage(role, text) {
  const chat = loadTreeholeChat();
  chat.push({ id: Date.now(), time: Date.now(), role, text });
  if (chat.length > 200) chat.splice(0, chat.length - 200);
  saveTreeholeChat(chat);
  renderChatThread();
}

function renderChatThread() {
  const chat = loadTreeholeChat();
  const thread = $("#chat-thread");
  if (!chat.length) {
    thread.innerHTML = `<div class="treehole-empty">在这里和 AI 聊聊。它会结合你的长期记忆，帮你理清处境。</div>`;
    return;
  }
  thread.innerHTML = chat.map((m) => `
    <div class="chat-msg ${m.role === "user" ? "user" : "ai"}">
      <div class="chat-bubble">${escapeHtml(m.text)}</div>
    </div>
  `).join("");
  const scroll = $(".treehole-scroll");
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
}

function showThinking() {
  hideThinking();
  const bubble = document.createElement("div");
  bubble.className = "chat-msg ai thinking";
  bubble.id = "ai-thinking";
  bubble.innerHTML = `<div class="chat-bubble">AI 正在思考…</div>`;
  $("#chat-thread").appendChild(bubble);
  const scroll = $(".treehole-scroll");
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
}

function hideThinking() {
  const thinking = $("#ai-thinking");
  if (thinking) thinking.remove();
}

function renderMemory() {
  $("#memory-content").value = loadMemory() || "（暂无记忆）";
}

function toggleMemory() {
  const content = $("#memory-content");
  const actions = $("#memory-actions");
  const show = content.hidden;
  content.hidden = !show;
  actions.hidden = !show;
  $("#memory-toggle").textContent = show ? "收起" : "查看";
  if (show) renderMemory();
}

function editMemory() {
  const content = $("#memory-content");
  const willEdit = content.readOnly;
  content.readOnly = !willEdit;
  $("#memory-save").hidden = !willEdit;
  $("#memory-edit").textContent = willEdit ? "取消" : "编辑";
  if (willEdit) {
    content.focus();
  } else {
    content.value = loadMemory() || "（暂无记忆）";
  }
}

function saveMemoryEdit() {
  const content = $("#memory-content");
  saveMemory(content.value.trim());
  content.readOnly = true;
  $("#memory-save").hidden = true;
  $("#memory-edit").textContent = "编辑";
  renderMemory();
}

function clearMemory() {
  if (!confirm("确定清空 AI 对你的长期记忆吗？")) return;
  saveMemory("");
  renderMemory();
}

const CRISIS_KEYWORDS = ["自杀", "不想活", "活不下去", "想死", "一了百了", "结束生命", "自残", "自伤", "割腕", "轻生", "不想存在", "消失算了", "活着没意思", "死了算了", "了断"];

function hasCrisisContent(text) {
  return CRISIS_KEYWORDS.some((kw) => text.includes(kw));
}

function showCrisisNotice() {
  const notice = $("#crisis-notice");
  notice.hidden = false;
  notice.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderTreeholeAudienceTags() {
  const container = $("#treehole-audience-tags");
  container.innerHTML = "";
  AUDIENCE_OPTIONS.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scenario-tag";
    button.dataset.value = item.value;
    button.textContent = item.label;
    button.setAttribute("aria-pressed", item.value === "" ? "true" : "false");
    if (item.value === "") button.classList.add("active");
    container.appendChild(button);
  });
}

function getTreeholeAudience() {
  const active = $("#treehole-audience-tags .scenario-tag.active");
  return active ? active.dataset.value : "";
}

function clearTreeholeRecords() {
  if (treeholeMode === "vent") {
    if (!confirm("确定清空所有倾诉记录吗？")) return;
    saveTreeholeEntries([]);
    renderVentList();
  } else {
    if (!confirm("确定清空所有对话记录吗？")) return;
    saveTreeholeChat([]);
    renderChatThread();
  }
}

async function submitTreehole() {
  const input = $("#treehole-input");
  const text = input.value.trim();
  if (!text) return;
  const audience = getTreeholeAudience();

  if (hasCrisisContent(text)) showCrisisNotice();

  if (treeholeMode === "vent") {
    const entries = loadTreeholeEntries();
    entries.unshift({ id: Date.now(), time: Date.now(), text });
    if (entries.length > 100) entries.length = 100;
    saveTreeholeEntries(entries);
    input.value = "";
    renderVentList();

    if ($("#memory-update-check").checked) {
      try {
        const res = await fetch("/api/remember", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, memory: loadMemory(), audience })
        });
        const data = await res.json();
        if (res.ok && data.memory) {
          saveMemory(data.memory);
          renderMemory();
        }
      } catch (error) {
        // 记忆更新失败不影响倾诉本身
      }
    }
  } else {
    $("#treehole-submit").disabled = true;
    $("#treehole-submit").textContent = "发送中…";
    input.value = "";
    appendChatMessage("user", text);
    showThinking();
    try {
      const res = await fetch("/api/counsel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, memory: loadMemory(), audience })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "心理疏导暂时不可用");
      }
      appendChatMessage("ai", data.reply || "");
      if (data.memory) {
        saveMemory(data.memory);
        renderMemory();
      }
    } catch (error) {
      appendChatMessage("ai", `暂时无法回复：${error.message}`);
    } finally {
      hideThinking();
      $("#treehole-submit").disabled = false;
      $("#treehole-submit").textContent = "发送";
    }
  }
}

// ---- 倾听树洞（实时语音 + 文字回退，长期记忆与心理树洞共用）----
let voiceSocket = null;
let voiceStream = null;
let voiceAudioContext = null;
let voiceProcessorNode = null;
let voiceRecording = false;

function renderVoiceAudienceTags() {
  const container = $("#voice-audience-tags");
  container.innerHTML = "";
  AUDIENCE_OPTIONS.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scenario-tag";
    button.dataset.value = item.value;
    button.textContent = item.label;
    button.setAttribute("aria-pressed", item.value === "" ? "true" : "false");
    if (item.value === "") button.classList.add("active");
    container.appendChild(button);
  });
}

function getVoiceAudience() {
  const active = $("#voice-audience-tags .scenario-tag.active");
  return active ? active.dataset.value : "";
}

function connectVoice() {
  if (voiceSocket && (voiceSocket.readyState === WebSocket.OPEN || voiceSocket.readyState === WebSocket.CONNECTING)) return;
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  voiceSocket = new WebSocket(`${proto}//${location.host}/api/voice`);

  voiceSocket.onopen = () => {
    updateVoiceStatus("已连接，等待服务状态…", false);
    voiceSocket.send(JSON.stringify({ type: "config", memory: loadMemory(), audience: getVoiceAudience() }));
  };

  voiceSocket.onmessage = (event) => {
    if (typeof event.data === "string") {
      let msg;
      try { msg = JSON.parse(event.data); } catch (error) { return; }
      if (msg.type === "status") {
        updateVoiceStatus(msg.text, msg.voiceReady);
      } else if (msg.type === "reply") {
        removeVoiceThinking();
        appendVoiceMessage("ai", msg.text);
        persistVoiceMessage("ai", msg.text);
        if (msg.memory) {
          saveMemory(msg.memory);
          renderVoiceMemory();
        }
      } else if (msg.type === "transcript") {
        appendVoiceMessage("user", msg.text);
        persistVoiceMessage("user", msg.text);
        appendVoiceThinking();
      } else if (msg.type === "error") {
        removeVoiceThinking();
        appendVoiceMessage("ai", msg.text);
      }
    } else {
      playVoiceAudio(event.data);
    }
  };

  voiceSocket.onclose = () => updateVoiceStatus("连接已断开，切回本模块可重连。", false);
  voiceSocket.onerror = () => updateVoiceStatus("连接出错，请刷新页面重试。", false);
}

function updateVoiceStatus(text, ready) {
  const el = $("#voice-status");
  el.textContent = text;
  el.classList.toggle("ready", Boolean(ready));
}

function appendVoiceMessage(role, text) {
  const thread = $("#voice-transcript");
  const div = document.createElement("div");
  div.className = `chat-msg ${role === "user" ? "user" : "ai"}`;
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.textContent = text;
  div.appendChild(bubble);
  thread.appendChild(div);
  const scroll = thread.closest(".treehole-scroll");
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
}

function appendVoiceThinking() {
  removeVoiceThinking();
  const div = document.createElement("div");
  div.className = "chat-msg ai thinking";
  div.id = "voice-thinking";
  div.innerHTML = `<div class="chat-bubble">AI 正在思考…</div>`;
  $("#voice-transcript").appendChild(div);
  const scroll = $("#voice-transcript").closest(".treehole-scroll");
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
}

function removeVoiceThinking() {
  const thinking = $("#voice-thinking");
  if (thinking) thinking.remove();
}

function sendVoiceText() {
  const input = $("#voice-input");
  const text = input.value.trim();
  if (!text) return;
  if (!voiceSocket || voiceSocket.readyState !== WebSocket.OPEN) {
    connectVoice();
    return;
  }
  input.value = "";
  appendVoiceMessage("user", text);
  appendVoiceThinking();
  voiceSocket.send(JSON.stringify({ type: "message", text, memory: loadMemory(), audience: getVoiceAudience() }));
}

async function startVoiceRecording() {
  if (voiceRecording) return;
  if (!voiceSocket || voiceSocket.readyState !== WebSocket.OPEN) return;
  try {
    voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    voiceAudioContext = new AudioContext();
    if (voiceAudioContext.state === "suspended") await voiceAudioContext.resume();
    await voiceAudioContext.audioWorklet.addModule("audio-processor.js");
    const source = voiceAudioContext.createMediaStreamSource(voiceStream);
    voiceProcessorNode = new AudioWorkletNode(voiceAudioContext, "pcm16-processor");
    voiceProcessorNode.port.onmessage = (event) => {
      console.log("[voice] 发送 PCM 帧:", event.data.byteLength, "字节");
      if (voiceSocket && voiceSocket.readyState === WebSocket.OPEN) {
        voiceSocket.send(event.data);
      }
    };
    source.connect(voiceProcessorNode);
    voiceProcessorNode.connect(voiceAudioContext.destination);
    voiceRecording = true;
    $("#voice-record").classList.add("recording");
    $("#voice-record").textContent = "松开结束";
    console.log("[voice] 开始录音");
  } catch (error) {
    updateVoiceStatus("无法访问麦克风，请检查浏览器权限。", false);
  }
}

function stopVoiceRecording() {
  if (!voiceRecording) return;
  voiceRecording = false;
  if (voiceStream) voiceStream.getTracks().forEach((track) => track.stop());
  if (voiceAudioContext) {
    voiceAudioContext.close().catch(() => {});
  }
  voiceStream = null;
  voiceAudioContext = null;
  voiceProcessorNode = null;
  if (voiceSocket && voiceSocket.readyState === WebSocket.OPEN) {
    voiceSocket.send(JSON.stringify({ type: "finish" }));
  }
  $("#voice-record").classList.remove("recording");
  $("#voice-record").textContent = "按住说话";
}

function playVoiceAudio(data) {
  try {
    const blob = new Blob([data], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play().catch(() => {});
  } catch (error) {
    // 播放失败不影响文字展示
  }
}

// 倾听树洞的「我的 AI 记忆」与历史记录（与心理树洞共用同一份数据）
function renderVoiceMemory() {
  $("#voice-memory-content").value = loadMemory() || "（暂无记忆）";
}

function toggleVoiceMemory() {
  const content = $("#voice-memory-content");
  const actions = $("#voice-memory-actions");
  const show = content.hidden;
  content.hidden = !show;
  actions.hidden = !show;
  $("#voice-memory-toggle").textContent = show ? "收起" : "查看";
  if (show) renderVoiceMemory();
}

function editVoiceMemory() {
  const content = $("#voice-memory-content");
  const willEdit = content.readOnly;
  content.readOnly = !willEdit;
  $("#voice-memory-save").hidden = !willEdit;
  $("#voice-memory-edit").textContent = willEdit ? "取消" : "编辑";
  if (willEdit) content.focus();
  else content.value = loadMemory() || "（暂无记忆）";
}

function saveVoiceMemoryEdit() {
  const content = $("#voice-memory-content");
  saveMemory(content.value.trim());
  content.readOnly = true;
  $("#voice-memory-save").hidden = true;
  $("#voice-memory-edit").textContent = "编辑";
  renderVoiceMemory();
}

function clearVoiceMemory() {
  if (!confirm("确定清空 AI 对你的长期记忆吗？")) return;
  saveMemory("");
  renderVoiceMemory();
}

function persistVoiceMessage(role, text) {
  const chat = loadTreeholeChat();
  chat.push({ id: Date.now(), time: Date.now(), role, text });
  if (chat.length > 200) chat.splice(0, chat.length - 200);
  saveTreeholeChat(chat);
}

function renderVoiceHistory() {
  const chat = loadTreeholeChat();
  const thread = $("#voice-transcript");
  thread.innerHTML = "";
  if (!chat.length) {
    thread.innerHTML = `<div class="treehole-empty">在这里用语音和 AI 聊聊。它会结合你的长期记忆，帮你理清处境。</div>`;
    return;
  }
  chat.forEach((m) => {
    const div = document.createElement("div");
    div.className = `chat-msg ${m.role === "user" ? "user" : "ai"}`;
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = m.text;
    div.appendChild(bubble);
    thread.appendChild(div);
  });
  const scroll = thread.closest(".treehole-scroll");
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
}

function clearVoiceRecords() {
  if (!confirm("确定清空对话记录吗？")) return;
  saveTreeholeChat([]);
  renderVoiceHistory();
}

function bindEvents() {
  $("#coin-toss").addEventListener("click", handlePrimaryAction);
  $("#reset-cast").addEventListener("click", resetCast);
  $("#cast-mode").addEventListener("click", (event) => {
    const btn = event.target.closest(".cast-mode-btn");
    if (!btn) return;
    setCastMode(btn.dataset.mode);
  });
  $("#ai-interpret").addEventListener("click", requestAiInterpretation);
  $("#question").addEventListener("input", () => {
    if (state.finished) refreshOfflineExplanation();
  });
  $("#audience-tags").addEventListener("click", (event) => {
    const tag = event.target.closest(".scenario-tag");
    if (!tag) return;
    setAudience(tag.dataset.value);
    renderScenarioTags();
    if (state.finished) refreshOfflineExplanation();
  });
  $("#scenario-tags").addEventListener("click", (event) => {
    const tag = event.target.closest(".scenario-tag");
    if (!tag) return;
    setScenario(tag.dataset.value);
    if (state.finished) refreshOfflineExplanation();
  });
  $("#history-toggle").addEventListener("click", () => {
    renderHistoryList();
    $("#history-modal").hidden = false;
  });
  $("#history-close").addEventListener("click", () => {
    $("#history-modal").hidden = true;
  });
  $("#history-modal").addEventListener("click", (event) => {
    if (event.target === $("#history-modal")) $("#history-modal").hidden = true;
  });
  $("#history-list").addEventListener("click", (event) => {
    const del = event.target.closest("[data-del]");
    if (del) {
      deleteHistoryEntry(Number(del.dataset.del));
      renderHistoryList();
      refreshHistoryCount();
      return;
    }
    const item = event.target.closest(".history-item");
    if (!item) return;
    restoreHistoryEntry(Number(item.dataset.id));
    $("#history-modal").hidden = true;
  });
  $("#history-clear").addEventListener("click", () => {
    if (!confirm("确定清空所有历史记录吗？")) return;
    saveHistory([]);
    renderHistoryList();
    refreshHistoryCount();
  });
  $("#top-nav").addEventListener("click", (event) => {
    const btn = event.target.closest(".nav-btn");
    if (!btn) return;
    setModule(btn.dataset.module);
  });
  $$(".landing-card").forEach((card) => {
    card.addEventListener("click", () => setModule(card.dataset.module));
  });
  $("#treehole-mode").addEventListener("click", (event) => {
    const btn = event.target.closest(".cast-mode-btn");
    if (!btn) return;
    setTreeholeMode(btn.dataset.mode);
  });
  $("#treehole-submit").addEventListener("click", submitTreehole);
  $("#memory-toggle").addEventListener("click", toggleMemory);
  $("#memory-clear").addEventListener("click", clearMemory);
  $("#memory-edit").addEventListener("click", editMemory);
  $("#memory-save").addEventListener("click", saveMemoryEdit);
  $("#clear-treehole").addEventListener("click", clearTreeholeRecords);
  $("#voice-send").addEventListener("click", sendVoiceText);
  $("#voice-record").addEventListener("mousedown", startVoiceRecording);
  $("#voice-record").addEventListener("mouseup", stopVoiceRecording);
  $("#voice-record").addEventListener("touchstart", (event) => {
    event.preventDefault();
    startVoiceRecording();
  });
  $("#voice-record").addEventListener("touchend", stopVoiceRecording);
  $("#voice-audience-tags").addEventListener("click", (event) => {
    const tag = event.target.closest(".scenario-tag");
    if (!tag) return;
    $$("#voice-audience-tags .scenario-tag").forEach((btn) => {
      const active = btn.dataset.value === tag.dataset.value;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  });
  $("#clear-voice").addEventListener("click", clearVoiceRecords);
  $("#voice-memory-toggle").addEventListener("click", toggleVoiceMemory);
  $("#voice-memory-edit").addEventListener("click", editVoiceMemory);
  $("#voice-memory-save").addEventListener("click", saveVoiceMemoryEdit);
  $("#voice-memory-clear").addEventListener("click", clearVoiceMemory);
  $("#treehole-audience-tags").addEventListener("click", (event) => {
    const tag = event.target.closest(".scenario-tag");
    if (!tag) return;
    $$("#treehole-audience-tags .scenario-tag").forEach((btn) => {
      const active = btn.dataset.value === tag.dataset.value;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("#history-modal").hidden) {
      $("#history-modal").hidden = true;
    }
  });
}

renderAudienceTags();
renderScenarioTags();
renderTreeholeAudienceTags();
renderVoiceAudienceTags();
bindEvents();
setCastMode("coin");
resetCast();
refreshHistoryCount();
setModule("landing");
setTreeholeMode("vent");
renderMemory();
renderVoiceHistory();
renderVoiceMemory();



















