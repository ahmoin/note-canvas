let ctx: AudioContext | null = null;

export function getAudioCtx(): AudioContext {
	if (!ctx) ctx = new AudioContext();
	if (ctx.state === "suspended") ctx.resume();
	return ctx;
}

function noise(ac: AudioContext, duration: number): AudioBufferSourceNode {
	const buf = ac.createBuffer(1, ac.sampleRate * duration, ac.sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	const src = ac.createBufferSource();
	src.buffer = buf;
	return src;
}

export function playKick(time: number) {
	const ac = getAudioCtx();
	const osc = ac.createOscillator();
	const gain = ac.createGain();
	osc.connect(gain);
	gain.connect(ac.destination);
	osc.frequency.setValueAtTime(150, time);
	osc.frequency.exponentialRampToValueAtTime(40, time + 0.3);
	gain.gain.setValueAtTime(1, time);
	gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
	osc.start(time);
	osc.stop(time + 0.4);
}

export function playSnare(time: number) {
	const ac = getAudioCtx();

	const nSrc = noise(ac, 0.2);
	const hp = ac.createBiquadFilter();
	hp.type = "highpass";
	hp.frequency.value = 1000;
	const nGain = ac.createGain();
	nSrc.connect(hp);
	hp.connect(nGain);
	nGain.connect(ac.destination);
	nGain.gain.setValueAtTime(0.8, time);
	nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
	nSrc.start(time);
	nSrc.stop(time + 0.2);

	const osc = ac.createOscillator();
	const oGain = ac.createGain();
	osc.frequency.value = 180;
	osc.connect(oGain);
	oGain.connect(ac.destination);
	oGain.gain.setValueAtTime(0.5, time);
	oGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
	osc.start(time);
	osc.stop(time + 0.1);
}

export function playClosedHihat(time: number) {
	const ac = getAudioCtx();
	const src = noise(ac, 0.05);
	const hp = ac.createBiquadFilter();
	hp.type = "highpass";
	hp.frequency.value = 7000;
	const gain = ac.createGain();
	src.connect(hp);
	hp.connect(gain);
	gain.connect(ac.destination);
	gain.gain.setValueAtTime(0.5, time);
	gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
	src.start(time);
	src.stop(time + 0.05);
}

export function playOpenHihat(time: number) {
	const ac = getAudioCtx();
	const src = noise(ac, 0.4);
	const hp = ac.createBiquadFilter();
	hp.type = "highpass";
	hp.frequency.value = 5000;
	const gain = ac.createGain();
	src.connect(hp);
	hp.connect(gain);
	gain.connect(ac.destination);
	gain.gain.setValueAtTime(0.4, time);
	gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
	src.start(time);
	src.stop(time + 0.4);
}

export function playPercussion(time: number) {
	const ac = getAudioCtx();
	const osc = ac.createOscillator();
	const gain = ac.createGain();
	osc.type = "triangle";
	osc.frequency.setValueAtTime(300, time);
	osc.frequency.exponentialRampToValueAtTime(100, time + 0.15);
	osc.connect(gain);
	gain.connect(ac.destination);
	gain.gain.setValueAtTime(0.7, time);
	gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
	osc.start(time);
	osc.stop(time + 0.15);
}

export function playRide(time: number) {
	const ac = getAudioCtx();
	const src = noise(ac, 0.6);
	const bp = ac.createBiquadFilter();
	bp.type = "bandpass";
	bp.frequency.value = 4000;
	bp.Q.value = 0.5;
	const gain = ac.createGain();
	src.connect(bp);
	bp.connect(gain);
	gain.connect(ac.destination);
	gain.gain.setValueAtTime(0.3, time);
	gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
	src.start(time);
	src.stop(time + 0.6);
}

export const DRUM_PLAYERS: Record<string, (time: number) => void> = {
	Kick: playKick,
	Snare: playSnare,
	"Closed Hat": playClosedHihat,
	"Open Hat": playOpenHihat,
	Percussion: playPercussion,
	Ride: playRide,
};
