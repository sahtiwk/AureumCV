#include <emscripten/emscripten.h>
#include <cmath>
#include <vector>
#include <algorithm>

using namespace std;

extern "C" {

  struct Point {
      float x, y, z;
  };

  float getDist(Point p1, Point p2) {
      return sqrt(
          pow(p2.x - p1.x, 2) +
          pow(p2.y - p1.y, 2) +
          pow(p2.z - p1.z, 2)
      );
  }

  EMSCRIPTEN_KEEPALIVE
  float* analyzeFace(float* flattenedLandmarks, int numFloats) {
      static float results[4]; 
      
      if (numFloats < 1434) {
          results[0] = -1;
          return results;
      }

      Point pts[478];
      for(int i=0; i<478; i++) {
          pts[i].x = flattenedLandmarks[i*3];
          pts[i].y = flattenedLandmarks[i*3 + 1];
          pts[i].z = flattenedLandmarks[i*3 + 2];
      }

      float h = getDist(pts[10], pts[152]);
      float w = getDist(pts[234], pts[454]);
      float facialRatio = (w > 0) ? h / w : 0;

      float leftEyeW = getDist(pts[33], pts[133]);
      float rightEyeW = getDist(pts[263], pts[362]);
      float interEyeDist = getDist(pts[133], pts[362]);
      float eyeSpacingRatio = ((leftEyeW + rightEyeW) > 0) ? interEyeDist / ((leftEyeW + rightEyeW) / 2.0f) : 0;

      float distLeft = getDist(pts[1], pts[234]);
      float distRight = getDist(pts[1], pts[454]);
      
      float diff = abs(distLeft - distRight);
      float maxDist = max(distLeft, distRight);
      float symmetryScore = 100.0f;
      if (maxDist > 0) {
          symmetryScore = 100.0f * (1.0f - (diff / maxDist));
      }

      results[0] = facialRatio;
      results[1] = eyeSpacingRatio;
      results[2] = symmetryScore;
      
      float phiIdeal = 1.618f;
      float phiDeviation = abs(facialRatio - phiIdeal);
      results[3] = 100.0f * max(0.0f, 1.0f - (phiDeviation / phiIdeal));

      return results;
  }
}
