import { Landmark } from '@/types';

export class TemporalSmoother {
  private static cachedLandmarks: Landmark[] | null = null;

  public static smooth(raw: Landmark[]): Landmark[] {
    if (!this.cachedLandmarks || raw.length !== this.cachedLandmarks.length) {
      this.cachedLandmarks = raw.map(p => ({ ...p })); // Deep copy
      return raw;
    }

    // Calculate motion delta to determine dynamic alpha
    const anchors = [1, 33, 263, 152]; // Nose, left eye, right eye, chin
    let totalDelta = 0;
    for (const idx of anchors) {
      const p1 = this.cachedLandmarks[idx];
      const p2 = raw[idx];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      totalDelta += Math.hypot(dx, dy);
    }
    const avgDelta = totalDelta / anchors.length;

    // Dynamic Exponential Moving Average (EMA)
    // High alpha = follow raw closely (fast movement)
    // Low alpha = rely on history (heavy smoothing for stillness)
    let alpha = 0.5;
    if (avgDelta < 0.002) alpha = 0.08; // Ultra still, heavy smooth
    else if (avgDelta < 0.005) alpha = 0.2;  // Slight movement
    else if (avgDelta < 0.015) alpha = 0.6;  // Normal movement
    else alpha = 0.95; // Fast movement, almost zero smooth to prevent lag

    // Apply EMA directly to cached landmarks
    for (let i = 0; i < raw.length; i++) {
      const curr = raw[i];
      const prev = this.cachedLandmarks[i];
      
      prev.x = alpha * curr.x + (1 - alpha) * prev.x;
      prev.y = alpha * curr.y + (1 - alpha) * prev.y;
      prev.z = alpha * curr.z + (1 - alpha) * prev.z;
      prev.visibility = curr.visibility;
    }

    // Return a fresh copy of the smoothed landmarks
    return this.cachedLandmarks.map(p => ({ ...p }));
  }
}
