import { Point, Geometry, CoordinateSystem } from '../base/Point';
import { GeometryCollection } from './GeometryCollection';

/**
 * Implementation of MultiPoint geometry
 * Represents a collection of points
 */
class MultiPoint implements Geometry {
  private readonly points: Point[];
  private srid: number;
  private readonly coordinateSystem: CoordinateSystem;

  /**
   * Creates a new MultiPoint
   * @param points Array of points
   * @param srid Spatial Reference System Identifier
   * @param coordinateSystem Coordinate system type
   */
  constructor(
    points: Point[],
    srid: number = 0,
    coordinateSystem: CoordinateSystem = CoordinateSystem.CARTESIAN_2D
  ) {
    this.validatePoints(points);
    this.points = points.map(p => p.clone());
    this.srid = srid;
    this.coordinateSystem = coordinateSystem;
  }

  private validatePoints(points: Point[]): void {
    // Check coordinate system consistency
    if (points.length > 0) {
      const firstCs = points[0].getCoordinateSystem();
      if (!points.every(p => p.getCoordinateSystem() === firstCs)) {
        throw new Error('All points must have the same coordinate system');
      }

      // Check dimensionality consistency
      const firstIs3D = points[0].is3D();
      if (!points.every(p => p.is3D() === firstIs3D)) {
        throw new Error('All points must be consistently 2D or 3D');
      }

      // Check measure consistency
      const firstHasM = 'getM' in points[0] && points[0].getM() !== undefined;
      if (!points.every(p => {
        const hasM = 'getM' in p && p.getM() !== undefined;
        return hasM === firstHasM;
      })) {
        throw new Error('All points must consistently have or not have measures');
      }
    }
  }

  // Geometry interface implementation
  public isEmpty(): boolean {
    return this.points.length === 0;
  }

  public is3D(): boolean {
    return this.points.length > 0 && this.points[0].is3D();
  }

  public hasM(): boolean {
    return this.points.length > 0 && 'getM' in this.points[0] && 
           this.points[0].getM() !== undefined;
  }

  public dimension(): number {
    return 0; // MultiPoint is 0-dimensional
  }

  public getSRID(): number {
    return this.srid;
  }

  public setSRID(srid: number): void {
    if (srid < 0) {
      throw new Error('SRID must be non-negative');
    }
    this.srid = srid;
    this.points.forEach(p => p.setSRID(srid));
  }

  public getGeometryType(): string {
    let type = 'MultiPoint';
    if (this.is3D() && this.hasM()) {
      type += ' ZM';
    } else if (this.is3D()) {
      type += ' Z';
    } else if (this.hasM()) {
      type += ' M';
    }
    return type;
  }

  public equals(other: Geometry): boolean {
    if (!(other instanceof MultiPoint)) {
      return false;
    }

    if (this.points.length !== other.points.length) {
      return false;
    }

    // Check if all points match (order-independent)
    const otherPoints = [...other.points];
    return this.points.every(point => {
      const index = otherPoints.findIndex(p => p.equals(point));
      if (index === -1) return false;
      otherPoints.splice(index, 1);
      return true;
    });
  }

  // MultiPoint-specific methods
  /**
   * Gets all points in the collection
   */
  public getPoints(): Point[] {
    return this.points.map(p => p.clone());
  }

  /**
   * Gets the number of points
   */
  public getNumPoints(): number {
    return this.points.length;
  }

  /**
   * Gets a point at a specific index
   */
  public getPointN(n: number): Point {
    if (n < 0 || n >= this.points.length) {
      throw new Error('Index out of bounds');
    }
    return this.points[n].clone();
  }

  /**
   * Gets the coordinate system type
   */
  public getCoordinateSystem(): CoordinateSystem {
    return this.coordinateSystem;
  }

  /**
   * Adds a point to the collection
   */
  public addPoint(point: Point): MultiPoint {
    const newPoints = [...this.points, point];
    return new MultiPoint(newPoints, this.srid, this.coordinateSystem);
  }

  /**
   * Removes a point from the collection
   */
  public removePoint(point: Point): MultiPoint {
    const index = this.points.findIndex(p => p.equals(point));
    if (index === -1) {
      return this;
    }
    const newPoints = [...this.points];
    newPoints.splice(index, 1);
    return new MultiPoint(newPoints, this.srid, this.coordinateSystem);
  }

  /**
   * Gets the bounding box of all points
   */
  public getBoundingBox(): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    minZ?: number;
    maxZ?: number;
  } {
    if (this.isEmpty()) {
      throw new Error('Cannot compute bounding box of empty MultiPoint');
    }

    const bbox = {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
      minZ: this.is3D() ? Infinity : undefined,
      maxZ: this.is3D() ? -Infinity : undefined
    };

    this.points.forEach(point => {
      bbox.minX = Math.min(bbox.minX, point.getX());
      bbox.minY = Math.min(bbox.minY, point.getY());
      bbox.maxX = Math.max(bbox.maxX, point.getX());
      bbox.maxY = Math.max(bbox.maxY, point.getY());

      if (this.is3D()) {
        const z = point.getZ()!;
        bbox.minZ = Math.min(bbox.minZ!, z);
        bbox.maxZ = Math.max(bbox.maxZ!, z);
      }
    });

    return bbox;
  }

  /**
   * Gets the centroid of all points
   */
  public getCentroid(): Point {
    if (this.isEmpty()) {
      throw new Error('Cannot compute centroid of empty MultiPoint');
    }

    const n = this.points.length;
    let sumX = 0, sumY = 0, sumZ = 0;
    let hasZ = this.is3D();
    let hasM = this.hasM();
    let sumM = 0;

    this.points.forEach(point => {
      sumX += point.getX();
      sumY += point.getY();
      if (hasZ) {
        sumZ += point.getZ()!;
      }
      if (hasM) {
        sumM += point.getM()!;
      }
    });

    if (hasZ && hasM) {
      return new Point(sumX / n, sumY / n, sumZ / n, sumM / n);
    } else if (hasZ) {
      return new Point(sumX / n, sumY / n, sumZ / n);
    } else if (hasM) {
      return new Point(sumX / n, sumY / n, undefined, sumM / n);
    }
    return new Point(sumX / n, sumY / n);
  }

  /**
   * Finds all points within a given radius of a point
   */
  public getPointsWithinDistance(center: Point, radius: number): Point[] {
    return this.points.filter(p => p.distanceTo(center) <= radius)
                     .map(p => p.clone());
  }

  /**
   * Converts to Well-Known Text (WKT) format
   */
  public asWKT(): string {
    if (this.isEmpty()) {
      return 'MULTIPOINT EMPTY';
    }

    const pointStrings = this.points.map(point => {
      const coords = [point.getX(), point.getY()];
      if (this.is3D()) {
        coords.push(point.getZ()!);
      }
      if (this.hasM()) {
        coords.push(point.getM()!);
      }
      return `(${coords.join(' ')})`;
    });

    return `${this.getGeometryType()}(${pointStrings.join(', ')})`;
  }

  /**
   * Creates a deep copy of this MultiPoint
   */
  public clone(): MultiPoint {
    return new MultiPoint(this.points, this.srid, this.coordinateSystem);
  }

  /**
   * Converts to a GeometryCollection
   */
  public toGeometryCollection(): GeometryCollection {
    return new GeometryCollection(this.points);
  }

  /**
   * Returns string representation
   */
  public toString(): string {
    return this.asWKT();
  }
}

export { MultiPoint };