import { Geometry, Point } from "../../base/Point";
import { GeometryCollection } from "../../collection/GeometryCollection";
import { MultiPolyline } from "../../collection/LinearRing";
import { MultiPolygon } from "../../collection/MultiPolygon";
import { LinearRing } from "../../primitive/LinearRing";
import { Polygon } from "../../primitive/Polygon";
import { Polyline } from "../../primitive/Polyline";

/**
 * Abstract base class for unary geometric operations
 */
abstract class UnaryOperation {
  protected geometry: Geometry;

  constructor(geometry: Geometry) {
    this.geometry = geometry;
  }

  abstract execute(): Geometry;
}

/**
 * Computes the envelope (bounding box) of a geometry
 */
class EnvelopeOperation extends UnaryOperation {
  execute(): Polygon {
    const points = this.getAllPoints();
    if (points.length === 0) {
      throw new Error('Cannot compute envelope of empty geometry');
    }

    // Find min/max coordinates
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let is3D = points[0].is3D();
    let minZ = is3D ? Infinity : null;
    let maxZ = is3D ? -Infinity : null;

    points.forEach(point => {
      minX = Math.min(minX, point.getX());
      minY = Math.min(minY, point.getY());
      maxX = Math.max(maxX, point.getX());
      maxY = Math.max(maxY, point.getY());
      if (is3D && point.getZ() !== null) {
        minZ = Math.min(minZ!, point.getZ()!);
        maxZ = Math.max(maxZ!, point.getZ()!);
      }
    });

    // Create envelope polygon
    const envelopePoints = [
      new Point(minX, minY, is3D ? minZ : null),
      new Point(maxX, minY, is3D ? minZ : null),
      new Point(maxX, maxY, is3D ? maxZ : null),
      new Point(minX, maxY, is3D ? maxZ : null),
      new Point(minX, minY, is3D ? minZ : null) // Close the ring
    ];

    const ring = new LinearRing(envelopePoints);
    return new Polygon(ring);
  }

  private getAllPoints(): Point[] {
    if (this.geometry instanceof GeometryCollection) {
      return this.geometry.getAllPoints();
    } else if (this.geometry instanceof Point) {
      return [this.geometry];
    } else if (this.geometry instanceof Polyline) {
      return this.geometry.getPoints();
    } else if (this.geometry instanceof Polygon) {
      return [
        ...this.geometry.getExteriorRing().getPoints(),
        ...this.geometry.getInteriorRings().flatMap(ring => ring.getPoints())
      ];
    } else if (this.geometry instanceof MultiPolyline) {
      return this.geometry.getAllPoints();
    } else if (this.geometry instanceof MultiPolygon) {
      return this.geometry.getPolygons().flatMap(poly => [
        ...poly.getExteriorRing().getPoints(),
        ...poly.getInteriorRings().flatMap(ring => ring.getPoints())
      ]);
    }
    throw new Error('Unsupported geometry type');
  }
}

/**
 * Computes the boundary of a geometry
 */
class BoundaryOperation extends UnaryOperation {
  execute(): Geometry {
    if (this.geometry instanceof Point) {
      // A point's boundary is empty
      return new GeometryCollection([]);
    } else if (this.geometry instanceof Polyline) {
      return this.getPolylineBoundary();
    } else if (this.geometry instanceof Polygon) {
      return this.getPolygonBoundary();
    } else if (this.geometry instanceof MultiPolyline) {
      return this.getMultiPolylineBoundary();
    } else if (this.geometry instanceof MultiPolygon) {
      return this.getMultiPolygonBoundary();
    } else if (this.geometry instanceof GeometryCollection) {
      return this.getCollectionBoundary();
    }
    throw new Error('Unsupported geometry type');
  }

  private getPolylineBoundary(): Geometry {
    const points = this.geometry as Polyline;
    if (points.isClosed()) {
      // Closed polylines have no boundary
      return new GeometryCollection([]);
    }
    // Return start and end points
    return new GeometryCollection([
      points.getPointN(0),
      points.getPointN(points.getNumPoints() - 1)
    ]);
  }

  private getPolygonBoundary(): Geometry {
    const poly = this.geometry as Polygon;
    const rings = [
      poly.getExteriorRing(),
      ...poly.getInteriorRings()
    ];
    return new MultiPolyline(rings);
  }

  private getMultiPolylineBoundary(): Geometry {
    const multiLine = this.geometry as MultiPolyline;
    const boundaries: Point[] = [];
    
    multiLine.getPolylines().forEach(line => {
      if (!line.isClosed()) {
        boundaries.push(line.getPointN(0));
        boundaries.push(line.getPointN(line.getNumPoints() - 1));
      }
    });
    
    return new GeometryCollection(boundaries);
  }

  private getMultiPolygonBoundary(): Geometry {
    const multiPoly = this.geometry as MultiPolygon;
    const boundaries = multiPoly.getPolygons().map(poly => {
      const rings = [
        poly.getExteriorRing(),
        ...poly.getInteriorRings()
      ];
      return new MultiPolyline(rings);
    });
    
    return new GeometryCollection(boundaries);
  }

  private getCollectionBoundary(): Geometry {
    const collection = this.geometry as GeometryCollection;
    const boundaries = collection.getGeometries().map(geom => 
      new BoundaryOperation(geom).execute()
    );
    return new GeometryCollection(boundaries);
  }
}

/**
 * Computes the convex hull of a geometry
 */
class ConvexHullOperation extends UnaryOperation {
  execute(): Polygon {
    const points = this.getAllPoints();
    if (points.length <= 3) {
      return this.createSimplePolygon(points);
    }

    // Graham Scan algorithm for convex hull
    const hull = this.grahamScan(points);
    return new Polygon(new LinearRing(hull));
  }

  private getAllPoints(): Point[] {
    if (this.geometry instanceof GeometryCollection) {
      return this.geometry.getAllPoints();
    } else if (this.geometry instanceof Point) {
      return [this.geometry];
    } else if (this.geometry instanceof Polyline) {
      return this.geometry.getPoints();
    } else if (this.geometry instanceof Polygon) {
      return [
        ...this.geometry.getExteriorRing().getPoints(),
        ...this.geometry.getInteriorRings().flatMap(ring => ring.getPoints())
      ];
    } else if (this.geometry instanceof MultiPolyline) {
      return this.geometry.getAllPoints();
    } else if (this.geometry instanceof MultiPolygon) {
      return this.geometry.getPolygons().flatMap(poly => [
        ...poly.getExteriorRing().getPoints(),
        ...poly.getInteriorRings().flatMap(ring => ring.getPoints())
      ]);
    }
    throw new Error('Unsupported geometry type');
  }

  private createSimplePolygon(points: Point[]): Polygon {
    if (points.length === 0) {
      throw new Error('Cannot create convex hull from empty point set');
    }
    if (points.length === 1) {
      // Create a tiny square around the point
      const p = points[0];
      const epsilon = 1e-10;
      const ring = new LinearRing([
        new Point(p.getX() - epsilon, p.getY() - epsilon),
        new Point(p.getX() + epsilon, p.getY() - epsilon),
        new Point(p.getX() + epsilon, p.getY() + epsilon),
        new Point(p.getX() - epsilon, p.getY() + epsilon),
        new Point(p.getX() - epsilon, p.getY() - epsilon)
      ]);
      return new Polygon(ring);
    }
    if (points.length === 2) {
      // Create a very thin rectangle
      const p1 = points[0];
      const p2 = points[1];
      const epsilon = 1e-10;
      const dx = p2.getX() - p1.getX();
      const dy = p2.getY() - p1.getY();
      const length = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / length * epsilon;
      const ny = dx / length * epsilon;
      
      const ring = new LinearRing([
        new Point(p1.getX() + nx, p1.getY() + ny),
        new Point(p2.getX() + nx, p2.getY() + ny),
        new Point(p2.getX() - nx, p2.getY() - ny),
        new Point(p1.getX() - nx, p1.getY() - ny),
        new Point(p1.getX() + nx, p1.getY() + ny)
      ]);
      return new Polygon(ring);
    }
    // For 3 points, create a triangle
    const ring = new LinearRing([...points, points[0]]);
    return new Polygon(ring);
  }

  private grahamScan(points: Point[]): Point[] {
    if (points.length < 3) {
      return points;
    }

    // Find point with lowest y-coordinate (and leftmost if tied)
    let bottomPoint = points[0];
    for (const point of points) {
      if (point.getY() < bottomPoint.getY() ||
         (point.getY() === bottomPoint.getY() && point.getX() < bottomPoint.getX())) {
        bottomPoint = point;
      }
    }

    // Sort points by polar angle with respect to bottom point
    const sortedPoints = points
      .filter(p => p !== bottomPoint)
      .sort((a, b) => {
        const angleA = Math.atan2(a.getY() - bottomPoint.getY(), a.getX() - bottomPoint.getX());
        const angleB = Math.atan2(b.getY() - bottomPoint.getY(), b.getX() - bottomPoint.getX());
        if (angleA < angleB) return -1;
        if (angleA > angleB) return 1;
        // If angles are equal, take the point that's further
        const distA = (a.getX() - bottomPoint.getX()) ** 2 + (a.getY() - bottomPoint.getY()) ** 2;
        const distB = (b.getX() - bottomPoint.getX()) ** 2 + (b.getY() - bottomPoint.getY()) ** 2;
        return distB - distA;
      });

    // Graham scan
    const hull: Point[] = [bottomPoint];
    for (const point of sortedPoints) {
      while (hull.length >= 2 && !this.isLeftTurn(
        hull[hull.length - 2],
        hull[hull.length - 1],
        point
      )) {
        hull.pop();
      }
      hull.push(point);
    }

    // Close the hull
    hull.push(hull[0]);
    return hull;
  }

  private isLeftTurn(p1: Point, p2: Point, p3: Point): boolean {
    const cross = (p2.getX() - p1.getX()) * (p3.getY() - p1.getY()) -
                 (p2.getY() - p1.getY()) * (p3.getX() - p1.getX());
    return cross > 0;
  }
}

/**
 * Creates a buffer around a geometry
 */
class BufferOperation extends UnaryOperation {
  private readonly distance: number;
  private readonly segments: number;

  constructor(geometry: Geometry, distance: number, segments: number = 32) {
    super(geometry);
    this.distance = distance;
    this.segments = Math.max(8, segments);
  }

  execute(): Polygon {
    if (this.geometry instanceof Point) {
      return this.createPointBuffer();
    } else if (this.geometry instanceof Polyline) {
      return this.createPolylineBuffer();
    } else if (this.geometry instanceof Polygon) {
      return this.createPolygonBuffer();
    } else if (this.geometry instanceof GeometryCollection ||
               this.geometry instanceof MultiPolyline ||
               this.geometry instanceof MultiPolygon) {
      return this.createCollectionBuffer();
    }
    throw new Error('Unsupported geometry type');
  }

  private createPointBuffer(): Polygon {
    const point = this.geometry as Point;
    const points: Point[] = [];
    
    // Create circle points
    for (let i = 0; i <= this.segments; i++) {
      const angle = (2 * Math.PI * i) / this.segments;
      const x = point.getX() + this.distance * Math.cos(angle);
      const y = point.getY() + this.distance * Math.sin(angle);
      points.push(new Point(x, y));
    }

    return new Polygon(new LinearRing(points));
  }

  private createPolylineBuffer(): Polygon {
    // This is a simplified buffer implementation
    // A full implementation would need to handle:
    // - Line joins (miter, round, bevel)
    // - End caps (round, flat, square)
    // - Self-intersections
    // - Variable buffer distances
    const line = this.geometry as Polyline;
    const points = line.getPoints();
    const bufferPoints: Point[] = [];

    // Create parallel offset lines
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.getX() - p1.getX();
      const dy = p2.getY() - p1.getY();
      const length = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / length * this.distance;
      const ny = dx / length * this.distance;

      if (i === 0) {
        // Add end cap for start point
        for (let j = 0; j <= this.segments / 4; j++) {
          const angle = Math.PI * (1 - j / (this.segments / 4));
          const x = p1.getX() + this.distance * Math.cos(angle + Math.atan2(dy, dx));
          const y = p1.getY() + this.distance * Math.sin(angle + Math.atan2(dy, dx));
          bufferPoints.push(new Point(x, y));
        }
      }

      // Add parallel offset points
      bufferPoints.push(new Point(p1.getX() + nx, p1.getY() + ny));
      bufferPoints.push(new Point(p2.getX() + nx, p2.getY() + ny));

      if (i === points.length - 2) {
        // Add end cap for end point
        for (let j = 0; j <= this.segments / 4; j++) {
          const angle = j * Math.PI / (this.segments / 4);
          const x = p2.getX() + this.distance * Math.cos(angle + Math.atan2(dy, dx));
          const y = p2.getY() + this.distance * Math.sin(angle + Math.atan2(dy, dx));
          bufferPoints.push(new Point(x, y));
        }
      }
    }

    // Add parallel offset points for the other side (in reverse)
    for (let i = points.length - 2; i >= 0; i--) {
      const p1 = points[i + 1];
      const p2 = points[i];
      const dx = p2.getX() - p1.getX();
      const dy = p2.getY() - p1.getY();
      const length = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / length * this.distance;
      const ny = dx / length * this.distance;

      bufferPoints.push(new Point(p1.getX() + nx, p1.getY() + ny));
      bufferPoints.push(new Point(p2.getX() + nx, p2.getY() + ny));
    }

    // Close the buffer polygon
    bufferPoints.push(bufferPoints[0]);

    return new Polygon(new LinearRing(bufferPoints));
  }

  private createPolygonBuffer(): Polygon {
    // This is a simplified buffer implementation
    // A full implementation would need to handle:
    // - Interior rings
    // - Self-intersections
    // - Variable buffer distances
    const poly = this.geometry as Polygon;
    const exteriorRing = poly.getExteriorRing();
    const points = exteriorRing.getPoints();
    const bufferPoints: Point[] = [];

    // Create parallel offset lines with rounded corners
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.getX() - p1.getX();
      const dy = p2.getY() - p1.getY();
      const length = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / length * this.distance;
      const ny = dx / length * this.distance;

      // Add corner rounding if not first point
      if (i > 0) {
        const prev = points[i - 1];
        const dx_prev = p1.getX() - prev.getX();
        const dy_prev = p1.getY() - prev.getY();
        const angle_prev = Math.atan2(dy_prev, dx_prev);
        const angle_curr = Math.atan2(dy, dx);
        
        // Add rounded corner points
        for (let j = 0; j <= this.segments / 4; j++) {
          const angle = angle_prev + (angle_curr - angle_prev) * j / (this.segments / 4);
          const x = p1.getX() + this.distance * Math.cos(angle + Math.PI / 2);
          const y = p1.getY() + this.distance * Math.sin(angle + Math.PI / 2);
          bufferPoints.push(new Point(x, y));
        }
      }

      bufferPoints.push(new Point(p1.getX() + nx, p1.getY() + ny));
      bufferPoints.push(new Point(p2.getX() + nx, p2.getY() + ny));
    }

    // Close the buffer polygon
    bufferPoints.push(bufferPoints[0]);

    return new Polygon(new LinearRing(bufferPoints));
  }

  private createCollectionBuffer(): Polygon {
    // For collections, buffer each geometry and union the results
    // This is a simplified implementation that doesn't handle overlaps
    const buffers: Polygon[] = [];
    
    if (this.geometry instanceof GeometryCollection) {
      this.geometry.getGeometries().forEach(geom => {
        const buffer = new BufferOperation(geom, this.distance, this.segments).execute();
        buffers.push(buffer);
      });
    } else if (this.geometry instanceof MultiPolyline) {
      this.geometry.getPolylines().forEach(line => {
        const buffer = new BufferOperation(line, this.distance, this.segments).execute();
        buffers.push(buffer);
      });
    } else if (this.geometry instanceof MultiPolygon) {
      this.geometry.getPolygons().forEach(poly => {
        const buffer = new BufferOperation(poly, this.distance, this.segments).execute();
        buffers.push(buffer);
      });
    }

    // Merge all buffers into a single polygon
    // Note: This is a simplified merge that doesn't handle overlaps
    const allPoints = buffers.flatMap(buffer => 
      buffer.getExteriorRing().getPoints()
    );

    return new ConvexHullOperation(new GeometryCollection(allPoints)).execute();
  }
}

/**
 * Utility class to provide easy access to all unary operations
 */
class UnaryOperations {
  /**
   * Computes the envelope (bounding box) of a geometry
   */
  static envelope(geometry: Geometry): Polygon {
    return new EnvelopeOperation(geometry).execute();
  }

  /**
   * Computes the boundary of a geometry
   */
  static boundary(geometry: Geometry): Geometry {
    return new BoundaryOperation(geometry).execute();
  }

  /**
   * Computes the convex hull of a geometry
   */
  static convexHull(geometry: Geometry): Polygon {
    return new ConvexHullOperation(geometry).execute();
  }

  /**
   * Creates a buffer around a geometry
   */
  static buffer(geometry: Geometry, distance: number, segments: number = 32): Polygon {
    return new BufferOperation(geometry, distance, segments).execute();
  }
}

export { 
  UnaryOperations,
  UnaryOperation,
  EnvelopeOperation,
  BoundaryOperation,
  ConvexHullOperation,
  BufferOperation
};