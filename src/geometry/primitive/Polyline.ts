import { CoordinateSystem } from "../base/CoordinateSystem";
import { Geometry } from "../base/Geometry";
import { Point } from "../base/Point";

/**
 * Implementation of OpenGIS LineString (Polyline) geometry
 * Represents a sequence of points connected by straight line segments
 */
class Polyline implements Geometry {
  private readonly points: Point[];
  private srid: number;
  private readonly coordinateSystem: CoordinateSystem;

  /**
   * Creates a new Polyline
   * @param points - Array of points forming the line
   * @param srid - Spatial Reference System Identifier (defaults to 0)
   * @param coordinateSystem - Coordinate system type
   * @throws Error if less than 2 points provided or points have different coordinate systems
   */
  constructor(
    points: Point[],
    srid: number = 0,
    coordinateSystem: CoordinateSystem = CoordinateSystem.CARTESIAN_2D
  ) {
    this.validatePoints(points);
    this.points = [...points]; // Create defensive copy
    this.srid = srid;
    this.coordinateSystem = coordinateSystem;
  }

  /**
   * Validates the input points array
   */
  private validatePoints(points: Point[]): void {
    if (!Array.isArray(points)) {
      throw new Error('Points must be provided as an array');
    }
    
    if (points.length < 2) {
      throw new Error('A Polyline must contain at least 2 points');
    }

    // Check that all points have the same coordinate system
    const firstCs = points[0].getCoordinateSystem();
    if (!points.every(p => p.getCoordinateSystem() === firstCs)) {
      throw new Error('All points must have the same coordinate system');
    }

    // Check that all points are either 2D or 3D consistently
    const firstIs3D = points[0].is3D();
    if (!points.every(p => p.is3D() === firstIs3D)) {
      throw new Error('All points must be consistently 2D or 3D');
    }
  }

  // Geometry interface implementation
  public isEmpty(): boolean {
    return this.points.length === 0;
  }

  public is3D(): boolean {
    return this.points.length > 0 && this.points[0].is3D();
  }

  public dimension(): number {
    return 1; // LineStrings are 1-dimensional
  }

  public getSRID(): number {
    return this.srid;
  }

  public setSRID(srid: number): void {
    if (srid < 0) {
      throw new Error('SRID must be non-negative');
    }
    this.srid = srid;
  }

  public getGeometryType(): string {
    return 'LineString';
  }

  public equals(other: Geometry): boolean {
    if (!(other instanceof Polyline)) {
      return false;
    }

    const otherLine = other as Polyline;
    if (this.points.length !== otherLine.points.length) {
      return false;
    }

    return this.points.every((point, index) => 
      point.equals(otherLine.points[index])
    );
  }

  // WKTRepresentable interface implementation
  public asWKT(): string {
    if (this.isEmpty()) {
      return 'LINESTRING EMPTY';
    }

    const coordinates = this.points.map(p => {
      if (p.is3D()) {
        return `${p.getX()} ${p.getY()} ${p.getZ()}`;
      }
      return `${p.getX()} ${p.getY()}`;
    }).join(', ');

    if (this.is3D()) {
      return `LINESTRING Z (${coordinates})`;
    }
    return `LINESTRING (${coordinates})`;
  }

  // Additional utility methods
  /**
   * Gets all points in the polyline
   */
  public getPoints(): Point[] {
    return [...this.points]; // Return defensive copy
  }

  /**
   * Gets the number of points in the polyline
   */
  public getNumPoints(): number {
    return this.points.length;
  }

  /**
   * Gets the point at the specified index
   */
  public getPointN(n: number): Point {
    if (n < 0 || n >= this.points.length) {
      throw new Error('Index out of bounds');
    }
    return this.points[n].clone();
  }

  /**
   * Gets the start point of the polyline
   */
  public getStartPoint(): Point {
    if (this.isEmpty()) {
      throw new Error('Polyline is empty');
    }
    return this.points[0].clone();
  }

  /**
   * Gets the end point of the polyline
   */
  public getEndPoint(): Point {
    if (this.isEmpty()) {
      throw new Error('Polyline is empty');
    }
    return this.points[this.points.length - 1].clone();
  }

  /**
   * Calculates the length of the polyline
   * For Cartesian coordinates, uses Euclidean distance
   * For Geographic coordinates, uses great circle distance
   * @returns Length (in coordinate system units or meters for geographic)
   */
  public getLength(): number {
    if (this.points.length < 2) {
      return 0;
    }

    let length = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];

      if (this.coordinateSystem === CoordinateSystem.GEOGRAPHIC_2D ||
          this.coordinateSystem === CoordinateSystem.GEOGRAPHIC_3D) {
        length += p1.greatCircleDistance(p2);
      } else {
        length += p1.distanceTo(p2);
      }
    }

    return length;
  }

  /**
   * Determines if the polyline is closed
   * A polyline is closed if the first and last points are equal
   */
  public isClosed(): boolean {
    if (this.points.length < 2) {
      return false;
    }
    return this.points[0].equals(this.points[this.points.length - 1]);
  }

  /**
   * Creates a copy of this polyline
   */
  public clone(): Polyline {
    return new Polyline(
      this.points.map(p => p.clone()),
      this.srid,
      this.coordinateSystem
    );
  }

  /**
   * Returns a string representation of the polyline
   */
  public toString(): string {
    return this.asWKT();
  }
}

export { Polyline };