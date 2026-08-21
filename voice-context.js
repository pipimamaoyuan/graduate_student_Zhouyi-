// 倾听树洞 · 阿里通义千问（DashScope/百炼）语音能力。
// 预留：DASHSCOPE_API_KEY 用于「实时语音识别(ASR)」与「语音合成(TTS)」。
//
// 接入说明（后续只需替换下面两个函数，其余代码无需改动）：
//   1. transcribeAudio：把音频块转成文字 —— 对接通义千问「实时语音识别」Paraformer（WebSocket 流式）。
//   2. synthesizeSpeech：把文字转成音频 —— 对接通义千问「语音合成」CosyVoice / Sambert。
//
// 在此之前，/api/voice 会以「文字模式」工作：用户直接发文字，复用心理疏导 + 长期记忆，
// 保证「倾听树洞」在语音 API 未配置时依然可用。

function getVoiceConfig() {
  return {
    apiKey: process.env.DASHSCOPE_API_KEY || ""
  };
}

function voiceConfigured() {
  return Boolean(getVoiceConfig().apiKey);
}

// 占位：实时语音识别（音频块 -> 文字）。
// TODO: 接入通义千问实时语音识别（Paraformer，WebSocket 流式）。
// 返回识别出的文字片段；未接入时返回空字符串。
async function transcribeAudio(audioChunk) {
  void audioChunk;
  return "";
}

// 占位：语音合成（文字 -> 音频）。
// TODO: 接入通义千问语音合成（CosyVoice / Sambert）。
// 返回合成的音频 Buffer；未接入时返回 null。
async function synthesizeSpeech(text) {
  void text;
  return null;
}

module.exports = { voiceConfigured, transcribeAudio, synthesizeSpeech };
