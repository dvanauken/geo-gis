// Triangle.ts
import { Polygon } from "./Polygon";
import { LinearRing } from "./LinearRing";
import { Point } from "./Point";
import { Geometry } from "./Geometry";

export class Triangle extends Polygon {
    constructor() {
        super();
        this._exteriorRing = new LinearRing();
        this.interiorRings = []; // Triangles cannot have interior rings
    }

    // Override from Geometry
    geometryType(): string {
        return 'TRIANGLE';
    }

    // Triangle-specific methods
    getVertices(): Point[] {
        if (this._exteriorRing.numPoints() < 4) { // 4 because first = last in LinearRing
            throw new Error("Invalid triangle: insufficient vertices");
        }
        // Return only the first 3 points (excluding the closing point)
        return [
            this._exteriorRing.pointN(1),
            this._exteriorRing.pointN(2),
            this._exteriorRing.pointN(3)
        ];
    }

    setVertices(p1: Point, p2: Point, p3: Point): void {
        if (this.areCollinear(p1, p2, p3)) {
            throw new Error("Invalid triangle: vertices are collinear");
        }

        const ring = new LinearRing();
        ring.addPoint(p1);
        ring.addPoint(p2);
        ring.addPoint(p3);
        ring.addPoint(p1); // Close the ring
        this._exteriorRing = ring;
    }

    // Override area calculation with more efficient triangle-specific formula
    area(): number {
        const vertices = this.getVertices();
        // Use shoelace formula for triangle
        return Math.abs(
            (vertices[0].x() * (vertices[1].y() - vertices[2].y()) +
             vertices[1].x() * (vertices[2].y() - vertices[0].y()) +
             vertices[2].x() * (vertices[0].y() - vertices[1].y())) / 2
        );
    }

    // Override centroid calculation with triangle-specific formula
    centroid(): Point {
        const vertices = this.getVertices();
        return new Point(
            (vertices[0].x() + vertices[1].x() + vertices[2].x()) / 3,
            (vertices[0].y() + vertices[1].y() + vertices[2].y()) / 3
        );
    }

    // Validation methods
    isValid(): boolean {
        if (this._exteriorRing.numPoints() !== 4) { // 4 points including closure
            return false;
        }

        const vertices = this.getVertices();
        return !this.areCollinear(vertices[0], vertices[1], vertices[2]);
    }

    // Point containment methods
    containsInInterior(point: Point): boolean {
        const vertices = this.getVertices();
        // Use barycentric coordinates to determine if point is inside
        return this.isPointInTriangle(point, vertices[0], vertices[1], vertices[2]);
    }

    // Helper methods
    private areCollinear(p1: Point, p2: Point, p3: Point): boolean {
        // Check if three points are collinear using cross product
        const crossProduct = (p2.x() - p1.x()) * (p3.y() - p1.y()) -
                           (p2.y() - p1.y()) * (p3.x() - p1.x());
        return Math.abs(crossProduct) < Number.EPSILON;
    }

    private isPointInTriangle(p: Point, v1: Point, v2: Point, v3: Point): boolean {
        // Compute barycentric coordinates
        const denominator = ((v2.y() - v3.y()) * (v1.x() - v3.x()) +
                           (v3.x() - v2.x()) * (v1.y() - v3.y()));
        
        const a = ((v2.y() - v3.y()) * (p.x() - v3.x()) +
                  (v3.x() - v2.x()) * (p.y() - v3.y())) / denominator;
        const b = ((v3.y() - v1.y()) * (p.x() - v3.x()) +
                  (v1.x() - v3.x()) * (p.y() - v3.y())) / denominator;
        const c = 1 - a - b;

        // Point is inside if all barycentric coordinates are between 0 and 1
        return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
    }

    // Triangle-specific geometric calculations
    getAngles(): number[] {
        const vertices = this.getVertices();
        return [
            this.calculateAngle(vertices[0], vertices[1], vertices[2]),
            this.calculateAngle(vertices[1], vertices[2], vertices[0]),
            this.calculateAngle(vertices[2], vertices[0], vertices[1])
        ];
    }

    private calculateAngle(p1: Point, p2: Point, p3: Point): number {
        const v1x = p2.x() - p1.x();
        const v1y = p2.y() - p1.y();
        const v2x = p3.x() - p1.x();
        const v2y = p3.y() - p1.y();

        const dot = v1x * v2x + v1y * v2y;
        const cross = v1x * v2y - v1y * v2x;

        return Math.atan2(cross, dot);
    }

    // Override addInteriorRing to prevent holes in triangles
    addInteriorRing(ring: LinearRing): void {
        throw new Error("Triangles cannot have interior rings");
    }

    // WKT representation
    asText(): string {
        if (this.isEmpty()) {
            return "TRIANGLE EMPTY";
        }

        const vertices = this.getVertices();
        const pointsText = vertices
            .map(p => `${p.x()} ${p.y()}`)
            .join(", ");

        return `TRIANGLE ((${pointsText}, ${vertices[0].x()} ${vertices[0].y()}))`;
    }
}