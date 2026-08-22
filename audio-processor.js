// 倾听树洞 · 麦克风 PCM 采样处理器（AudioWorklet）。
// 把浏览器采集到的 Float32 音频下采样到 16kHz，并转成 16-bit PCM（Int16），
// 通过 port 逐帧回传给主线程，再由主线程转发给后端 → 通义千问实时 ASR。
class PCM16Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    console.log("[audio-processor] 启动，AudioContext 采样率:", sampleRate);
  }
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const channel = input[0];
      const ratio = sampleRate / 16000;
      const len = Math.max(1, Math.floor(channel.length / ratio));
      const pcm = new Int16Array(len);
      for (let i = 0; i < len; i += 1) {
        const s = channel[Math.floor(i * ratio)] || 0;
        pcm[i] = Math.max(-32768, Math.min(32767, Math.round(s * 32767)));
      }
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }
    return true;
  }
}

registerProcessor("pcm16-processor", PCM16Processor);
