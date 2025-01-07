// MultiLineString.ts
import { GeometryCollection } from "./GeometryCollection";
import { LineString } from "./LineString";
import { Geometry } from "./Geometry";
import { Point } from "./Point";
import { MultiPoint } from "./MultiPoint";

export class MultiLineString extends GeometryCollection<LineString> {
    addCurve(lineString: any) {
        throw new Error("Method not implemented.");
    }
    constructor() {
        super();
    }

    // Override from Geometry
    geometryType(): string {
        return 'MULTILINESTRING';
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    equals(another: Geometry): boolean {
        if (!(another instanceof MultiLineString)) {
            return false;
        }

        if (this.items.length !== another.items.length) {
            return false;
        }

        // Check if all LineStrings match (order doesn't matter)
        return this.items.every(lineString => 
            another.items.some(otherLineString => lineString.equals(otherLineString))
        );
    }

    // The boundary of a MultiLineString is the set of Points that are in
    // odd numbers of component boundaries
    boundary(): Geometry {
        if (this.isEmpty()) {
            return new Point();
        }

        // Count occurrences of each endpoint
        const pointCount = new Map<string, number>();
        
        this.items.forEach(lineString => {
            if (!lineString.isEmpty()) {
                const start = lineString.startPoint();
                const end = lineString.endPoint();
                
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

    // A MultiLineString is simple if all its LineStrings are simple and
    // the only intersections occur at Points that are boundary Points of LineStrings
    isSimple(): boolean {
        // Check if each LineString is simple
        if (!this.items.every(lineString => lineString.isSimple())) {
            return false;
        }

        // Check intersections between different LineStrings
        for (let i = 0; i < this.items.length; i++) {
            for (let j = i + 1; j < this.items.length; j++) {
                if (this.hasInvalidIntersection(this.items[i], this.items[j])) {
                    return false;
                }
            }
        }

        return true;
    }

    // Convenience methods
    addLineString(lineString: LineString): void {
        this.items.push(lineString);
    }

    lineStringN(n: number): LineString {
        if (n < 1 || n > this.items.length) {
            throw new Error("LineString index out of range");
        }
        return this.items[n - 1];
    }

    numLineStrings(): number {
        return this.items.length;
    }

    // Calculate total length of all LineStrings
    length(): number {
        return this.items.reduce((total, lineString) => 
            total + lineString.length(), 0);
    }

    // WKT representation
    asText(): string {
        if (this.isEmpty()) {
            return "MULTILINESTRING EMPTY";
        }

        const lineStringsText = this.items
            .map(lineString => {
                const pointsText = lineString.points
                    .map(p => `${p.x()} ${p.y()}`)
                    .join(", ");
                return `(${pointsText})`;
            })
            .join(", ");

        return `MULTILINESTRING ${lineStringsText}`;
    }

    // Helper method to check if two LineStrings intersect invalidly
    private hasInvalidIntersection(line1: LineString, line2: LineString): boolean {
        // Intersection is invalid if it occurs at non-boundary points
        // or if there are overlapping segments
        
        // This is a simplified check - a full implementation would need
        // more sophisticated geometric intersection testing
        for (let i = 0; i < line1.points.length - 1; i++) {
            for (let j = 0; j < line2.points.length - 1; j++) {
                const p1 = line1.points[i];
                const p2 = line1.points[i + 1];
                const p3 = line2.points[j];
                const p4 = line2.points[j + 1];

                if (this.segmentsIntersect(p1, p2, p3, p4)) {
                    // Check if intersection is at endpoints
                    const isEndpointIntersection = 
                        p1.equals(p3) || p1.equals(p4) ||
                        p2.equals(p3) || p2.equals(p4);

                    if (!isEndpointIntersection) {
                        return true;  // Invalid intersection found
                    }
                }
            }
        }

        return false;
    }

    // Helper method to check if two line segments intersect
    private segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
        // Using cross product method to determine intersection
        const ccw = (A: Point, B: Point, C: Point): number => {
            return (C.y() - A.y()) * (B.x() - A.x()) -
                   (B.y() - A.y()) * (C.x() - A.x());
        };

        const a = ccw(p1, p2, p3);
        const b = ccw(p1, p2, p4);
        const c = ccw(p3, p4, p1);
        const d = ccw(p3, p4, p2);

        if (((a > 0 && b < 0) || (a < 0 && b > 0)) &&
            ((c > 0 && d < 0) || (c < 0 && d > 0))) {
            return true;
        }

        return false;
    }
}