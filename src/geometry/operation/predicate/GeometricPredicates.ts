import { Point, Geometry, CoordinateSystem } from '../../base/Point';
import { GeometryCollection } from '../../collection/GeometryCollection';
import { Polygon } from '../../primitive/Polygon';
import { Polyline } from '../../primitive/Polyline';

/**
 * Abstract base class for geometric predicates
 */
abstract class GeometricPredicate {
  protected geometry1: Geometry;
  protected geometry2: Geometry;
  protected readonly EPSILON = 1e-10; // Tolerance for floating-point comparisons

  constructor(geometry1: Geometry, geometry2: Geometry) {
    this.validateGeometries(geometry1, geometry2);
    this.geometry1 = geometry1;
    this.geometry2 = geometry2;
  }

  protected validateGeometries(geometry1: Geometry, geometry2: Geometry): void {
    if (geometry1.getCoordinateSystem() !== geometry2.getCoordinateSystem()) {
      throw new Error('Geometries must have the same coordinate system');
    }
    if (geometry1.is3D() !== geometry2.is3D()) {
      throw new Error('Geometries must have the same dimensionality');
    }
  }

  abstract evaluate(): boolean;
}

/**
 * Tests if two geometries intersect
 */
class IntersectsPredicate extends GeometricPredicate {
  evaluate(): boolean {
    if (this.geometry1 instanceof Point) {
      return this.pointIntersects(this.geometry1);
    } else if (this.geometry1 instanceof Polyline) {
      return this.polylineIntersects(this.geometry1);
    } else if (this.geometry1 instanceof Polygon) {
      return this.polygonIntersects(this.geometry1);
    } else if (this.geometry1 instanceof GeometryCollection) {
      return this.collectionIntersects(this.geometry1);
    }
    throw new Error('Unsupported geometry type');
  }

  private pointIntersects(point: Point): boolean {
    if (this.geometry2 instanceof Point) {
      return point.equals(this.geometry2);
    } else if (this.geometry2 instanceof Polyline) {
      return this.pointIntersectsPolyline(point, this.geometry2);
    } else if (this.geometry2 instanceof Polygon) {
      return this.geometry2.contains(point);
    } else if (this.geometry2 instanceof GeometryCollection) {
      return this.geometry2.getGeometries().some(g => 
        new IntersectsPredicate(point, g).evaluate()
      );
    }
    return false;
  }

  private polylineIntersects(line: Polyline): boolean {
    if (this.geometry2 instanceof Point) {
      return this.pointIntersectsPolyline(this.geometry2, line);
    } else if (this.geometry2 instanceof Polyline) {
      return this.polylineIntersectsPolyline(line, this.geometry2);
    } else if (this.geometry2 instanceof Polygon) {
      return this.polylineIntersectsPolygon(line, this.geometry2);
    } else if (this.geometry2 instanceof GeometryCollection) {
      return this.geometry2.getGeometries().some(g => 
        new IntersectsPredicate(line, g).evaluate()
      );
    }
    return false;
  }

  private polygonIntersects(polygon: Polygon): boolean {
    if (this.geometry2 instanceof Point) {
      return polygon.contains(this.geometry2);
    } else if (this.geometry2 instanceof Polyline) {
      return this.polylineIntersectsPolygon(this.geometry2, polygon);
    } else if (this.geometry2 instanceof Polygon) {
      return this.polygonIntersectsPolygon(polygon, this.geometry2);
    } else if (this.geometry2 instanceof GeometryCollection) {
      return this.geometry2.getGeometries().some(g => 
        new IntersectsPredicate(polygon, g).evaluate()
      );
    }
    return false;
  }

  private collectionIntersects(collection: GeometryCollection): boolean {
    return collection.getGeometries().some(g => 
      new IntersectsPredicate(g, this.geometry2).evaluate()
    );
  }

  private pointIntersectsPolyline(point: Point, line: Polyline): boolean {
    const points = line.getPoints();
    for (let i = 0; i < points.length - 1; i++) {
      if (this.pointOnLineSegment(point, points[i], points[i + 1])) {
        return true;
      }
    }
    return false;
  }

  private polylineIntersectsPolyline(line1: Polyline, line2: Polyline): boolean {
    const points1 = line1.getPoints();
    const points2 = line2.getPoints();

    for (let i = 0; i < points1.length - 1; i++) {
      for (let j = 0; j < points2.length - 1; j++) {
        if (this.lineSegmentsIntersect(
          points1[i], points1[i + 1],
          points2[j], points2[j + 1]
        )) {
          return true;
        }
      }
    }
    return false;
  }

  private polylineIntersectsPolygon(line: Polyline, polygon: Polygon): boolean {
    // Check if any point of the line is inside the polygon
    if (line.getPoints().some(p => polygon.contains(p))) {
      return true;
    }

    // Check if line intersects any polygon boundary
    const exteriorRing = polygon.getExteriorRing();
    if (this.polylineIntersectsPolyline(line, exteriorRing)) {
      return true;
    }

    // Check interior rings
    return polygon.getInteriorRings().some(ring => 
      this.polylineIntersectsPolyline(line, ring)
    );
  }

  private polygonIntersectsPolygon(poly1: Polygon, poly2: Polygon): boolean {
    // Check if any vertex of one polygon is inside the other
    if (poly1.getExteriorRing().getPoints().some(p => poly2.contains(p)) ||
        poly2.getExteriorRing().getPoints().some(p => poly1.contains(p))) {
      return true;
    }

    // Check if boundaries intersect
    return this.polylineIntersectsPolyline(
      poly1.getExteriorRing(),
      poly2.getExteriorRing()
    );
  }

  private pointOnLineSegment(point: Point, start: Point, end: Point): boolean {
    const dx = end.getX() - start.getX();
    const dy = end.getY() - start.getY();
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length < this.EPSILON) {
      return point.equals(start);
    }

    const t = ((point.getX() - start.getX()) * dx + 
               (point.getY() - start.getY()) * dy) / (length * length);

    if (t < -this.EPSILON || t > 1 + this.EPSILON) {
      return false;
    }

    const projX = start.getX() + t * dx;
    const projY = start.getY() + t * dy;

    return Math.abs(point.getX() - projX) < this.EPSILON &&
           Math.abs(point.getY() - projY) < this.EPSILON;
  }

  private lineSegmentsIntersect(
    p1: Point, p2: Point,
    p3: Point, p4: Point
  ): boolean {
    // Quick rejection test using bounding boxes
    const [minX1, maxX1] = this.minMax(p1.getX(), p2.getX());
    const [minY1, maxY1] = this.minMax(p1.getY(), p2.getY());
    const [minX2, maxX2] = this.minMax(p3.getX(), p4.getX());
    const [minY2, maxY2] = this.minMax(p3.getY(), p4.getY());

    if (maxX1 < minX2 - this.EPSILON || minX1 > maxX2 + this.EPSILON ||
        maxY1 < minY2 - this.EPSILON || minY1 > maxY2 + this.EPSILON) {
      return false;
    }

    // Cross product method
    const ccw = (A: Point, B: Point, C: Point): number => {
      return (C.getY() - A.getY()) * (B.getX() - A.getX()) -
             (B.getY() - A.getY()) * (C.getX() - A.getX());
    };

    const ccw1 = ccw(p1, p2, p3);
    const ccw2 = ccw(p1, p2, p4);
    const ccw3 = ccw(p3, p4, p1);
    const ccw4 = ccw(p3, p4, p2);

    return (ccw1 * ccw2 < -this.EPSILON && ccw3 * ccw4 < -this.EPSILON) ||
           Math.abs(ccw1) < this.EPSILON || Math.abs(ccw2) < this.EPSILON ||
           Math.abs(ccw3) < this.EPSILON || Math.abs(ccw4) < this.EPSILON;
  }

  private minMax(a: number, b: number): [number, number] {
    return [Math.min(a, b), Math.max(a, b)];
  }
}

/**
 * Tests if one geometry contains another
 */
class ContainsPredicate extends GeometricPredicate {
  evaluate(): boolean {
    // A geometry contains another if their intersection equals the second geometry
    return new EqualsPredicate(
      this.geometry2,
      new IntersectsPredicate(this.geometry1, this.geometry2).evaluate()
        ? this.geometry2
        : new GeometryCollection([])
    ).evaluate();
  }
}

/**
 * Tests if one geometry is within another
 */
class WithinPredicate extends GeometricPredicate {
  evaluate(): boolean {
    // A is within B if B contains A
    return new ContainsPredicate(this.geometry2, this.geometry1).evaluate();
  }
}

/**
 * Tests if two geometries are equal
 */
class EqualsPredicate extends GeometricPredicate {
  evaluate(): boolean {
    // First check type equality
    if (this.geometry1.getGeometryType() !== this.geometry2.getGeometryType()) {
      return false;
    }

    // Then check specific type equality
    if (this.geometry1 instanceof Point) {
      return this.pointEquals(this.geometry1, this.geometry2 as Point);
    } else if (this.geometry1 instanceof Polyline) {
      return this.polylineEquals(this.geometry1, this.geometry2 as Polyline);
    } else if (this.geometry1 instanceof Polygon) {
      return this.polygonEquals(this.geometry1, this.geometry2 as Polygon);
    } else if (this.geometry1 instanceof GeometryCollection) {
      return this.collectionEquals(
        this.geometry1,
        this.geometry2 as GeometryCollection
      );
    }
    return false;
  }

  private pointEquals(p1: Point, p2: Point): boolean {
    return Math.abs(p1.getX() - p2.getX()) < this.EPSILON &&
           Math.abs(p1.getY() - p2.getY()) < this.EPSILON &&
           ((!p1.is3D() && !p2.is3D()) ||
            Math.abs(p1.getZ()! - p2.getZ()!) < this.EPSILON);
  }

  private polylineEquals(line1: Polyline, line2: Polyline): boolean {
    const points1 = line1.getPoints();
    const points2 = line2.getPoints();

    if (points1.length !== points2.length) {
      return false;
    }

    return points1.every((p, i) => this.pointEquals(p, points2[i]));
  }

  private polygonEquals(poly1: Polygon, poly2: Polygon): boolean {
    // Check exterior rings
    if (!this.polylineEquals(
      poly1.getExteriorRing(),
      poly2.getExteriorRing()
    )) {
      return false;
    }

    // Check interior rings
    const rings1 = poly1.getInteriorRings();
    const rings2 = poly2.getInteriorRings();

    if (rings1.length !== rings2.length) {
      return false;
    }

    // Note: This assumes rings are in the same order
    // A more robust implementation would check all possible matchings
    return rings1.every((ring, i) => 
      this.polylineEquals(ring, rings2[i])
    );
  }

  private collectionEquals(
    coll1: GeometryCollection,
    coll2: GeometryCollection
  ): boolean {
    const geoms1 = coll1.getGeometries();
    const geoms2 = coll2.getGeometries();

    if (geoms1.length !== geoms2.length) {
      return false;
    }

    // Note: This assumes geometries are in the same order
    // A more robust implementation would check all possible matchings
    return geoms1.every((geom, i) => 
      new EqualsPredicate(geom, geoms2[i]).evaluate()
    );
  }
}

/**
 * Tests if one geometry touches another (they have at least one boundary point in common)
 */
class TouchesPredicate extends GeometricPredicate {
  evaluate(): boolean {
    // Two geometries touch if their interiors do not intersect but their boundaries do
    // This is a simplified implementation
    if (this.geometry1 instanceof Point || this.geometry2 instanceof Point) {
      return this.evaluateWithPoint();
    }
    
    return this.boundariesIntersect() && !this.interiorsIntersect();
  }

  private evaluateWithPoint(): boolean {
    const point = this.geometry1 instanceof Point ? this.geometry1 : this.geometry2;
    const other = this.geometry1 instanceof Point ? this.geometry2 : this.geometry1;

    if (other instanceof Polyline) {
      return this.pointOnPolylineBoundary(point, other);
    } else if (other instanceof Polygon) {
      return this.pointOnPolygonBoundary(point, other);
    }
    return false;
  }

  private pointOnPolylineBoundary(point: Point, line: Polyline): boolean {
    const points = line.getPoints();
    return point.equals(points[0]) || point.equals(points[points.length - 1]) ||
           points.some((p, i) => 
             i < points.length - 1 && this.pointOnLineSegment(point, p, points[i + 1])
           );
  }

  private pointOnPolygonBoundary(point: Point, polygon: Polygon): boolean {
    const exterior = polygon.getExteriorRing();
    if (this.pointOnPolylineBoundary(point, exterior)) {
      return true;
    }
    return polygon.getInteriorRings().some(ring => 
      this.pointOnPolylineBoundary(point, ring)
    );
  }

  private pointOnLineSegment(point: Point, start: Point, end: Point): boolean {
    const dx = end.getX() - start.getX();
    const dy = end.getY() - start.getY();
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length < this.EPSILON) {
      return point.equals(start);
    }

    const t = ((point.getX() - start.getX()) * dx + 
               (point.getY() - start.getY()) * dy) / (length * length);

    if (t < -this.EPSILON || t > 1 + this.EPSILON) {
      return false;
    }

    const projX = start.getX() + t * dx;
    const projY = start.getY() + t * dy;

    return Math.abs(point.getX() - projX) < this.EPSILON &&
           Math.abs(point.getY() - projY) < this.EPSILON;
  }

  private boundariesIntersect(): boolean {
    // Get boundaries of both geometries
    const boundary1 = this.getBoundary(this.geometry1);
    const boundary2 = this.getBoundary(this.geometry2);
    
    return new IntersectsPredicate(boundary1, boundary2).evaluate();
  }

  private interiorsIntersect(): boolean {
    // This is a simplified check - a full implementation would need
    // to properly compute geometry interiors
    if (this.geometry1 instanceof Polygon && this.geometry2 instanceof Polygon) {
      return this.polygonInteriorsIntersect(this.geometry1, this.geometry2);
    }
    return false;
  }

  private polygonInteriorsIntersect(poly1: Polygon, poly2: Polygon): boolean {
    // Check if any interior point of one polygon is inside the other
    const interiorPoint1 = this.getInteriorPoint(poly1);
    const interiorPoint2 = this.getInteriorPoint(poly2);
    
    return poly2.contains(interiorPoint1) || poly1.contains(interiorPoint2);
  }

  private getInteriorPoint(polygon: Polygon): Point {
    // Simple method to get an interior point - average of vertices
    const points = polygon.getExteriorRing().getPoints();
    let sumX = 0, sumY = 0;
    points.forEach(p => {
      sumX += p.getX();
      sumY += p.getY();
    });
    return new Point(sumX / points.length, sumY / points.length);
  }

  private getBoundary(geometry: Geometry): Geometry {
    if (geometry instanceof Point) {
      return new GeometryCollection([]); // Points have empty boundaries
    } else if (geometry instanceof Polyline) {
      return new GeometryCollection([
        geometry.getPoints()[0],
        geometry.getPoints()[geometry.getPoints().length - 1]
      ]);
    } else if (geometry instanceof Polygon) {
      return new GeometryCollection([
        geometry.getExteriorRing(),
        ...geometry.getInteriorRings()
      ]);
    } else if (geometry instanceof GeometryCollection) {
      const boundaries = geometry.getGeometries().map(g => this.getBoundary(g));
      return new GeometryCollection(boundaries);
    }
    throw new Error('Unsupported geometry type');
  }
}

/**
 * Tests if one geometry overlaps another
 */
class OverlapsPredicate extends GeometricPredicate {
  evaluate(): boolean {
    // Two geometries overlap if their intersection has the same dimension as the geometries
    // and the intersection is not equal to either geometry
    if (this.geometry1.dimension() !== this.geometry2.dimension()) {
      return false;
    }

    const intersection = new IntersectsPredicate(this.geometry1, this.geometry2).evaluate();
    if (!intersection) {
      return false;
    }

    return !new EqualsPredicate(this.geometry1, this.geometry2).evaluate() &&
           !new ContainsPredicate(this.geometry1, this.geometry2).evaluate() &&
           !new ContainsPredicate(this.geometry2, this.geometry1).evaluate();
  }
}

/**
 * Utility class to provide easy access to all geometric predicates
 */
class GeometricPredicates {
  /**
   * Tests if two geometries intersect
   */
  static intersects(geometry1: Geometry, geometry2: Geometry): boolean {
    return new IntersectsPredicate(geometry1, geometry2).evaluate();
  }

  /**
   * Tests if one geometry contains another
   */
  static contains(geometry1: Geometry, geometry2: Geometry): boolean {
    return new ContainsPredicate(geometry1, geometry2).evaluate();
  }

  /**
   * Tests if one geometry is within another
   */
  static within(geometry1: Geometry, geometry2: Geometry): boolean {
    return new WithinPredicate(geometry1, geometry2).evaluate();
  }

  /**
   * Tests if two geometries are equal
   */
  static equals(geometry1: Geometry, geometry2: Geometry): boolean {
    return new EqualsPredicate(geometry1, geometry2).evaluate();
  }

  /**
   * Tests if two geometries touch
   */
  static touches(geometry1: Geometry, geometry2: Geometry): boolean {
    return new TouchesPredicate(geometry1, geometry2).evaluate();
  }

  /**
   * Tests if two geometries overlap
   */
  static overlaps(geometry1: Geometry, geometry2: Geometry): boolean {
    return new OverlapsPredicate(geometry1, geometry2).evaluate();
  }

  /**
   * Tests if two geometries are disjoint (do not intersect)
   */
  static disjoint(geometry1: Geometry, geometry2: Geometry): boolean {
    return !GeometricPredicates.intersects(geometry1, geometry2);
  }

  /**
   * Tests if one geometry covers another
   * (similar to contains but includes boundary points)
   */
  static covers(geometry1: Geometry, geometry2: Geometry): boolean {
    return GeometricPredicates.contains(geometry1, geometry2) ||
           GeometricPredicates.touches(geometry1, geometry2);
  }

  /**
   * Tests if one geometry is covered by another
   */
  static coveredBy(geometry1: Geometry, geometry2: Geometry): boolean {
    return GeometricPredicates.covers(geometry2, geometry1);
  }
}

export {
  GeometricPredicates,
  GeometricPredicate,
  IntersectsPredicate,
  ContainsPredicate,
  WithinPredicate,
  EqualsPredicate,
  TouchesPredicate,
  OverlapsPredicate
};