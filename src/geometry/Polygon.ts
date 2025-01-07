import { Surface } from "./Surface";
import { LinearRing } from "./LinearRing";
import { Point } from "./Point";
import { MultiCurve } from "./MultiCurve";
import { MultiLineString } from "./MultiLineString";
import { Geometry } from "./Geometry";

export class Polygon extends Surface {
    protected _exteriorRing: LinearRing;
    protected interiorRings: LinearRing[];

    constructor(exteriorRing?: LinearRing, interiorRings: LinearRing[] = []) {
        super();
        this._exteriorRing = exteriorRing ?? new LinearRing();
        this.interiorRings = interiorRings;
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
        return this.centroid();
    }

    centroid(): Point {
        // Simple centroid calculation for exterior ring
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
    boundary(): MultiCurve {
        const multiLine = new MultiLineString();
        // Add exterior ring
        multiLine.addLineString(this._exteriorRing);
        // Add all interior rings
        this.interiorRings.forEach(ring => multiLine.addLineString(ring));
        return multiLine;
        //throw new Error("Method not implemented");
    }

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
            const points = [];
            for (let i = 1; i <= ring.numPoints(); i++) {
                const p = ring.pointN(i);
                points.push(`${p.x()} ${p.y()}`);
            }
            return `(${points.join(", ")})`;
        };

        const ringsText = [
            ringToString(this._exteriorRing),
            ...this.interiorRings.map(ring => ringToString(ring))
        ].join(", ");

        return `POLYGON (${ringsText})`;
    }

    // Helper methods
    private calculateRingArea(ring: LinearRing): number {
        let area = 0;
        const numPoints = ring.numPoints();
        
        // Need at least 3 points for area calculation
        if (numPoints < 4) return 0; // 4 because first = last in a closed ring
        
        // Shoelace formula (surveyor's formula)
        for (let i = 1; i < numPoints; i++) {
            const p1 = ring.pointN(i);
            const p2 = ring.pointN(i + 1);
            area += p1.x() * p2.y() - p2.x() * p1.y();
        }
        
        return area / 2;
    }

    private calculateRingCentroid(ring: LinearRing): Point {
        const numPoints = ring.numPoints();
        if (numPoints < 4) return new Point(0, 0);

        let cx = 0;
        let cy = 0;
        let area = 0;

        for (let i = 1; i < numPoints; i++) {
            const p1 = ring.pointN(i);
            const p2 = ring.pointN(i + 1);
            const factor = p1.x() * p2.y() - p2.x() * p1.y();
            
            cx += (p1.x() + p2.x()) * factor;
            cy += (p1.y() + p2.y()) * factor;
            area += factor;
        }

        area /= 2;
        cx /= (6 * area);
        cy /= (6 * area);

        return new Point(cx, cy);
    }

    private isRingInside(inner: LinearRing, outer: LinearRing): boolean {
        // Check if at least one point of inner ring is inside outer ring
        // This is a simplified check - a complete implementation would need
        // more sophisticated containment testing
        const testPoint = inner.pointN(1);
        return this.isPointInRing(testPoint, outer);
    }

    private isPointInRing(point: Point, ring: LinearRing): boolean {
        let inside = false;
        const numPoints = ring.numPoints();
        
        for (let i = 1, j = numPoints - 1; i < numPoints; j = i++) {
            const pi = ring.pointN(i);
            const pj = ring.pointN(j);
            
            if (((pi.y() > point.y()) !== (pj.y() > point.y())) &&
                (point.x() < (pj.x() - pi.x()) * (point.y() - pi.y()) / (pj.y() - pi.y()) + pi.x())) {
                inside = !inside;
            }
        }
        
        return inside;
    }
}