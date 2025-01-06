import { CoordinateSystem } from "../base/CoordinateSystem";
import { Geometry } from "../base/Geometry";
import { Point } from "../base/Point";
import { Polyline } from "../primitive/Polyline";

/**
 * Implementation of OpenGIS MultiLineString (MultiPolyline) geometry
 * Represents a collection of Polylines
 */
class MultiPolyline implements Geometry {
  private readonly polylines: Polyline[];
  private srid: number;
  private readonly coordinateSystem: CoordinateSystem;

  /**
   * Creates a new MultiPolyline
   * @param polylines - Array of Polylines
   * @param srid - Spatial Reference System Identifier (defaults to 0)
   * @param coordinateSystem - Coordinate system type
   * @throws Error if polylines have different coordinate systems or dimensionality
   */
  constructor(
    polylines: Polyline[],
    srid: number = 0,
    coordinateSystem: CoordinateSystem = CoordinateSystem.CARTESIAN_2D
  ) {
    this.validatePolylines(polylines);
    this.polylines = [...polylines]; // Create defensive copy
    this.srid = srid;
    this.coordinateSystem = coordinateSystem;
  }

  /**
   * Validates the input polylines array
   */
  private validatePolylines(polylines: Polyline[]): void {
    if (!Array.isArray(polylines)) {
      throw new Error('Polylines must be provided as an array');
    }

    if (polylines.length === 0) {
      return; // Empty MultiPolyline is valid
    }

    // Check that all polylines have the same coordinate system
    const firstCs = polylines[0].getPoints()[0].getCoordinateSystem();
    const invalidCs = polylines.some(line =>
      line.getPoints().some(point => point.getCoordinateSystem() !== firstCs)
    );
    if (invalidCs) {
      throw new Error('All polylines must have the same coordinate system');
    }

    // Check that all polylines are either 2D or 3D consistently
    const firstIs3D = polylines[0].is3D();
    if (!polylines.every(line => line.is3D() === firstIs3D)) {
      throw new Error('All polylines must be consistently 2D or 3D');
    }
  }

  // Geometry interface implementation
  public isEmpty(): boolean {
    return this.polylines.length === 0;
  }

  public is3D(): boolean {
    return this.polylines.length > 0 && this.polylines[0].is3D();
  }

  public dimension(): number {
    return 1; // MultiLineStrings are 1-dimensional
  }

  public getSRID(): number {
    return this.srid;
  }

  public setSRID(srid: number): void {
    if (srid < 0) {
      throw new Error('SRID must be non-negative');
    }
    this.srid = srid;
    // Update SRID for all contained polylines
    this.polylines.forEach(line => line.setSRID(srid));
  }

  public getGeometryType(): string {
    return 'MultiLineString';
  }

  public equals(other: Geometry): boolean {
    if (!(other instanceof MultiPolyline)) {
      return false;
    }

    const otherMulti = other as MultiPolyline;
    if (this.polylines.length !== otherMulti.polylines.length) {
      return false;
    }

    // Check if all polylines match (order matters)
    return this.polylines.every((line, index) =>
      line.equals(otherMulti.polylines[index])
    );
  }

  // WKTRepresentable interface implementation
  public asWKT(): string {
    if (this.isEmpty()) {
      return 'MULTILINESTRING EMPTY';
    }

    const linestrings = this.polylines.map(line => {
      const coordinates = line.getPoints().map(p => {
        if (p.is3D()) {
          return `${p.getX()} ${p.getY()} ${p.getZ()}`;
        }
        return `${p.getX()} ${p.getY()}`;
      }).join(', ');
      return `(${coordinates})`;
    }).join(', ');

    if (this.is3D()) {
      return `MULTILINESTRING Z (${linestrings})`;
    }
    return `MULTILINESTRING (${linestrings})`;
  }

  // Additional utility methods
  /**
   * Gets all polylines in the collection
   */
  public getPolylines(): Polyline[] {
    return [...this.polylines]; // Return defensive copy
  }

  /**
   * Gets the number of polylines in the collection
   */
  public getNumGeometries(): number {
    return this.polylines.length;
  }

  /**
   * Gets the polyline at the specified index
   */
  public getGeometryN(n: number): Polyline {
    if (n < 0 || n >= this.polylines.length) {
      throw new Error('Index out of bounds');
    }
    return this.polylines[n].clone();
  }

  /**
   * Gets the total length of all polylines in the collection
   * For Cartesian coordinates, uses Euclidean distance
   * For Geographic coordinates, uses great circle distance
   * @returns Total length (in coordinate system units or meters for geographic)
   */
  public getTotalLength(): number {
    return this.polylines.reduce((total, line) => total + line.getLength(), 0);
  }

  /**
   * Gets the coordinate system type
   */
  public getCoordinateSystem(): CoordinateSystem {
    return this.coordinateSystem;
  }

  /**
   * Determines if any polylines in the collection are closed
   */
  public hasClosedLines(): boolean {
    return this.polylines.some(line => line.isClosed());
  }

  /**
   * Gets all points from all polylines
   */
  public getAllPoints(): Point[] {
    return this.polylines.flatMap(line => line.getPoints());
  }

  /**
   * Creates a copy of this MultiPolyline
   */
  public clone(): Geometry {
    return new MultiPolyline(
      this.polylines.map(line => line.clone()),
      this.srid,
      this.coordinateSystem
    );
  }

public contains(point: Point): boolean {
  // Point is contained if it lies on any of the constituent polylines
  return this.polylines.some(polyline => polyline.contains(point));
}


  /**
   * Returns a string representation of the MultiPolyline
   */
  public toString(): string {
    return this.asWKT();
  }

  /**
   * Merges polylines that share endpoints
   * @returns A new MultiPolyline with connected polylines merged
   */
  /**
   * Merges polylines that share endpoints
   * @returns A new MultiPolyline with connected polylines merged
   */
  public mergeConnected(): MultiPolyline {
    if (this.polylines.length < 2) {
      return this.clone() as MultiPolyline; // Cast required since clone() returns Geometry
    }

    const merged: Polyline[] = [];
    const remaining = [...this.polylines];

    while (remaining.length > 0) {
      let current = remaining.pop()!;
      let merged_any = true;

      while (merged_any) {
        merged_any = false;
        for (let i = remaining.length - 1; i >= 0; i--) {
          const other = remaining[i];
          const curr_start = current.getStartPoint();
          const curr_end = current.getEndPoint();
          const other_start = other.getStartPoint();
          const other_end = other.getEndPoint();

          if (curr_end.equals(other_start)) {
            // Connect end-to-start
            const points = [...current.getPoints(), ...other.getPoints().slice(1)];
            current = new Polyline(points, this.srid, this.coordinateSystem);
            remaining.splice(i, 1);
            merged_any = true;
          } else if (curr_start.equals(other_end)) {
            // Connect start-to-end
            const points = [...other.getPoints(), ...current.getPoints().slice(1)];
            current = new Polyline(points, this.srid, this.coordinateSystem);
            remaining.splice(i, 1);
            merged_any = true;
          }
        }
      }
      merged.push(current);
    }

    return new MultiPolyline(merged, this.srid, this.coordinateSystem);
  }

}

export { MultiPolyline };