"use client";

import { useEffect, useRef, useState } from "react";

type VoiceState = "idle" | "listening" | "processing";

interface UseVoiceTutorOptions {
  onFinalTranscript: (transcript: string) => Promise<void> | void;
}

interface SttMessage {
  transcript?: string;
  final?: boolean;
  speechEnded?: boolean;
}

const STT_WS_URL = "wss://testing-zone-hx7q.onrender.com";
const TARGET_SAMPLE_RATE = 16000;

function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number) {
  if (outputSampleRate >= inputSampleRate) {
    return buffer;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
      accum += buffer[i];
      count += 1;
    }

    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

function floatTo16BitPCM(input: Float32Array) {
  const output = new ArrayBuffer(input.length * 2);
  const view = new DataView(output);

  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return output;
}

export function useVoiceTutor({ onFinalTranscript }: UseVoiceTutorOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const transcriptBufferRef = useRef("");
  const speakAbortRef = useRef<AbortController | null>(null);
  const lastSpokenTextRef = useRef<string | null>(null);
  const captureEnabledRef = useRef(false);

  const [isSupported, setIsSupported] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setIsSupported(Boolean(window.AudioContext || window.webkitAudioContext));

    return () => {
      captureEnabledRef.current = false;
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      silentGainRef.current?.disconnect();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      audioContextRef.current?.close().catch(() => undefined);
      wsRef.current?.close();
      audioRef.current?.pause();
      if (audioRef.current?.src.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      speakAbortRef.current?.abort();
    };
  }, []);

  async function finalizeTranscript() {
    const transcript = transcriptBufferRef.current.trim();
    transcriptBufferRef.current = "";
    setInterimTranscript("");

    if (!transcript) {
      setVoiceState("idle");
      return;
    }

    setVoiceState("processing");
    await onFinalTranscriptRef.current(transcript);
    setVoiceState("idle");
  }

  function stopListening(releaseAll = false) {
    captureEnabledRef.current = false;

    if (releaseAll) {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      silentGainRef.current?.disconnect();
      processorRef.current = null;
      sourceRef.current = null;
      silentGainRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      wsRef.current?.close();
      wsRef.current = null;
      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
    }

    setVoiceState((current) => (current === "processing" ? current : "idle"));
  }

  async function ensureSocket() {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    const ws = new WebSocket(STT_WS_URL);
    ws.binaryType = "arraybuffer";

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data as string) as SttMessage;

      if (typeof data.transcript === "string") {
        if (data.final) {
          transcriptBufferRef.current = `${transcriptBufferRef.current} ${data.transcript}`.trim();
          setInterimTranscript(transcriptBufferRef.current);
        } else {
          setInterimTranscript(`${transcriptBufferRef.current} ${data.transcript}`.trim());
        }
      }

      if (data.speechEnded) {
        captureEnabledRef.current = false;
        await finalizeTranscript();
      }
    };

    ws.onerror = () => {
      setError("Could not connect to the STT WebSocket server.");
      stopListening(true);
    };

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onclose = () => reject(new Error("STT socket closed."));
    }).catch((caughtError) => {
      throw caughtError;
    });

    wsRef.current = ws;
    return ws;
  }

  async function ensureAudioPipeline() {
    if (processorRef.current && sourceRef.current && audioContextRef.current && silentGainRef.current && streamRef.current) {
      return;
    }

    const stream =
      streamRef.current ??
      (await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      }));
    streamRef.current = stream;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    const audioContext = audioContextRef.current ?? new AudioContextCtor();
    audioContextRef.current = audioContext;

    const source = sourceRef.current ?? audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;

    const silentGain = silentGainRef.current ?? audioContext.createGain();
    silentGain.gain.value = 0;
    silentGainRef.current = silentGain;

    const processor = processorRef.current ?? audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (event) => {
      if (!captureEnabledRef.current) {
        return;
      }

      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const input = event.inputBuffer.getChannelData(0);
      const downsampled = downsampleBuffer(input, audioContext.sampleRate, TARGET_SAMPLE_RATE);
      ws.send(floatTo16BitPCM(downsampled));
    };

    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);
  }

  async function startListening() {
    if (typeof window === "undefined" || voiceState === "listening" || isTutorSpeaking) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access is not available in this browser.");
      return;
    }

    try {
      setError(null);
      setInterimTranscript("");
      transcriptBufferRef.current = "";
      await ensureSocket();
      await ensureAudioPipeline();
      captureEnabledRef.current = true;
      setVoiceState("listening");
    } catch {
      setError("Microphone streaming could not start.");
      stopListening(true);
    }
  }

  async function speak(text: string) {
    if (typeof window === "undefined" || !text.trim()) {
      return;
    }

    if (lastSpokenTextRef.current === text) {
      return;
    }

    lastSpokenTextRef.current = text;
    speakAbortRef.current?.abort();
    const controller = new AbortController();
    speakAbortRef.current = controller;

    try {
      setError(null);
      setIsTutorSpeaking(true);
      audioRef.current?.pause();

      if (audioRef.current?.src.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("TTS request failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsTutorSpeaking(false);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setIsTutorSpeaking(false);
        URL.revokeObjectURL(url);
        setError("Tutor audio playback failed.");
      };

      await audio.play();
    } catch (caughtError) {
      setIsTutorSpeaking(false);

      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        return;
      }

      setError("Tutor voice could not be played.");
    }
  }

  return {
    error,
    interimTranscript,
    isSupported,
    isTutorSpeaking,
    startListening,
    stopListening,
    voiceState,
    speak,
  };
}
