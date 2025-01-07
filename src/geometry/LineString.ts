// LineString.ts
import { Curve } from "./Curve";
import { Point } from "./Point";

export class LineString extends Curve {
    points: Point[];

    constructor() {
        super();
        this.points = new Array<Point>();
    }

    // Basic methods required by spec
    numPoints(): number {
        return this.points.length;
    }

    pointN(n: number): Point {
        if (n < 1 || n > this.points.length) {
            throw new Error("Point index out of range");
        }
        return this.points[n - 1]; // Convert from 1-based to 0-based indexing
    }

    // Inherited from Curve, but need specific implementation
    startPoint(): Point {
        if (this.isEmpty()) {
            throw new Error("LineString is empty");
        }
        return this.points[0];
    }

    endPoint(): Point {
        if (this.isEmpty()) {
            throw new Error("LineString is empty");
        }
        return this.points[this.points.length - 1];
    }

    isClosed(): boolean {
        if (this.points.length < 2) return false;
        return this.startPoint().equals(this.endPoint());
    }

    // A LineString is a ring if it's both closed and simple
    isRing(): boolean {
        return this.isClosed() && this.isSimple();
    }

    // Length calculation (from Curve)
    length(): number {
        if (this.points.length < 2) return 0;
        
        let totalLength = 0;
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            totalLength += this.distanceBetweenPoints(p1, p2);
        }
        return totalLength;
    }

    // Override Geometry methods
    isEmpty(): boolean {
        return this.points.length === 0;
    }

    isSimple(): boolean {
        // A LineString is simple if it does not self-intersect
        // This is a basic implementation that could be enhanced
        if (this.points.length < 2) return true;

        // Check for self-intersections between non-adjacent segments
        for (let i = 0; i < this.points.length - 1; i++) {
            for (let j = i + 2; j < this.points.length - 1; j++) {
                if (this.segmentsIntersect(
                    this.points[i], this.points[i + 1],
                    this.points[j], this.points[j + 1]
                )) {
                    return false;
                }
            }
        }
        return true;
    }

    geometryType(): string {
        return 'LINESTRING';
    }

    // Additional utility methods
    addPoint(point: Point): void {
        this.points.push(point);
    }

    // Helper methods for geometric calculations
    private distanceBetweenPoints(p1: Point, p2: Point): number {
        const dx = p2.x() - p1.x();
        const dy = p2.y() - p1.y();
        return Math.sqrt(dx * dx + dy * dy);
    }

    private segmentsIntersect(
        p1: Point, p2: Point, 
        p3: Point, p4: Point
    ): boolean {
        // Implementation of line segment intersection test
        // using cross product method
        
        const ccw = (A: Point, B: Point, C: Point): number => {
            return (C.y() - A.y()) * (B.x() - A.x()) -
                   (B.y() - A.y()) * (C.x() - A.x());
        };

        const a = ccw(p1, p2, p3);
        const b = ccw(p1, p2, p4);
        const c = ccw(p3, p4, p1);
        const d = ccw(p3, p4, p2);

        // If the segments share an endpoint, they don't intersect
        // for the purposes of simplicity checking
        if (p1.equals(p3) || p1.equals(p4) || 
            p2.equals(p3) || p2.equals(p4)) {
            return false;
        }

        // Check if the segments intersect
        if (((a > 0 && b < 0) || (a < 0 && b > 0)) &&
            ((c > 0 && d < 0) || (c < 0 && d > 0))) {
            return true;
        }

        return false;
    }

    // WKT representation
    asText(): string {
        if (this.isEmpty()) {
            return "LINESTRING EMPTY";
        }
        
        const pointsText = this.points
            .map(p => `${p.x()} ${p.y()}`)
            .join(", ");
            
        return `LINESTRING (${pointsText})`;
    }
}