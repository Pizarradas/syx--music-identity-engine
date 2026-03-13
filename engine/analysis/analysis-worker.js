/**
 * Web Worker — análisis de audio fuera del hilo principal
 * Recibe samples y devuelve features. Sin Meyda (solo análisis nativo).
 */
function computeRms(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

function zeroCrossingRate(samples) {
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    if ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0)) crossings++;
  }
  return Math.min(1, Math.max(0, crossings / samples.length));
}

function extractFeaturesInWorker(data, fftSize, hopSamples) {
  const features = [];
  let pos = 0;
  let rmsPrev = 0;
  const rmsHistory = [];

  while (pos + fftSize <= data.length) {
    const window = data.subarray(pos, pos + fftSize);
    const rms = computeRms(window);
    const zcr = zeroCrossingRate(window);
    const spectralCentroid = Math.min(1, zcr * 1.2);
    const spectralRolloff = Math.min(1, 0.3 + rms * 0.7);
    const spectralFlatness = Math.max(0.2, 1 - rms);
    const spectralFlux = Math.min(1, Math.abs(rms - rmsPrev) * 4);
    rmsPrev = rms;

    const third = Math.floor(fftSize / 3);
    const bass = computeRms(window.subarray(0, third));
    const mids = computeRms(window.subarray(third, third * 2));
    const highs = computeRms(window.subarray(third * 2));
    const total = bass + mids + highs || 1e-10;
    const bandBass = Math.min(1, bass / total * 3);
    const bandMids = Math.min(1, mids / total * 3);
    const bandHighs = Math.min(1, highs / total * 3);

    rmsHistory.push(rms);
    if (rmsHistory.length > 20) rmsHistory.shift();
    const rmsMean = rmsHistory.reduce((a, b) => a + b, 0) / rmsHistory.length;
    const rmsVariance = rmsHistory.reduce((s, v) => s + (v - rmsMean) ** 2, 0) / rmsHistory.length;
    const dynamicRange = Math.min(1, Math.sqrt(rmsVariance) * 5);

    features.push({
      rms,
      spectralCentroid,
      spectralRolloff,
      spectralFlatness,
      spectralFlux,
      spectralSpread: 0.5,
      spectralKurtosis: spectralFlatness,
      perceptualSharpness: 0.5,
      perceptualSpread: 0.5,
      zcr,
      dynamicRange,
      bandBass,
      bandMids,
      bandHighs,
    });
    pos += hopSamples;
  }
  return features;
}

self.onmessage = (e) => {
  const { type, data, fftSize, hopSamples } = e.data;
  if (type !== 'analyze' || !data) return;
  try {
    const features = extractFeaturesInWorker(data, fftSize, hopSamples);
    self.postMessage({ type: 'done', features });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
