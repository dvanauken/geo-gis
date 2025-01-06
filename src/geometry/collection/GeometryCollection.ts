import { CoordinateSystem } from "../base/CoordinateSystem";
import { Geometry } from "../base/Geometry";
import { Point } from "../base/Point";
import { Polygon } from "../primitive/Polygon";
import { Polyline } from "../primitive/Polyline";
import { MultiPolygon } from "./MultiPolygon";
import { MultiPolyline } from "./MultiPolyline";

/**
 * Implementation of OpenGIS GeometryCollection
 * Represents a collection of arbitrary geometry objects
 */
class GeometryCollection implements Geometry {
  private readonly geometries: Geometry[];
  private srid: number;
  private readonly coordinateSystem: CoordinateSystem;

  /**
   * Creates a new GeometryCollection
   * @param geometries - Array of geometry objects
   * @param srid - Spatial Reference System Identifier
   * @param coordinateSystem - Coordinate system type
   * @throws Error if geometries have different coordinate systems
   */
  constructor(
    geometries: Geometry[],
    srid: number = 0,
    coordinateSystem: CoordinateSystem = CoordinateSystem.CARTESIAN_2D
  ) {
    this.validateGeometries(geometries);
    this.geometries = [...geometries]; // Create defensive copy
    this.srid = srid;
    this.coordinateSystem = coordinateSystem;
  }

  /**
   * Validates the input geometries array
   */
  private validateGeometries(geometries: Geometry[]): void {
    if (!Array.isArray(geometries)) {
      throw new Error('Geometries must be provided as an array');
    }

    if (geometries.length === 0) {
      return; // Empty collection is valid
    }

    // Helper function to get coordinate system of any geometry
    const getGeometryCs = (geom: Geometry): CoordinateSystem => {
      if (geom instanceof Point) {
        return geom.getCoordinateSystem();
      } else if (geom instanceof Polyline || geom instanceof Polygon ||
        geom instanceof MultiPolyline || geom instanceof MultiPolygon) {
        return geom.getCoordinateSystem();
      } else if (geom instanceof GeometryCollection) {
        return geom.getCoordinateSystem();
      }
      throw new Error('Unknown geometry type');
    };

    // Check coordinate system consistency
    const firstCs = getGeometryCs(geometries[0]);
    const invalidCs = geometries.some(geom => getGeometryCs(geom) !== firstCs);
    if (invalidCs) {
      throw new Error('All geometries must have the same coordinate system');
    }

    // Check dimensionality consistency
    const firstIs3D = geometries[0].is3D();
    if (!geometries.every(geom => geom.is3D() === firstIs3D)) {
      throw new Error('All geometries must be consistently 2D or 3D');
    }
  }

  // Geometry interface implementation
  public isEmpty(): boolean {
    return this.geometries.length === 0;
  }

  public is3D(): boolean {
    return this.geometries.length > 0 && this.geometries[0].is3D();
  }

  public dimension(): number {
    if (this.isEmpty()) {
      return 0;
    }
    // Return the highest dimension of contained geometries
    return Math.max(...this.geometries.map(geom => geom.dimension()));
  }

  public getSRID(): number {
    return this.srid;
  }

  public setSRID(srid: number): void {
    if (srid < 0) {
      throw new Error('SRID must be non-negative');
    }
    this.srid = srid;
    // Update SRID for all contained geometries
    this.geometries.forEach(geom => geom.setSRID(srid));
  }

  public getGeometryType(): string {
    return 'GeometryCollection';
  }

  public equals(other: Geometry): boolean {
    if (!(other instanceof GeometryCollection)) {
      return false;
    }

    const otherCollection = other as GeometryCollection;
    if (this.geometries.length !== otherCollection.geometries.length) {
      return false;
    }

    // Check if all geometries match (order matters)
    return this.geometries.every((geom, index) =>
      geom.equals(otherCollection.geometries[index])
    );
  }

  // WKTRepresentable interface implementation
  public asWKT(): string {
    if (this.isEmpty()) {
      return 'GEOMETRYCOLLECTION EMPTY';
    }

    const geomStrings = this.geometries.map(geom => {
      // For nested collections, we need the full WKT
      if (geom instanceof GeometryCollection) {
        return geom.asWKT();
      }
      // For other geometries, we keep their full WKT
      return geom.asWKT();
    }).join(', ');

    if (this.is3D()) {
      return `GEOMETRYCOLLECTION Z (${geomStrings})`;
    }
    return `GEOMETRYCOLLECTION (${geomStrings})`;
  }

  // Additional utility methods
  /**
   * Gets all geometries in the collection
   */
  public getGeometries(): Geometry[] {
    return [...this.geometries]; // Return defensive copy
  }

  /**
   * Gets the number of geometries in the collection
   */
  public getNumGeometries(): number {
    return this.geometries.length;
  }

  /**
   * Gets the geometry at the specified index
   */
  public getGeometryN(n: number): Geometry {
    if (n < 0 || n >= this.geometries.length) {
      throw new Error('Index out of bounds');
    }
    // Clone the geometry - each geometry type implements its own clone method
    if (this.geometries[n] instanceof Point) {
      return (this.geometries[n] as Point).clone();
    } else if (this.geometries[n] instanceof Polyline) {
      return (this.geometries[n] as Polyline).clone();
    } else if (this.geometries[n] instanceof Polygon) {
      return (this.geometries[n] as Polygon).clone();
    } else if (this.geometries[n] instanceof MultiPolyline) {
      return (this.geometries[n] as MultiPolyline).clone();
    } else if (this.geometries[n] instanceof MultiPolygon) {
      return (this.geometries[n] as MultiPolygon).clone();
    } else if (this.geometries[n] instanceof GeometryCollection) {
      return (this.geometries[n] as GeometryCollection).clone();
    }
    throw new Error('Unknown geometry type');
  }

  /**
   * Gets the coordinate system type
   */
  public getCoordinateSystem(): CoordinateSystem {
    return this.coordinateSystem;
  }

  /**
   * Gets all geometries of a specific type
   * @param type - The geometry type to filter by
   */
  public getGeometriesByType<T extends Geometry>(type: new (...args: any[]) => T): T[] {
    return this.geometries
      .filter(geom => geom instanceof type)
      .map(geom => (geom as T).clone() as T);
  }

  /**
   * Flattens nested geometry collections into a single collection
   * @returns A new GeometryCollection with no nested collections
   */
  public flatten(): GeometryCollection {
    const flattenedGeometries: Geometry[] = [];

    const flatten = (geom: Geometry) => {
      if (geom instanceof GeometryCollection) {
        geom.getGeometries().forEach(g => flatten(g));
      } else {
        flattenedGeometries.push(geom.clone());
      }
    };

    this.geometries.forEach(geom => flatten(geom));

    return new GeometryCollection(
      flattenedGeometries,
      this.srid,
      this.coordinateSystem
    );
  }

  /**
   * Creates a copy of this GeometryCollection
   */
  public clone(): GeometryCollection {
    return new GeometryCollection(
      this.geometries.map(geom => {
        if (geom instanceof Point) {
          return geom.clone();
        } else if (geom instanceof Polyline) {
          return geom.clone();
        } else if (geom instanceof Polygon) {
          return geom.clone();
        } else if (geom instanceof MultiPolyline) {
          return geom.clone();
        } else if (geom instanceof MultiPolygon) {
          return geom.clone();
        } else if (geom instanceof GeometryCollection) {
          return geom.clone();
        }
        throw new Error('Unknown geometry type');
      }),
      this.srid,
      this.coordinateSystem
    );
  }

  /**
   * Returns a string representation of the geometry collection
   */
  public toString(): string {
    return this.asWKT();
  }

  /**
   * Gets all points from all geometries in the collection
   */
  public getAllPoints(): Point[] {
    const points: Point[] = [];

    const collectPoints = (geom: Geometry) => {
      if (geom instanceof Point) {
        points.push(geom.clone());
      } else if (geom instanceof Polyline) {
        points.push(...geom.getPoints());
      } else if (geom instanceof Polygon) {
        points.push(...geom.getExteriorRing().getPoints());
        geom.getInteriorRings().forEach(ring =>
          points.push(...ring.getPoints())
        );
      } else if (geom instanceof MultiPolyline) {
        points.push(...geom.getAllPoints());
      } else if (geom instanceof MultiPolygon) {
        geom.getPolygons().forEach(poly => {
          points.push(...poly.getExteriorRing().getPoints());
          poly.getInteriorRings().forEach(ring =>
            points.push(...ring.getPoints())
          );
        });
      } else if (geom instanceof GeometryCollection) {
        geom.getGeometries().forEach(g => collectPoints(g));
      }
    };

    this.geometries.forEach(geom => collectPoints(geom));
    return points;
  }

  public contains(point: Point): boolean {
    // Check if point lies on any line segment
    const points = this.getAllPoints();
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      // Vector from p1 to p2
      const dx = p2.getX() - p1.getX();
      const dy = p2.getY() - p1.getY();
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length === 0) {
        // If segment is degenerate, check if point equals p1
        if (point.equals(p1)) return true;
        continue;
      }

      // Parameter along the line segment
      const t = ((point.getX() - p1.getX()) * dx + (point.getY() - p1.getY()) * dy) / (length * length);

      // Point must lie between start and end of segment (0 <= t <= 1)
      if (t < 0 || t > 1) continue;

      // Calculate projection point
      const projX = p1.getX() + t * dx;
      const projY = p1.getY() + t * dy;

      // Check if point is close enough to projection (allowing for small numerical errors)
      const EPSILON = 1e-10;
      if (Math.abs(point.getX() - projX) < EPSILON &&
        Math.abs(point.getY() - projY) < EPSILON) {
        return true;
      }
    }
    return false;
  }



}

export { GeometryCollection };