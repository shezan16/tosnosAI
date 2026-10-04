"use client";

export interface AudioFrequencyData {
  frequencyData: Uint8Array;
  volume: number;    // 0 to 1
  bass: number;      // 0 to 1 (20Hz - 250Hz)
  mid: number;       // 0 to 1 (250Hz - 2000Hz)
  high: number;      // 0 to 1 (2000Hz - 8000Hz)
}

export class AudioAnalyzer {
  private static instance: AudioAnalyzer | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaElementSourceMap: WeakMap<HTMLAudioElement, MediaElementAudioSourceNode> = new WeakMap();
  private micStreamSource: MediaStreamAudioSourceNode | null = null;
  private frequencyArray: Uint8Array = new Uint8Array(128);
  private isSyntheticSpeaking: boolean = false;
  private syntheticPhase: number = 0;

  private constructor() {}

  public static getInstance(): AudioAnalyzer {
    if (!AudioAnalyzer.instance) {
      AudioAnalyzer.instance = new AudioAnalyzer();
    }
    return AudioAnalyzer.instance;
  }

  /**
   * Initializes or resumes Web Audio API AudioContext
   */
  public initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
        this.frequencyArray = new Uint8Array(this.analyser.frequencyBinCount);
      }
    }

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch((e) => console.warn("AudioContext resume notice:", e));
    }

    return this.audioCtx;
  }

  /**
   * Connects an HTMLAudioElement (server TTS playback) to the Web Audio API AnalyserNode
   */
  public connectAudioElement(audio: HTMLAudioElement): void {
    try {
      this.initContext();
      if (!this.audioCtx || !this.analyser) return;

      // Avoid reconnecting the same audio element twice
      if (!this.mediaElementSourceMap.has(audio)) {
        audio.crossOrigin = "anonymous";
        const source = this.audioCtx.createMediaElementSource(audio);
        source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
        this.mediaElementSourceMap.set(audio, source);
      }
    } catch (e) {
      console.warn("Audio element Web Audio API notice:", e);
    }
  }

  /**
   * Connects a MediaStream (microphone recording) to the Web Audio API AnalyserNode
   */
  public connectMicrophoneStream(stream: MediaStream): void {
    try {
      this.initContext();
      if (!this.audioCtx || !this.analyser) return;

      this.disconnectMicrophone();
      this.micStreamSource = this.audioCtx.createMediaStreamSource(stream);
      this.micStreamSource.connect(this.analyser);
    } catch (e) {
      console.warn("Microphone stream Web Audio API notice:", e);
    }
  }

  public disconnectMicrophone(): void {
    if (this.micStreamSource) {
      try {
        this.micStreamSource.disconnect();
      } catch (e) {}
      this.micStreamSource = null;
    }
  }

  /**
   * Sets synthetic speech simulation state for WebSpeech Utterances
   */
  public setSyntheticSpeaking(speaking: boolean): void {
    this.isSyntheticSpeaking = speaking;
  }

  /**
   * Retrieves real-time audio frequency data and bands (0.0 to 1.0)
   */
  public getFrequencyData(): AudioFrequencyData {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyArray as any);
    }

    let sum = 0;
    let bassSum = 0;
    let midSum = 0;
    let highSum = 0;

    const len = this.frequencyArray.length;
    const bassBoundary = Math.floor(len * 0.15);
    const midBoundary = Math.floor(len * 0.55);

    for (let i = 0; i < len; i++) {
      const val = this.frequencyArray[i];
      sum += val;
      if (i < bassBoundary) bassSum += val;
      else if (i < midBoundary) midSum += val;
      else highSum += val;
    }

    let volume = sum / (len * 255);
    let bass = bassSum / (bassBoundary * 255);
    let mid = midSum / ((midBoundary - bassBoundary) * 255);
    let high = highSum / ((len - midBoundary) * 255);

    // If WebSpeech Utterance is active without Web Audio node, generate real-time acoustic speech cadence
    if (this.isSyntheticSpeaking && volume < 0.05) {
      this.syntheticPhase += 0.15;
      const speechEnvelope = (Math.sin(this.syntheticPhase) * 0.4 + 0.6) *
                             (Math.sin(this.syntheticPhase * 2.3) * 0.3 + 0.7);
      
      volume = Math.min(1, Math.max(0.2, speechEnvelope * 0.75));
      bass = Math.min(1, Math.max(0.15, speechEnvelope * 0.65 + Math.sin(this.syntheticPhase * 0.7) * 0.2));
      mid = Math.min(1, Math.max(0.25, speechEnvelope * 0.85 + Math.cos(this.syntheticPhase * 1.5) * 0.15));
      high = Math.min(1, Math.max(0.1, speechEnvelope * 0.5 + Math.sin(this.syntheticPhase * 3.1) * 0.2));

      // Synthesize frequency array bins for visualizer rendering
      for (let i = 0; i < len; i++) {
        const binFreq = (i / len) * 2;
        const binVal = Math.max(0, Math.sin(this.syntheticPhase * 2 + binFreq * 5) * 128 + 120) * volume;
        this.frequencyArray[i] = Math.min(255, Math.floor(binVal));
      }
    }

    return {
      frequencyData: this.frequencyArray,
      volume,
      bass,
      mid,
      high
    };
  }
}
