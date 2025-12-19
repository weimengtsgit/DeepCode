import { MetricPoint } from '../definitions';

export interface MetricGenerationConfig {
  base: number;      // Baseline value (e.g., 50% CPU)
  amplitude: number; // Wave height (e.g., +/- 20%)
  period: number;    // Cycle duration in ms (e.g., 1 hour = 3600000)
  noise: number;     // Random noise factor
  spikeChance?: number; // Probability 0-1 (default 0.05)
}

/**
 * Generates a realistic time-series metric array based on sine wave with noise and anomalies.
 * Algorithm: V(t) = Base + Trend + Seasonality + Noise + Anomaly
 * Formula: val = base + (amplitude * sin(t / period)) + (random() - 0.5) * noise_factor
 */
export function generateMetricSeries(
  startTime: number,
  endTime: number,
  interval: number = 60000, // Default 1 minute
  config: MetricGenerationConfig
): MetricPoint[] {
  const points: MetricPoint[] = [];
  const spikeChance = config.spikeChance ?? 0.05;

  for (let t = startTime; t <= endTime; t += interval) {
    // Calculate seasonality (Sine wave)
    // Angle = (timestamp / period) * 2PI to complete a cycle every 'period' ms
    const angle = (t / config.period) * 2 * Math.PI;
    let value = config.base + (config.amplitude * Math.sin(angle));

    // Add Noise
    const noiseVal = (Math.random() - 0.5) * config.noise;
    value += noiseVal;

    // Inject Anomalies (Spikes)
    // 5% chance to double the value (simulating load spike)
    if (Math.random() < spikeChance) {
      value *= 2.0;
    }

    // Sanity check: Value shouldn't be negative for most metrics
    if (value < 0) value = 0;

    points.push({
      timestamp: t,
      value: Number(value.toFixed(2)) // Keep precision reasonable
    });
  }

  return points;
}

/**
 * Helper to get a random integer between min and max
 */
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
