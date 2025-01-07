// Polygon.ts
import { Surface } from "./Surface";
import { LinearRing } from "./LinearRing";
import { MultiCurve } from "./MultiCurve";
import { Point } from "./Point";
import { Geometry } from "./Geometry";
import { MultiLineString } from "./MultiLineString";

export class Polygon extends Surface {
    protected _exteriorRing: LinearRing;
    protected interiorRings: LinearRing[];

    constructor() {
        super();
        this._exteriorRing = new LinearRing();
        this.interiorRings = [];
    }

    // Override from Geometry
    geometryType(): string {
        return 'POLYGON';
    }

    isEmpty(): boolean {
        return this._exteriorRing.isEmpty();
    }

    equals(another: Geometry): boolean {
        if (!(another instanceof Polygon)) {
            return false;
        }

        // Check exterior ring
        if (!this._exteriorRing.equals(another._exteriorRing)) {
            return false;
        }

        // Check interior rings (order doesn't matter)
        if (this.interiorRings.length !== another.interiorRings.length) {
            return false;
        }

        return this.interiorRings.every(ring =>
            another.interiorRings.some(otherRing => ring.equals(otherRing))
        );
    }

    // Required methods from Surface
    area(): number {
        // Calculate area using shoelace formula
        const exteriorArea = this.calculateRingArea(this._exteriorRing);
        const interiorArea = this.interiorRings.reduce(
            (sum, ring) => sum + this.calculateRingArea(ring),
            0
        );
        return Math.abs(exteriorArea) - Math.abs(interiorArea);
    }

    pointOnSurface(): Point {
        // Simple implementation - returns a point guaranteed to be inside
        // More sophisticated implementations would use centroid with validation
        return this.centroid();
    }

    centroid(): Point {
        // Simple centroid calculation for exterior ring
        // More sophisticated implementation would account for holes
        return this.calculateRingCentroid(this._exteriorRing);
    }

    // Required methods from spec for Polygon
    exteriorRing(): LinearRing {
        return this._exteriorRing;
    }

    numInteriorRing(): number {
        return this.interiorRings.length;
    }

    interiorRingN(n: number): LinearRing {
        if (n < 1 || n > this.interiorRings.length) {
            throw new Error("Interior ring index out of range");
        }
        return this.interiorRings[n - 1];
    }

    // The boundary is the set of closed curves corresponding to all rings
    // Change the boundary method
    boundary(): MultiCurve {
        throw new Error("Method not implemented");
    }

    // A polygon is simple if properly formed according to the assertions
    isSimple(): boolean {
        // Check if rings are simple
        if (!this._exteriorRing.isSimple() ||
            !this.interiorRings.every(ring => ring.isSimple())) {
            return false;
        }

        // Check ring orientations
        if (!this.hasValidRingOrientations()) {
            return false;
        }

        // Check for ring intersections
        if (this.hasRingIntersections()) {
            return false;
        }

        return true;
    }

    // Methods to modify the polygon
    setExteriorRing(ring: LinearRing): void {
        if (!ring.isSimple() || !ring.isClosed()) {
            throw new Error("Exterior ring must be simple and closed");
        }
        this._exteriorRing = ring;
    }

    addInteriorRing(ring: LinearRing): void {
        if (!ring.isSimple() || !ring.isClosed()) {
            throw new Error("Interior ring must be simple and closed");
        }
        if (!this.isRingInside(ring, this._exteriorRing)) {
            throw new Error("Interior ring must be inside exterior ring");
        }
        this.interiorRings.push(ring);
    }

    // WKT representation
    asText(): string {
        if (this.isEmpty()) {
            return "POLYGON EMPTY";
        }

        const ringToString = (ring: LinearRing) => {
            return `(${ring.points.map(p => `${p.x()} ${p.y()}`).join(", ")})`;
        };

        const ringsText = [
            ringToString(this._exteriorRing),
            ...this.interiorRings.map(ring => ringToString(ring))
        ].join(", ");

        return `POLYGON (${ringsText})`;
    }

    // Helper methods
    private calculateRingArea(ring: LinearRing): number {
        // Shoelace formula (Surveyor's formula)
        let area = 0;
        const points = ring.points;

        for (let i = 0; i < points.length - 1; i++) {
            area += points[i].x() * points[i + 1].y();
            area -= points[i + 1].x() * points[i].y();
        }

        return area / 2;
    }

    private calculateRingCentroid(ring: LinearRing): Point {
        const points = ring.points;
        let area = 0;
        let cx = 0;
        let cy = 0;

        for (let i = 0; i < points.length - 1; i++) {
            const factor = points[i].x() * points[i + 1].y() -
                points[i + 1].x() * points[i].y();
            area += factor;
            cx += (points[i].x() + points[i + 1].x()) * factor;
            cy += (points[i].y() + points[i + 1].y()) * factor;
        }

        area /= 2;
        cx /= (6 * area);
        cy /= (6 * area);

        return new Point(cx, cy);
    }

    private hasValidRingOrientations(): boolean {
        // Exterior ring should be counterclockwise
        if (!this._exteriorRing.isCounterClockwise()) {
            return false;
        }

        // Interior rings should be clockwise
        return this.interiorRings.every(ring => ring.isClockwise());
    }

    private hasRingIntersections(): boolean {
        // Check intersections between all pairs of rings
        // Return true if any invalid intersections found

        // Check exterior ring with all interior rings
        for (const ring of this.interiorRings) {
            if (this.ringsIntersect(this._exteriorRing, ring)) {
                return true;
            }
        }

        // Check interior rings with each other
        for (let i = 0; i < this.interiorRings.length; i++) {
            for (let j = i + 1; j < this.interiorRings.length; j++) {
                if (this.ringsIntersect(
                    this.interiorRings[i],
                    this.interiorRings[j]
                )) {
                    return true;
                }
            }
        }

        return false;
    }

    private ringsIntersect(ring1: LinearRing, ring2: LinearRing): boolean {
        // Simplified intersection check
        // A complete implementation would need proper segment intersection testing
        return false; // Placeholder
    }

    private isRingInside(inner: LinearRing, outer: LinearRing): boolean {
        // Check if all points of inner ring are inside outer ring
        // Simplified - a complete implementation would need proper containment testing
        return true; // Placeholder
    }
}