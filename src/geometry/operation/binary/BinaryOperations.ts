import { Point, Geometry, CoordinateSystem } from '../../base/Point';
import { GeometryCollection } from '../../collection/GeometryCollection';
import { MultiPolygon } from '../../collection/MultiPolygon';
import { MultiPolyline } from '../../collection/MultiPolyline';
import { Polygon } from '../../primitive/Polygon';
import { Polyline } from '../../primitive/Polyline';

/**
 * Abstract base class for binary geometric operations
 */
abstract class BinaryOperation {
  protected geometry1: Geometry;
  protected geometry2: Geometry;

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

  abstract execute(): Geometry;
}

/**
 * Computes the intersection of two geometries
 */
class IntersectionOperation extends BinaryOperation {
  execute(): Geometry {
    // Handle different geometry type combinations
    if (this.geometry1 instanceof Point) {
      return this.intersectPoint(this.geometry1);
    } else if (this.geometry1 instanceof Polyline) {
      return this.intersectPolyline(this.geometry1);
    } else if (this.geometry1 instanceof Polygon) {
      return this.intersectPolygon(this.geometry1);
    } else if (this.geometry1 instanceof GeometryCollection) {
      return this.intersectCollection(this.geometry1);
    }
    throw new Error('Unsupported geometry type combination');
  }

  private intersectPoint(point: Point): Geometry {
    if (this.geometry2 instanceof Point) {
      return point.equals(this.geometry2) ? point.clone() : new GeometryCollection([]);
    } else if (this.geometry2 instanceof Polyline) {
      return this.pointPolylineIntersection(point, this.geometry2);
    } else if (this.geometry2 instanceof Polygon) {
      return this.geometry2.contains(point) ? point.clone() : new GeometryCollection([]);
    }
    return new GeometryCollection([]);
  }

  private intersectPolyline(line: Polyline): Geometry {
    if (this.geometry2 instanceof Point) {
      return this.pointPolylineIntersection(this.geometry2, line);
    } else if (this.geometry2 instanceof Polyline) {
      return this.polylinePolylineIntersection(line, this.geometry2 as Polyline);
    } else if (this.geometry2 instanceof Polygon) {
      return this.polylinePolygonIntersection(line, this.geometry2);
    }
    return new GeometryCollection([]);
  }

  private intersectPolygon(polygon: Polygon): Geometry {
    if (this.geometry2 instanceof Point) {
      return polygon.contains(this.geometry2) ? this.geometry2.clone() : new GeometryCollection([]);
    } else if (this.geometry2 instanceof Polyline) {
      return this.polylinePolygonIntersection(this.geometry2, polygon);
    } else if (this.geometry2 instanceof Polygon) {
      return this.polygonPolygonIntersection(polygon, this.geometry2);
    }
    return new GeometryCollection([]);
  }

  private intersectCollection(collection: GeometryCollection): Geometry {
    const intersections = collection.getGeometries().map(geom => 
      new IntersectionOperation(geom, this.geometry2).execute()
    );
    return new GeometryCollection(intersections);
  }

  private pointPolylineIntersection(point: Point, line: Polyline): Geometry {
    const points = line.getPoints();
    for (let i = 0; i < points.length - 1; i++) {
      if (this.pointOnLineSegment(point, points[i], points[i + 1])) {
        return point.clone();
      }
    }
    return new GeometryCollection([]);
  }

  private polylinePolylineIntersection(line1: Polyline, line2: Polyline): Geometry {
    const intersectionPoints: Point[] = [];
    const points1 = line1.getPoints();
    const points2 = line2.getPoints();

    for (let i = 0; i < points1.length - 1; i++) {
      for (let j = 0; j < points2.length - 1; j++) {
        const intersection = this.lineSegmentIntersection(
          points1[i], points1[i + 1],
          points2[j], points2[j + 1]
        );
        if (intersection) {
          intersectionPoints.push(intersection);
        }
      }
    }

    return new GeometryCollection(intersectionPoints);
  }

  private polylinePolygonIntersection(line: Polyline, polygon: Polygon): Geometry {
    const intersectionPoints: Point[] = [];
    const linePoints = line.getPoints();
    const polygonRings = [
      polygon.getExteriorRing(),
      ...polygon.getInteriorRings()
    ];

    // Find intersections with polygon boundaries
    for (let i = 0; i < linePoints.length - 1; i++) {
      for (const ring of polygonRings) {
        const ringPoints = ring.getPoints();
        for (let j = 0; j < ringPoints.length - 1; j++) {
          const intersection = this.lineSegmentIntersection(
            linePoints[i], linePoints[i + 1],
            ringPoints[j], ringPoints[j + 1]
          );
          if (intersection) {
            intersectionPoints.push(intersection);
          }
        }
      }
    }

    // Add line segments that are completely inside the polygon
    const segments: Polyline[] = [];
    for (let i = 0; i < linePoints.length - 1; i++) {
      const p1 = linePoints[i];
      const p2 = linePoints[i + 1];
      if (polygon.contains(p1) && polygon.contains(p2)) {
        segments.push(new Polyline([p1.clone(), p2.clone()]));
      }
    }

    if (segments.length > 0) {
      return new MultiPolyline(segments);
    }
    return new GeometryCollection(intersectionPoints);
  }

  private polygonPolygonIntersection(poly1: Polygon, poly2: Polygon): Geometry {
    // This is a simplified implementation that needs to be enhanced for production use
    // A full implementation would need:
    // - Proper handling of holes
    // - Robust geometric intersection algorithm (e.g., Weiler-Atherton)
    // - Handling of degenerate cases
    
    const intersectionPoints: Point[] = [];
    const rings1 = [poly1.getExteriorRing(), ...poly1.getInteriorRings()];
    const rings2 = [poly2.getExteriorRing(), ...poly2.getInteriorRings()];

    // Find intersection points of boundaries
    for (const ring1 of rings1) {
      for (const ring2 of rings2) {
        const points1 = ring1.getPoints();
        const points2 = ring2.getPoints();

        for (let i = 0; i < points1.length - 1; i++) {
          for (let j = 0; j < points2.length - 1; j++) {
            const intersection = this.lineSegmentIntersection(
              points1[i], points1[i + 1],
              points2[j], points2[j + 1]
            );
            if (intersection) {
              intersectionPoints.push(intersection);
            }
          }
        }
      }
    }

    // If no intersection points are found, check if one polygon is inside the other
    if (intersectionPoints.length === 0) {
      if (this.polygonContainsPolygon(poly1, poly2)) {
        return poly2.clone();
      }
      if (this.polygonContainsPolygon(poly2, poly1)) {
        return poly1.clone();
      }
      return new GeometryCollection([]);
    }

    // For simplicity, return intersection points
    // A full implementation would construct the intersection polygon
    return new GeometryCollection(intersectionPoints);
  }

  private pointOnLineSegment(point: Point, start: Point, end: Point): boolean {
    const dx = end.getX() - start.getX();
    const dy = end.getY() - start.getY();
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      return point.equals(start);
    }

    const t = ((point.getX() - start.getX()) * dx + 
               (point.getY() - start.getY()) * dy) / (length * length);

    if (t < 0 || t > 1) {
      return false;
    }

    const projX = start.getX() + t * dx;
    const projY = start.getY() + t * dy;
    const epsilon = 1e-10;

    return Math.abs(point.getX() - projX) < epsilon &&
           Math.abs(point.getY() - projY) < epsilon;
  }

  private lineSegmentIntersection(
    p1: Point, p2: Point,
    p3: Point, p4: Point
  ): Point | null {
    const dx1 = p2.getX() - p1.getX();
    const dy1 = p2.getY() - p1.getY();
    const dx2 = p4.getX() - p3.getX();
    const dy2 = p4.getY() - p3.getY();

    const determinant = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(determinant) < 1e-10) {
      return null; // Lines are parallel
    }

    const t1 = ((p3.getX() - p1.getX()) * dy2 - (p3.getY() - p1.getY()) * dx2) / determinant;
    const t2 = ((p3.getX() - p1.getX()) * dy1 - (p3.getY() - p1.getY()) * dx1) / determinant;

    if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
      const x = p1.getX() + t1 * dx1;
      const y = p1.getY() + t1 * dy1;
      return new Point(x, y);
    }

    return null;
  }

  private polygonContainsPolygon(outer: Polygon, inner: Polygon): boolean {
    // Check if all vertices of inner polygon are inside outer polygon
    return inner.getExteriorRing().getPoints().every(p => outer.contains(p));
  }
}

/**
 * Computes the union of two geometries
 */
class UnionOperation extends BinaryOperation {
  execute(): Geometry {
    // Handle different geometry type combinations
    if (this.geometry1 instanceof Point) {
      return this.unionPoint(this.geometry1);
    } else if (this.geometry1 instanceof Polyline) {
      return this.unionPolyline(this.geometry1);
    } else if (this.geometry1 instanceof Polygon) {
      return this.unionPolygon(this.geometry1);
    } else if (this.geometry1 instanceof GeometryCollection) {
      return this.unionCollection(this.geometry1);
    }
    throw new Error('Unsupported geometry type combination');
  }

  private unionPoint(point: Point): Geometry {
    if (this.geometry2 instanceof Point) {
      return point.equals(this.geometry2) 
        ? point.clone() 
        : new GeometryCollection([point.clone(), this.geometry2.clone()]);
    } else if (this.geometry2 instanceof Polyline) {
      const points = [point.clone(), ...this.geometry2.getPoints()];
      return new GeometryCollection(points);
    } else if (this.geometry2 instanceof Polygon) {
      return this.geometry2.contains(point) 
        ? this.geometry2.clone() 
        : new GeometryCollection([point.clone(), this.geometry2.clone()]);
    }
    return new GeometryCollection([point.clone(), this.geometry2]);
  }

  private unionPolyline(line: Polyline): Geometry {
    if (this.geometry2 instanceof Point) {
      return this.unionPoint(this.geometry2);
    } else if (this.geometry2 instanceof Polyline) {
      return new MultiPolyline([line.clone(), this.geometry2.clone()]);
    } else if (this.geometry2 instanceof Polygon) {
      return new GeometryCollection([line.clone(), this.geometry2.clone()]);
    }
    return new GeometryCollection([line.clone(), this.geometry2]);
  }

  private unionPolygon(polygon: Polygon): Geometry {
    if (this.geometry2 instanceof Point) {
      return this.unionPoint(this.geometry2);
    } else if (this.geometry2 instanceof Polyline) {
      return new GeometryCollection([polygon.clone(), this.geometry2.clone()]);
    } else if (this.geometry2 instanceof Polygon) {
      // Simplified union - a full implementation would merge overlapping polygons
      return new MultiPolygon([polygon.clone(), this.geometry2.clone()]);
    }
    return new GeometryCollection([polygon.clone(), this.geometry2]);
  }

  private unionCollection(collection: GeometryCollection): Geometry {
    const geometries = [
      ...collection.getGeometries(),
      ...(this.geometry2 instanceof GeometryCollection 
        ? this.geometry2.getGeometries() 
        : [this.geometry2])
    ];
    return new GeometryCollection(geometries.map(g => g.clone()));
  }
}

/**
 * Computes the difference between two geometries
 */
class DifferenceOperation extends BinaryOperation {
  execute(): Geometry {
    // A proper implementation would compute true geometric difference
    // This is a placeholder that returns the first geometry when there's no intersection
    const intersection = new IntersectionOperation(
      this.geometry1,
      this.geometry2
    ).execute();

    if (intersection instanceof GeometryCollection && intersection.isEmpty()) {
      return this.geometry1.clone();
    }

    // For points
    if (this.geometry1 instanceof Point) {
      return this.geometry2.contains(this.geometry1)
        ? new GeometryCollection([])
        : this.geometry1.clone();
    }

    // For polylines
    if (this.geometry1 instanceof Polyline && this.geometry2 instanceof Polygon) {
      return this.polylinePolygonDifference(this.geometry1, this.geometry2);
    }

    // For polygons
    if (this.geometry1 instanceof Polygon && this.geometry2 instanceof Polygon) {
      return this.polygonPolygonDifference(this.geometry1, this.geometry2);
    }

    // Default case - return original geometry
    // A full implementation would handle all geometry type combinations
    return this.geometry1.clone();
  }

  private polylinePolygonDifference(line: Polyline, polygon: Polygon): Geometry {
    const points = line.getPoints();
    const segments: Polyline[] = [];
    let currentSegment: Point[] = [];

    // Process each point
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const isInside = polygon.contains(point);

      if (!isInside) {
        currentSegment.push(point.clone());
      } else if (currentSegment.length > 0) {
        if (currentSegment.length > 1) {
          segments.push(new Polyline(currentSegment));
        }
        currentSegment = [];
      }
    }

    // Add final segment if exists
    if (currentSegment.length > 1) {
      segments.push(new Polyline(currentSegment));
    }

    return segments.length === 1 
      ? segments[0] 
      : new MultiPolyline(segments);
  }

  private polygonPolygonDifference(poly1: Polygon, poly2: Polygon): Geometry {
    // This is a simplified implementation
    // A full implementation would:
    // 1. Find all intersection points
    // 2. Create new boundaries
    // 3. Handle holes properly
    // 4. Deal with complex cases (multiple resultant polygons)

    // For now, we'll just handle the simple case where one polygon is completely inside another
    if (this.polygonContainsPolygon(poly2, poly1)) {
      return new GeometryCollection([]); // poly1 is completely inside poly2
    }
    if (!this.polygonsIntersect(poly1, poly2)) {
      return poly1.clone(); // No intersection
    }

    // Return original polygon as placeholder
    // Real implementation would compute actual difference
    return poly1.clone();
  }

  private polygonContainsPolygon(outer: Polygon, inner: Polygon): boolean {
    return inner.getExteriorRing().getPoints()
      .every(p => outer.contains(p));
  }

  private polygonsIntersect(poly1: Polygon, poly2: Polygon): boolean {
    // Check if any vertex of poly1 is inside poly2 or vice versa
    return poly1.getExteriorRing().getPoints()
      .some(p => poly2.contains(p)) ||
      poly2.getExteriorRing().getPoints()
      .some(p => poly1.contains(p));
  }
}

/**
 * Computes the symmetric difference between two geometries
 */
class SymmetricDifferenceOperation extends BinaryOperation {
  execute(): Geometry {
    // Symmetric difference can be computed as (A - B) ∪ (B - A)
    const diff1 = new DifferenceOperation(this.geometry1, this.geometry2).execute();
    const diff2 = new DifferenceOperation(this.geometry2, this.geometry1).execute();
    return new UnionOperation(diff1, diff2).execute();
  }
}

/**
 * Utility class to provide easy access to all binary operations
 */
class BinaryOperations {
  /**
   * Computes the intersection of two geometries
   */
  static intersection(geometry1: Geometry, geometry2: Geometry): Geometry {
    return new IntersectionOperation(geometry1, geometry2).execute();
  }

  /**
   * Computes the union of two geometries
   */
  static union(geometry1: Geometry, geometry2: Geometry): Geometry {
    return new UnionOperation(geometry1, geometry2).execute();
  }

  /**
   * Computes the difference between two geometries (geometry1 - geometry2)
   */
  static difference(geometry1: Geometry, geometry2: Geometry): Geometry {
    return new DifferenceOperation(geometry1, geometry2).execute();
  }

  /**
   * Computes the symmetric difference between two geometries
   */
  static symmetricDifference(geometry1: Geometry, geometry2: Geometry): Geometry {
    return new SymmetricDifferenceOperation(geometry1, geometry2).execute();
  }
}

export {
  BinaryOperations,
  BinaryOperation,
  IntersectionOperation,
  UnionOperation,
  DifferenceOperation,
  SymmetricDifferenceOperation
};