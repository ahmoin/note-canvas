let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let masterAnalyser: AnalyserNode | null = null;
const trackGains = new Map<number, GainNode>();
const trackAnalysers = new Map<number, AnalyserNode>();

export function getAudioCtx(): AudioContext {
	if (!ctx) ctx = new AudioContext();
	if (ctx.state === "suspended") ctx.resume();
	return ctx;
}

export function getMasterDest(): GainNode {
	const ac = getAudioCtx();
	if (!masterGain) {
		masterGain = ac.createGain();
		masterAnalyser = ac.createAnalyser();
		masterAnalyser.fftSize = 1024;
		masterAnalyser.smoothingTimeConstant = 0;
		masterGain.connect(masterAnalyser);
		masterAnalyser.connect(ac.destination);
	}
	return masterGain;
}

export function getMasterAnalyser(): AnalyserNode | null {
	return masterAnalyser;
}

export function getTrackDest(ti: number): GainNode {
	if (!trackGains.has(ti)) {
		const ac = getAudioCtx();
		const gain = ac.createGain();
		const analyser = ac.createAnalyser();
		analyser.fftSize = 1024;
		analyser.smoothingTimeConstant = 0;
		gain.connect(analyser);
		analyser.connect(getMasterDest());
		trackGains.set(ti, gain);
		trackAnalysers.set(ti, analyser);
	}
	return trackGains.get(ti)!;
}

export function getTrackAnalyser(ti: number): AnalyserNode | null {
	return trackAnalysers.get(ti) ?? null;
}

export function setTrackGainValue(ti: number, value: number) {
	const gain = trackGains.get(ti);
	if (gain) gain.gain.value = value;
}
