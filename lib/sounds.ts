import { getAudioCtx, getMasterDest } from "@/lib/audio";
import { rowToFreq } from "@/lib/music";

function noise(ac: AudioContext, duration: number): AudioBufferSourceNode {
	const buf = ac.createBuffer(
		1,
		Math.ceil(ac.sampleRate * duration),
		ac.sampleRate,
	);
	const data = buf.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	const src = ac.createBufferSource();
	src.buffer = buf;
	return src;
}

function softClipCurve(n = 512): Float32Array {
	const curve = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		const x = (i * 2) / n - 1;
		curve[i] = Math.tanh(x * 3) * 0.85;
	}
	return curve;
}

let _clipCurve: Float32Array | null = null;
function getClipCurve() {
	if (!_clipCurve) _clipCurve = softClipCurve();
	return _clipCurve;
}

export function playKick(time: number, dest?: AudioNode) {
	const ac = getAudioCtx();
	const d = dest ?? getMasterDest();

	const click = noise(ac, 0.012);
	const clickBp = ac.createBiquadFilter();
	clickBp.type = "bandpass";
	clickBp.frequency.value = 1400;
	clickBp.Q.value = 0.8;
	const clickGain = ac.createGain();
	click.connect(clickBp);
	clickBp.connect(clickGain);
	clickGain.connect(d);
	clickGain.gain.setValueAtTime(0.9, time);
	clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
	click.start(time);
	click.stop(time + 0.012);

	const osc = ac.createOscillator();
	osc.type = "sine";

	osc.frequency.setValueAtTime(180, time);
	osc.frequency.exponentialRampToValueAtTime(60, time + 0.04);
	osc.frequency.exponentialRampToValueAtTime(40, time + 0.55);

	const shaper = ac.createWaveShaper();
	shaper.curve = getClipCurve();
	shaper.oversample = "4x";

	const bodyGain = ac.createGain();
	bodyGain.gain.setValueAtTime(1.8, time);
	bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.55);

	osc.connect(shaper);
	shaper.connect(bodyGain);
	bodyGain.connect(d);
	osc.start(time);
	osc.stop(time + 0.56);
}

export function playSnare(time: number, dest?: AudioNode) {
	const ac = getAudioCtx();
	const d = dest ?? getMasterDest();

	for (const [freq, amp, decay] of [
		[180, 0.6, 0.08],
		[230, 0.4, 0.06],
	] as [number, number, number][]) {
		const osc = ac.createOscillator();
		const g = ac.createGain();
		osc.type = "triangle";
		osc.frequency.value = freq;
		osc.connect(g);
		g.connect(d);
		g.gain.setValueAtTime(amp, time);
		g.gain.exponentialRampToValueAtTime(0.001, time + decay);
		osc.start(time);
		osc.stop(time + decay + 0.01);
	}

	const nSrc = noise(ac, 0.22);
	const hp = ac.createBiquadFilter();
	hp.type = "highpass";
	hp.frequency.value = 800;
	const bp = ac.createBiquadFilter();
	bp.type = "bandpass";
	bp.frequency.value = 1200;
	bp.Q.value = 0.6;
	const nGain = ac.createGain();
	nSrc.connect(hp);
	hp.connect(bp);
	bp.connect(nGain);
	nGain.connect(d);
	nGain.gain.setValueAtTime(1.0, time);
	nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
	nSrc.start(time);
	nSrc.stop(time + 0.23);
}

export function playClosedHihat(time: number, dest?: AudioNode) {
	const ac = getAudioCtx();
	const d = dest ?? getMasterDest();

	const freqs = [205, 307, 398, 481, 612, 801].map((f) => f * 17);

	const merger = ac.createChannelMerger(1);

	for (const freq of freqs) {
		const osc = ac.createOscillator();
		osc.type = "square";
		osc.frequency.value = freq;
		const g = ac.createGain();
		g.gain.value = 1 / freqs.length;
		osc.connect(g);
		g.connect(merger);
		osc.start(time);
		osc.stop(time + 0.06);
	}

	const hp = ac.createBiquadFilter();
	hp.type = "highpass";
	hp.frequency.value = 7000;

	const envGain = ac.createGain();
	envGain.gain.setValueAtTime(0.55, time);
	envGain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);

	merger.connect(hp);
	hp.connect(envGain);
	envGain.connect(d);
}

export function playOpenHihat(time: number, dest?: AudioNode) {
	const ac = getAudioCtx();
	const d = dest ?? getMasterDest();

	const freqs = [205, 307, 398, 481, 612, 801].map((f) => f * 17);
	const merger = ac.createChannelMerger(1);

	for (const freq of freqs) {
		const osc = ac.createOscillator();
		osc.type = "square";
		osc.frequency.value = freq;
		const g = ac.createGain();
		g.gain.value = 1 / freqs.length;
		osc.connect(g);
		g.connect(merger);
		osc.start(time);
		osc.stop(time + 0.5);
	}

	const hp = ac.createBiquadFilter();
	hp.type = "highpass";
	hp.frequency.value = 5000;

	const envGain = ac.createGain();
	envGain.gain.setValueAtTime(0.45, time);
	envGain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

	merger.connect(hp);
	hp.connect(envGain);
	envGain.connect(d);
}

export function playClap(time: number, dest?: AudioNode) {
	const ac = getAudioCtx();
	const d = dest ?? getMasterDest();

	const offsets = [0, 0.008, 0.016, 0.024];
	for (const off of offsets) {
		const n = noise(ac, 0.04);
		const bp = ac.createBiquadFilter();
		bp.type = "bandpass";
		bp.frequency.value = 1100;
		bp.Q.value = 0.5;
		const hp = ac.createBiquadFilter();
		hp.type = "highpass";
		hp.frequency.value = 600;
		const g = ac.createGain();
		n.connect(bp);
		bp.connect(hp);
		hp.connect(g);
		g.connect(d);
		const t = time + off;
		g.gain.setValueAtTime(0, t);
		g.gain.linearRampToValueAtTime(0.85, t + 0.002);
		g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
		n.start(t);
		n.stop(t + 0.042);
	}

	const tail = noise(ac, 0.18);
	const tailBp = ac.createBiquadFilter();
	tailBp.type = "bandpass";
	tailBp.frequency.value = 900;
	tailBp.Q.value = 0.4;
	const tailGain = ac.createGain();
	tail.connect(tailBp);
	tailBp.connect(tailGain);
	tailGain.connect(d);
	tailGain.gain.setValueAtTime(0.4, time + 0.024);
	tailGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
	tail.start(time + 0.024);
	tail.stop(time + 0.19);
}

export function playPercussion(time: number, dest?: AudioNode) {
	const ac = getAudioCtx();
	const d = dest ?? getMasterDest();

	const osc = ac.createOscillator();
	osc.type = "sine";
	osc.frequency.setValueAtTime(420, time);
	osc.frequency.exponentialRampToValueAtTime(180, time + 0.14);

	const n = noise(ac, 0.008);
	const nHp = ac.createBiquadFilter();
	nHp.type = "highpass";
	nHp.frequency.value = 3000;
	const nGain = ac.createGain();
	n.connect(nHp);
	nHp.connect(nGain);
	nGain.connect(d);
	nGain.gain.setValueAtTime(0.5, time);
	nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.008);
	n.start(time);
	n.stop(time + 0.009);

	const gain = ac.createGain();
	osc.connect(gain);
	gain.connect(d);
	gain.gain.setValueAtTime(0.8, time);
	gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
	osc.start(time);
	osc.stop(time + 0.19);
}

export function playRide(time: number, dest?: AudioNode) {
	const ac = getAudioCtx();
	const d = dest ?? getMasterDest();

	const freqs = [205, 307, 398, 481, 612, 801].map((f) => f * 17);
	const merger = ac.createChannelMerger(1);

	for (const freq of freqs) {
		const osc = ac.createOscillator();
		osc.type = "square";
		osc.frequency.value = freq;
		const g = ac.createGain();
		g.gain.value = 1 / freqs.length;
		osc.connect(g);
		g.connect(merger);
		osc.start(time);
		osc.stop(time + 0.7);
	}

	const bp = ac.createBiquadFilter();
	bp.type = "bandpass";
	bp.frequency.value = 3800;
	bp.Q.value = 0.4;

	const envGain = ac.createGain();
	envGain.gain.setValueAtTime(0.3, time);
	envGain.gain.exponentialRampToValueAtTime(0.001, time + 0.65);

	merger.connect(bp);
	bp.connect(envGain);
	envGain.connect(d);
}

export function playPianoNote(
	row: number,
	time: number,
	duration = 0.3,
	dest?: AudioNode,
	gainScale = 1.0,
) {
	const ac = getAudioCtx();
	const freq = rowToFreq(row);

	const d = dest ?? getMasterDest();

	for (const [type, detune, amp] of [
		["sine", 0, 0.5],
		["triangle", 7, 0.25],
		["sine", -5, 0.15],
	] as [OscillatorType, number, number][]) {
		const osc = ac.createOscillator();
		const g = ac.createGain();
		osc.type = type;
		osc.frequency.value = freq;
		osc.detune.value = detune;
		osc.connect(g);
		g.connect(d);
		g.gain.setValueAtTime(amp * gainScale, time);
		g.gain.setValueAtTime(amp * gainScale, time + 0.005);
		g.gain.exponentialRampToValueAtTime(0.001, time + Math.max(duration, 0.05));
		osc.start(time);
		osc.stop(time + Math.max(duration, 0.05) + 0.01);
	}
}

export const DRUM_PLAYERS: Record<
	string,
	(time: number, dest?: AudioNode) => void
> = {
	Kick: playKick,
	Snare: playSnare,
	"Closed Hat": playClosedHihat,
	"Open Hat": playOpenHihat,
	Percussion: playPercussion,
	Ride: playRide,
};
