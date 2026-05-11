import { Landmark, PoseMetrics } from '@/types';

export class PoseEstimator {
  public static estimate(landmarks: Landmark[]): PoseMetrics {
    if (landmarks.length !== 478) {
      return { pitch: 0, yaw: 0, roll: 0 };
    }

    // 1. Roll (Tilt left/right)
    // Angle between left eye (33) and right eye (263) on the XY plane
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const dyRoll = rightEye.y - leftEye.y;
    const dxRoll = rightEye.x - leftEye.x;
    const roll = Math.atan2(dyRoll, dxRoll) * (180 / Math.PI);

    // 2. Yaw (Turn left/right)
    // Angle between left cheek (234) and right cheek (454) on the XZ plane
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    // In MediaPipe, Z is depth. Z < 0 is closer to camera.
    const dzYaw = rightCheek.z - leftCheek.z;
    const dxYaw = rightCheek.x - leftCheek.x;
    const yaw = Math.atan2(dzYaw, dxYaw) * (180 / Math.PI);

    // 3. Pitch (Nod up/down)
    // Angle between top of head (10) and chin (152) on the YZ plane
    const top = landmarks[10];
    const chin = landmarks[152];
    const dzPitch = chin.z - top.z;
    const dyPitch = chin.y - top.y;
    const pitch = Math.atan2(dzPitch, dyPitch) * (180 / Math.PI);

    return {
      pitch,
      yaw,
      roll
    };
  }
}
