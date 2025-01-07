import { LineString } from "./LineString";
import { Point } from "./Point";

export class LinearRing extends LineString {
    constructor() {
        super();
    }

    // Override from Curve/LineString to enforce LinearRing rules
    isClosed(): boolean {
        return true;  // LinearRings are always closed by definition
    }

    isRing(): boolean {
        return true;  // LinearRings are always rings by definition
    }

    // Core validation for LinearRing requirements
    isValid(): boolean {
        // Empty ring is valid
        if (this.points.length === 0) {
            return true;
        }

        // Must have 4 or more points (first equals last makes effectively 3+ unique points)
        if (this.points.length < 4) {
            return false;
        }

        // First point must equal last point
        const first = this.points[0];
        const last = this.points[this.points.length - 1];
        if (!first.equals(last)) {
            return false;
        }

        // Check for self-intersections (except at endpoints)
        return this.hasNoSelfIntersections();
    }

    // Methods for orientation checking (used by Polygon)
    isCounterClockwise(): boolean {
        // Used for exterior ring validation
        if (this.points.length < 4) return false;
        
        // Implementation of counterclockwise check
        // Calculate signed area - positive for counterclockwise
        let sum = 0;
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            sum += (p2.x() - p1.x()) * (p2.y() + p1.y());
        }
        return sum > 0;
    }

    isClockwise(): boolean {
        // Used for interior ring validation
        return !this.isCounterClockwise();
    }

    // Helper methods for validation
    private hasMinPoints(): boolean {
        return this.points.length === 0 || this.points.length >= 4;
    }

    private hasValidClosure(): boolean {
        if (this.points.length === 0) return true;
        const first = this.points[0];
        const last = this.points[this.points.length - 1];
        return first.equals(last);
    }

    private hasNoSelfIntersections(): boolean {
        // Basic implementation - could be enhanced with more sophisticated
        // geometric intersection checking
        // This is a simplified version that checks for duplicate points
        // except for first/last
        const uniquePoints = new Set<string>();
        
        for (let i = 0; i < this.points.length - 1; i++) {
            const point = this.points[i];
            const key = `${point.x()},${point.y()}`;
            if (uniquePoints.has(key)) {
                return false;  // Found a self-intersection
            }
            uniquePoints.add(key);
        }
        
        return true;
    }

    // Override from LineString to enforce ring constraints
    addPoint(point: Point): void {
        super.addPoint(point);
        
        // If this is the first point, automatically close the ring
        // by adding it as the last point as well
        if (this.points.length === 1) {
            super.addPoint(point);
        } else if (this.points.length > 1) {
            // Replace the last point with a copy of the first point
            // to maintain closure
            this.points[this.points.length - 1] = this.points[0];
        }
    }

    // Override geometry type
    geometryType(): string {
        return 'LINEARRING';
    }
}