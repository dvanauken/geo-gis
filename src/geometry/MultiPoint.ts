// MultiPoint.ts
import { GeometryCollection } from "./GeometryCollection";
import { Point } from "./Point";
import { Geometry } from "./Geometry";

export class MultiPoint extends GeometryCollection<Point> {
    constructor() {
        super();
    }

    // Override from Geometry
    geometryType(): string {
        return 'MULTIPOINT';
    }

    // Check if MultiPoint is empty
    isEmpty(): boolean {
        return this.items.length === 0;
    }

    // The boundary of a MultiPoint is always empty
    boundary(): Geometry {
        return new Point(); // Returns an empty point
    }

    // Test for equality with another geometry
    equals(another: Geometry): boolean {
        if (!(another instanceof MultiPoint)) {
            return false;
        }
        
        if (this.items.length !== another.items.length) {
            return false;
        }

        // Check if all points match (order doesn't matter)
        return this.items.every(point => 
            another.items.some(otherPoint => point.equals(otherPoint))
        );
    }

    // A MultiPoint is simple if it has no coincident points
    isSimple(): boolean {
        // Check for duplicate points
        for (let i = 0; i < this.items.length; i++) {
            for (let j = i + 1; j < this.items.length; j++) {
                if (this.items[i].equals(this.items[j])) {
                    return false;
                }
            }
        }
        return true;
    }

    // Convenience method to add a point
    addPoint(point: Point): void {
        this.items.push(point);
    }

    // Get point at index (1-based as per spec)
    pointN(n: number): Point {
        if (n < 1 || n > this.items.length) {
            throw new Error("Point index out of range");
        }
        return this.items[n - 1];
    }

    // Number of points in the collection
    numPoints(): number {
        return this.items.length;
    }

    // WKT representation
    asText(): string {
        if (this.isEmpty()) {
            return "MULTIPOINT EMPTY";
        }

        const pointsText = this.items
            .map(p => `(${p.x()} ${p.y()})`)
            .join(", ");
            
        return `MULTIPOINT ${pointsText}`;
    }

    // Returns coordinates of all points
    coordinates(): number[][] {
        return this.items.map(p => [p.x(), p.y()]);
    }

    // Check if contains a specific point
    contains(point: Point): boolean {
        return this.items.some(p => p.equals(point));
    }

    // Get centroid of all points
    centroid(): Point {
        if (this.isEmpty()) {
            throw new Error("Cannot compute centroid of empty MultiPoint");
        }

        let sumX = 0;
        let sumY = 0;
        
        this.items.forEach(point => {
            sumX += point.x();
            sumY += point.y();
        });

        return new Point(
            sumX / this.items.length,
            sumY / this.items.length
        );
    }

    // Get minimum bounding box
    envelope(): Geometry {
        if (this.isEmpty()) {
            return new Point();
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        this.items.forEach(point => {
            minX = Math.min(minX, point.x());
            minY = Math.min(minY, point.y());
            maxX = Math.max(maxX, point.x());
            maxY = Math.max(maxY, point.y());
        });

        // Create a Point if min and max are same
        if (minX === maxX && minY === maxY) {
            return new Point(minX, minY);
        }

        // Should return a Polygon for the bounding box
        // But since we haven't implemented Polygon yet, 
        // we'll return the corners as a MultiPoint for now
        const corners = new MultiPoint();
        corners.addPoint(new Point(minX, minY));
        corners.addPoint(new Point(maxX, minY));
        corners.addPoint(new Point(maxX, maxY));
        corners.addPoint(new Point(minX, maxY));
        return corners;
    }

    // Clone this MultiPoint
    clone(): MultiPoint {
        const newMultiPoint = new MultiPoint();
        this.items.forEach(point => {
            newMultiPoint.addPoint(point.clone());
        });
        return newMultiPoint;
    }

    // Calculate minimum distance to another geometry
    distance(another: Geometry): number {
        if (this.isEmpty() || another.isEmpty()) {
            throw new Error("Cannot compute distance with empty geometry");
        }

        // If another is a Point
        if (another instanceof Point) {
            return this.distanceToPoint(another);
        }

        // If another is a MultiPoint
        if (another instanceof MultiPoint) {
            return this.distanceToMultiPoint(another);
        }

        throw new Error("Distance calculation not implemented for this geometry type");
    }

    private distanceToPoint(point: Point): number {
        return Math.min(...this.items.map(p => p.distance(point)));
    }

    private distanceToMultiPoint(multiPoint: MultiPoint): number {
        let minDistance = Infinity;
        
        for (const p1 of this.items) {
            for (const p2 of multiPoint.items) {
                const distance = p1.distance(p2);
                if (distance < minDistance) {
                    minDistance = distance;
                }
            }
        }

        return minDistance;
    }
}