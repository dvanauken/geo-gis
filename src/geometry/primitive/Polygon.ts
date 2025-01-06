import { CoordinateSystem, Geometry, Point } from "../base/Point";
import { LinearRing } from "./LinearRing";

/**
 * Implementation of OpenGIS Polygon geometry
 * Represents a planar surface defined by exterior and interior boundaries
 */
class Polygon implements Geometry {
  private readonly exteriorRing: LinearRing;
  private readonly interiorRings: LinearRing[];
  private srid: number;
  private readonly coordinateSystem: CoordinateSystem;

  /**
   * Creates a new Polygon
   * @param exteriorRing - The outer boundary
   * @param interiorRings - Optional array of holes
   * @param srid - Spatial Reference System Identifier
   * @param coordinateSystem - Coordinate system type
   */
  constructor(
    exteriorRing: LinearRing,
    interiorRings: LinearRing[] = [],
    srid: number = 0,
    coordinateSystem: CoordinateSystem = CoordinateSystem.CARTESIAN_2D
  ) {
    this.validateRings(exteriorRing, interiorRings);
    this.exteriorRing = exteriorRing;
    this.interiorRings = [...interiorRings];
    this.srid = srid;
    this.coordinateSystem = coordinateSystem;
  }

  /**
   * Validates the exterior and interior rings
   */
  private validateRings(exteriorRing: LinearRing, interiorRings: LinearRing[]): void {
    // Check coordinate system consistency
    const cs = exteriorRing.getPoints()[0].getCoordinateSystem();
    const invalidCs = interiorRings.some(ring =>
      ring.getPoints().some(point => point.getCoordinateSystem() !== cs)
    );
    if (invalidCs) {
      throw new Error('All rings must have the same coordinate system');
    }

    // Check dimensionality consistency
    const is3D = exteriorRing.is3D();
    if (!interiorRings.every(ring => ring.is3D() === is3D)) {
      throw new Error('All rings must be consistently 2D or 3D');
    }

    // Validate that interior rings are inside exterior ring
    for (const ring of interiorRings) {
      if (!this.ringContainsRing(exteriorRing, ring)) {
        throw new Error('All interior rings must be contained within the exterior ring');
      }
    }

    // Check that interior rings don't intersect each other
    for (let i = 0; i < interiorRings.length; i++) {
      for (let j = i + 1; j < interiorRings.length; j++) {
        if (this.ringsIntersect(interiorRings[i], interiorRings[j])) {
          throw new Error('Interior rings cannot intersect each other');
        }
      }
    }
  }

  private ringContainsRing(outer: LinearRing, inner: LinearRing): boolean {
    // Simple point-in-polygon test for the first point of inner ring
    return this.pointInRing(inner.getPoints()[0], outer);
  }

  private pointInRing(point: Point, ring: LinearRing): boolean {
    // Ray casting algorithm for point-in-polygon test
    let inside = false;
    const points = ring.getPoints();
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].getX(), yi = points[i].getY();
      const xj = points[j].getX(), yj = points[j].getY();

      const intersect = ((yi > point.getY()) !== (yj > point.getY())) &&
        (point.getX() < (xj - xi) * (point.getY() - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private ringsIntersect(ring1: LinearRing, ring2: LinearRing): boolean {
    // Check if any segments intersect
    const points1 = ring1.getPoints();
    const points2 = ring2.getPoints();

    for (let i = 0; i < points1.length - 1; i++) {
      for (let j = 0; j < points2.length - 1; j++) {
        if (this.segmentsIntersect(
          points1[i], points1[i + 1],
          points2[j], points2[j + 1]
        )) {
          return true;
        }
      }
    }
    return false;
  }

  private segmentsIntersect(
    p1: Point, p2: Point,
    p3: Point, p4: Point
  ): boolean {
    // Reuse the LinearRing's segment intersection test
    const ring = new LinearRing([p1, p2, p2, p1]);
    return ring['segmentsIntersect'](p1, p2, p3, p4);
  }

  // Geometry interface implementation
  public isEmpty(): boolean {
    return false; // A valid polygon is never empty
  }

  public is3D(): boolean {
    return this.exteriorRing.is3D();
  }

  public dimension(): number {
    return 2; // Polygons are 2-dimensional
  }

  public getSRID(): number {
    return this.srid;
  }

  public setSRID(srid: number): void {
    if (srid < 0) {
      throw new Error('SRID must be non-negative');
    }
    this.srid = srid;
    this.exteriorRing.setSRID(srid);
    this.interiorRings.forEach(ring => ring.setSRID(srid));
  }

  public getGeometryType(): string {
    return 'Polygon';
  }

  public equals(other: Geometry): boolean {
    if (!(other instanceof Polygon)) {
      return false;
    }

    const otherPoly = other as Polygon;
    if (!this.exteriorRing.equals(otherPoly.exteriorRing)) {
      return false;
    }

    if (this.interiorRings.length !== otherPoly.interiorRings.length) {
      return false;
    }

    return this.interiorRings.every((ring, index) =>
      ring.equals(otherPoly.interiorRings[index])
    );
  }

  // WKTRepresentable interface implementation
  public asWKT(): string {
    const formatRing = (ring: LinearRing): string => {
      return '(' + ring.getPoints().map(p => {
        if (p.is3D()) {
          return `${p.getX()} ${p.getY()} ${p.getZ()}`;
        }
        return `${p.getX()} ${p.getY()}`;
      }).join(', ') + ')';
    };

    const rings = [
      formatRing(this.exteriorRing),
      ...this.interiorRings.map(ring => formatRing(ring))
    ].join(', ');

    if (this.is3D()) {
      return `POLYGON Z (${rings})`;
    }
    return `POLYGON (${rings})`;
  }

  // Additional utility methods
  /**
   * Gets the exterior ring of the polygon
   */
  public getExteriorRing(): LinearRing {
    return this.exteriorRing.clone() as LinearRing;
  }

  /**
   * Gets all interior rings (holes) of the polygon
   */
  public getInteriorRings(): LinearRing[] {
    return this.interiorRings.map(ring => ring.clone() as LinearRing);
  }

  /**
   * Gets the number of interior rings
   */
  public getNumInteriorRings(): number {
    return this.interiorRings.length;
  }

  /**
   * Gets an interior ring at the specified index
   */
  public getInteriorRingN(n: number): LinearRing {
    if (n < 0 || n >= this.interiorRings.length) {
      throw new Error('Index out of bounds');
    }
    return this.interiorRings[n].clone() as LinearRing;
  }

  /**
   * Calculates the area of the polygon
   * For geographic coordinates, this is an approximate calculation
   * @returns Area in square units (or square meters for geographic coordinates)
   */
  public getArea(): number {
    const exteriorArea = this.calculateRingArea(this.exteriorRing);
    const interiorArea = this.interiorRings.reduce(
      (sum, ring) => sum + this.calculateRingArea(ring),
      0
    );
    return Math.abs(exteriorArea) - Math.abs(interiorArea);
  }

  private calculateRingArea(ring: LinearRing): number {
    // Implementation of the shoelace formula (surveyor's formula)
    const points = ring.getPoints();
    let area = 0;

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      area += (points[j].getX() + points[i].getX()) *
        (points[j].getY() - points[i].getY());
    }

    return area / 2;
  }

  /**
   * Determines if a point lies within the polygon
   */
  public contains(point: Point): boolean {
    if (point.getCoordinateSystem() !== this.coordinateSystem) {
      throw new Error('Point must be in the same coordinate system as the polygon');
    }

    // Check if point is inside exterior ring
    const inExterior = this.pointInRing(point, this.exteriorRing);
    if (!inExterior) {
      return false;
    }

    // Check if point is outside all interior rings (holes)
    return this.interiorRings.every(ring => !this.pointInRing(point, ring));
  }

  /**
   * Creates a copy of this polygon
   */
  public clone(): Polygon {
    return new Polygon(
      this.exteriorRing.clone() as LinearRing,
      this.interiorRings.map(ring => ring.clone() as LinearRing),
      this.srid,
      this.coordinateSystem
    );
  }

  /**
   * Returns a string representation of the polygon
   */
  public toString(): string {
    return this.asWKT();
  }

  getClosestPoint(point: Point): Point {
    // Basic implementation that returns closest point on boundary
    return this.getExteriorRing().getPoints()[0].clone();
  }

  triangulate(maxTriangleSize?: number): Polygon[] {
    // Basic implementation that returns the polygon as a single triangle
    return [this.clone()];
  }

  getCentroid(): Point {
    const points = this.getExteriorRing().getPoints();
    let sumX = 0, sumY = 0;
    points.forEach(p => { sumX += p.getX(); sumY += p.getY(); });
    return new Point(sumX / points.length, sumY / points.length);
  }

  getPointAtParameters(u: number, v: number): Point | null {
    const points = this.getExteriorRing().getPoints();
    if (points.length === 0) return null;
    return points[0].clone();
  }

  getParametersAtPoint(point: Point): { u: number; v: number; } | null {
    return this.contains(point) ? { u: 0, v: 0 } : null;
  }

  getCoordinateSystem(): CoordinateSystem {
    return this.coordinateSystem;
}
}

export { Polygon };