// 倾听树洞 · 阿里通义千问（DashScope/百炼）语音能力。
// ASR：实时语音识别（WebSocket 流式）；TTS：语音合成（HTTP）。
// 中间的文字对话（LLM）复用 counsel-context.js 的心理疏导，不在此文件。

const { WebSocket } = require("ws");
const crypto = require("crypto");

function getVoiceConfig() {
  return {
    apiKey: process.env.DASHSCOPE_API_KEY || "",
    // 业务空间专属域名（默认用官方域名，Workspace 用户填自己的专属域名）
    baseHttpUrl: (process.env.DASHSCOPE_BASE_HTTP_URL || "https://dashscope.aliyuncs.com/api/v1").replace(/\/$/, ""),
    baseWsUrl: process.env.DASHSCOPE_BASE_WS_URL || "wss://dashscope.aliyuncs.com/api-ws/v1/inference",
    asrModel: process.env.DASHSCOPE_ASR_MODEL || "qwen-audio-3.0-asr-flash-streaming",
    ttsModel: process.env.DASHSCOPE_TTS_MODEL || "qwen-audio-3.0-tts-flash",
    ttsVoice: process.env.DASHSCOPE_TTS_VOICE || "longanhuan_v3.6"
  };
}

function voiceConfigured() {
  return Boolean(getVoiceConfig().apiKey);
}

// TTS：文本 → 音频 Buffer（HTTP 非流式，返回音频 URL 后下载）。
// 端点按 DashScope 多模态生成接口编写；若新版模型换了端点，改这里的 URL 即可。
async function synthesizeSpeech(text) {
  const config = getVoiceConfig();
  const url = `${config.baseHttpUrl}/services/audio/tts/SpeechSynthesizer`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.ttsModel,
      input: { text, voice: config.ttsVoice, format: "wav", sample_rate: 24000 }
    })
  });

  const data = await response.json().catch(() => ({}));
  console.log("[TTS] 状态:", response.status, "| 响应:", JSON.stringify(data).slice(0, 300));
  if (!response.ok) {
    throw new Error(data.message || data.code || `TTS 返回 ${response.status}`);
  }

  const audio = data.output?.audio || {};
  if (audio.url) {
    const audioRes = await fetch(audio.url);
    return Buffer.from(await audioRes.arrayBuffer());
  }
  if (audio.data) {
    return Buffer.from(audio.data, "base64");
  }
  throw new Error("TTS 未返回音频");
}

// ASR：创建实时识别会话（本服务作为 DashScope 的 WebSocket 客户端）。
// 浏览器把 PCM 16kHz 音频帧转发给本服务，本服务再转发给通义千问。
// 说明：实时 ASR 的 WebSocket 消息协议按 DashScope 标准格式编写（run-task/finish-task），
//       若 qwen-audio-3.0-* 新模型的协议有差异，仅需调整本函数内的消息结构。
function createAsrSession(onSentenceEnd, onError) {
  const config = getVoiceConfig();
  const ws = new WebSocket(config.baseWsUrl, {
    headers: { Authorization: `Bearer ${config.apiKey}` }
  });
  const taskId = crypto.randomUUID();

  ws.on("open", () => {
    console.log("[ASR] 已连接 DashScope，model=" + config.asrModel);
    ws.send(JSON.stringify({
      header: { action: "run-task", task_id: taskId, streaming: "duplex" },
      payload: {
        task_group: "audio",
        task: "asr",
        function: "recognition",
        model: config.asrModel,
        parameters: { format: "pcm", sample_rate: 16000 },
        input: {}
      }
    }));
  });

  ws.on("message", (data) => {
    const raw = data.toString();
    console.log("[ASR] 收到:", raw.slice(0, 500));
    try {
      const msg = JSON.parse(raw);
      const sentence = msg.payload?.output?.sentence;
      if (sentence && sentence.text && sentence.sentence_end) {
        onSentenceEnd(sentence.text);
      }
    } catch (error) {
      // 忽略无法解析的消息
    }
  });

  ws.on("error", (error) => {
    console.log("[ASR] 错误:", error.message);
    onError(error);
  });
  ws.on("close", (code, reason) => {
    console.log("[ASR] 关闭:", code, String(reason));
  });

  return {
    sendAudio(frame) {
      if (ws.readyState === WebSocket.OPEN) ws.send(frame);
    },
    finish() {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ header: { action: "finish-task", task_id: taskId, streaming: "duplex" }, payload: { input: {} } }));
      }
    },
    close() {
      try { ws.close(); } catch (error) {}
    }
  };
}

module.exports = { getVoiceConfig, voiceConfigured, synthesizeSpeech, createAsrSession };
