import { CoordinateSystem, Point } from "../base/Point";
import { Polyline } from "./Polyline";

/**
 * Represents a linear ring - a closed linestring with no self-intersections
 * Used internally by Polygon to represent boundaries
 */
class LinearRing extends Polyline {
  constructor(
    points: Point[],
    srid: number = 0,
    coordinateSystem: CoordinateSystem = CoordinateSystem.CARTESIAN_2D
  ) {
    super(points, srid, coordinateSystem);
    this.validateAsRing();
  }

  private validateAsRing(): void {
    if (this.getNumPoints() < 4) {
      throw new Error('A LinearRing must have at least 4 points (first and last being the same)');
    }

    if (!this.isClosed()) {
      throw new Error('A LinearRing must be closed (first and last points must be equal)');
    }

    // Basic self-intersection check
    // Note: A more sophisticated algorithm would be needed for production use
    const points = this.getPoints();
    for (let i = 0; i < points.length - 2; i++) {
      for (let j = i + 2; j < points.length - 1; j++) {
        if (this.segmentsIntersect(
          points[i], points[i + 1],
          points[j], points[j + 1]
        )) {
          throw new Error('A LinearRing cannot have self-intersections');
        }
      }
    }
  }

  private segmentsIntersect(
    p1: Point, p2: Point,
    p3: Point, p4: Point
  ): boolean {
    // Implementation of line segment intersection test
    const ccw = (A: Point, B: Point, C: Point): number => {
      return (C.getY() - A.getY()) * (B.getX() - A.getX()) -
             (B.getY() - A.getY()) * (C.getX() - A.getX());
    };

    const a = ccw(p1, p2, p3);
    const b = ccw(p1, p2, p4);
    const c = ccw(p3, p4, p1);
    const d = ccw(p3, p4, p2);

    if (((a > 0 && b < 0) || (a < 0 && b > 0)) &&
        ((c > 0 && d < 0) || (c < 0 && d > 0))) {
      return true;
    }

    return false;
  }

  public override getGeometryType(): string {
    return 'LinearRing';
  }
}

export { LinearRing };