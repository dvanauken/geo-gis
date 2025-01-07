// MultiCurve.ts
import { GeometryCollection } from "./GeometryCollection";
import { Curve } from "./Curve";
import { Geometry } from "./Geometry";
import { Point } from "./Point";
import { MultiPoint } from "./MultiPoint";

export abstract class MultiCurve extends GeometryCollection<Curve> {
    constructor() {
        super();
    }

    // Override from Geometry
    geometryType(): string {
        return 'MULTICURVE';
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    equals(another: Geometry): boolean {
        if (!(another instanceof MultiCurve)) {
            return false;
        }

        if (this.items.length !== another.items.length) {
            return false;
        }

        // Check if all curves match (order doesn't matter)
        return this.items.every(curve => 
            another.items.some(otherCurve => curve.equals(otherCurve))
        );
    }

    // Required methods from spec
    isClosed(): boolean {
        // A MultiCurve is closed if all its elements are closed
        return this.items.every(curve => curve.isClosed());
    }

    // Calculate total length of all curves
    length(): number {
        return this.items.reduce((total, curve) => 
            total + curve.length(), 0);
    }

    // A MultiCurve is simple if all its elements are simple and the
    // only intersections occur at Points that are boundary Points
    isSimple(): boolean {
        // Check if each curve is simple
        if (!this.items.every(curve => curve.isSimple())) {
            return false;
        }

        // Check intersections between different curves
        for (let i = 0; i < this.items.length; i++) {
            for (let j = i + 1; j < this.items.length; j++) {
                if (this.hasInvalidIntersection(this.items[i], this.items[j])) {
                    return false;
                }
            }
        }

        return true;
    }

    // The boundary of a MultiCurve is obtained by applying the "mod 2" union rule
    boundary(): Geometry {
        if (this.isEmpty()) {
            return new Point(); // Empty point as boundary
        }

        // Count occurrences of each endpoint
        const pointCount = new Map<string, number>();
        
        this.items.forEach(curve => {
            if (!curve.isEmpty() && !curve.isClosed()) {
                const start = curve.startPoint();
                const end = curve.endPoint();
                
                const startKey = `${start.x()},${start.y()}`;
                const endKey = `${end.x()},${end.y()}`;
                
                pointCount.set(startKey, (pointCount.get(startKey) || 0) + 1);
                pointCount.set(endKey, (pointCount.get(endKey) || 0) + 1);
            }
        });

        // Create MultiPoint with points that appear odd number of times
        const boundaryPoints = new MultiPoint();
        
        pointCount.forEach((count, pointKey) => {
            if (count % 2 === 1) {
                const [x, y] = pointKey.split(',').map(Number);
                boundaryPoints.addPoint(new Point(x, y));
            }
        });

        return boundaryPoints;
    }

    // Additional methods
    addCurve(curve: Curve): void {
        this.items.push(curve);
    }

    curveN(n: number): Curve {
        if (n < 1 || n > this.items.length) {
            throw new Error("Curve index out of range");
        }
        return this.items[n - 1];
    }

    numCurves(): number {
        return this.items.length;
    }

    // WKT representation
    asText(): string {
        if (this.isEmpty()) {
            return "MULTICURVE EMPTY";
        }

        const curvesText = this.items
            .map(curve => curve.asText())
            .join(", ");

        return `MULTICURVE (${curvesText})`;
    }

    // Helper method to check if two curves intersect invalidly
    private hasInvalidIntersection(curve1: Curve, curve2: Curve): boolean {
        // An intersection is invalid if it occurs at non-boundary points
        // This is a simplified check - a full implementation would need
        // more sophisticated geometric intersection testing
        
        // Get boundary points of both curves
        const boundary1 = curve1.boundary();
        const boundary2 = curve2.boundary();

        // Check if curves intersect at non-boundary points
        // Note: This is a simplified implementation
        // A complete implementation would need proper curve intersection testing
        return false; // Placeholder - needs proper implementation
    }

    protected isPointOnBoundary(point: Point, curve: Curve): boolean {
        if (curve.isEmpty()) return false;
        return point.equals(curve.startPoint()) || 
               point.equals(curve.endPoint());
    }
}