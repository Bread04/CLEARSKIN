"use client";

interface VoiceToneResult {
  fatigue_detected: boolean;
  stress_likely: boolean;
  suggestion: string | null;
}

export function analyzeVoiceTone(audioData: Float32Array, sampleRate: number): VoiceToneResult {
  if (audioData.length === 0) {
    return { fatigue_detected: false, stress_likely: false, suggestion: null };
  }

  const rms = Math.sqrt(audioData.reduce((sum, v) => sum + v * v, 0) / audioData.length);

  let zeroCrossings = 0;
  for (let i = 1; i < audioData.length; i++) {
    if ((audioData[i] >= 0 && audioData[i - 1] < 0) || (audioData[i] < 0 && audioData[i - 1] >= 0)) {
      zeroCrossings++;
    }
  }
  const zcr = zeroCrossings / audioData.length;

  const blockSize = Math.floor(audioData.length / 4);
  const rmsBlocks = [];
  for (let i = 0; i < 4; i++) {
    const slice = audioData.slice(i * blockSize, (i + 1) * blockSize);
    rmsBlocks.push(Math.sqrt(slice.reduce((s, v) => s + v * v, 0) / slice.length));
  }

  const laterHalf = (rmsBlocks[2] + rmsBlocks[3]) / 2;
  const firstHalf = (rmsBlocks[0] + rmsBlocks[1]) / 2;
  const energyDrop = firstHalf > 0 ? (firstHalf - laterHalf) / firstHalf : 0;

  const fatigueDetected = energyDrop > 0.3 && zcr < 0.15;
  const stressLikely = rms > 0.15 && zcr > 0.25;

  let suggestion: string | null = null;
  if (fatigueDetected) {
    suggestion = "You sound a bit tired. Want to log stress or sleep?";
  } else if (stressLikely) {
    suggestion = "Your voice sounds tense — should I add stress to today's log?";
  }

  return { fatigue_detected: fatigueDetected, stress_likely: stressLikely, suggestion };
}

export function getVoiceToneStream(
  onResult: (result: VoiceToneResult) => void,
): { start: () => Promise<void>; stop: () => void } {
  let stream: MediaStream | null = null;
  let ctx: AudioContext | null = null;
  let processor: ScriptProcessorNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  const buffer: Float32Array[] = [];
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const start = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      ctx = new AudioContext();
      source = ctx.createMediaStreamSource(stream);
      processor = ctx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        buffer.push(new Float32Array(input));
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      timeout = setTimeout(() => {
        const combined = new Float32Array(buffer.reduce((s, b) => s + b.length, 0));
        let offset = 0;
        for (const b of buffer) {
          combined.set(b, offset);
          offset += b.length;
        }
        onResult(analyzeVoiceTone(combined, ctx!.sampleRate));
        stop();
      }, 3000);
    } catch {
      // Mic denied — silently skip tone analysis
    }
  };

  const stop = () => {
    if (timeout) clearTimeout(timeout);
    processor?.disconnect();
    source?.disconnect();
    ctx?.close();
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    ctx = null;
    processor = null;
    source = null;
  };

  return { start, stop };
}
