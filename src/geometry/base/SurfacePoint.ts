import { Point } from "./Point";

export interface SurfacePoint {
    point: Point;
    u: number;  // First surface parameter (0 to 1)
    v: number;  // Second surface parameter (0 to 1)
  }