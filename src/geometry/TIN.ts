// TIN.ts
import { PolyhedralSurface } from "./PolyhedralSurface";
import { Triangle } from "./Triangle";
import { Point } from "./Point";
import { Geometry } from "./Geometry";

export class TIN extends PolyhedralSurface {
    triangles: Triangle[];

    constructor() {
        super();
        this.triangles = new Array<Triangle>();
    }

    // Override from Geometry
    geometryType(): string {
        return 'TIN';
    }

    isEmpty(): boolean {
        return this.triangles.length === 0;
    }

    equals(another: Geometry): boolean {
        if (!(another instanceof TIN)) {
            return false;
        }

        if (this.triangles.length !== another.triangles.length) {
            return false;
        }

        return this.triangles.every(triangle => 
            another.triangles.some(otherTriangle => triangle.equals(otherTriangle))
        );
    }

    // TIN-specific methods
    numTriangles(): number {
        return this.triangles.length;
    }

    triangleN(n: number): Triangle {
        if (n < 1 || n > this.triangles.length) {
            throw new Error("Triangle index out of range");
        }
        return this.triangles[n - 1];
    }

    addTriangle(triangle: Triangle): void {
        if (!this.isValidNewTriangle(triangle)) {
            throw new Error("Invalid triangle: does not meet TIN requirements");
        }
        this.triangles.push(triangle);
        this.polygons.push(triangle); // Also add to base PolyhedralSurface polygons
    }

    // Find neighboring triangles for a given triangle
    getNeighbors(triangle: Triangle): Triangle[] {
        return this.triangles.filter(other => 
            other !== triangle && this.trianglesAreAdjacent(triangle, other)
        );
    }

    // Get the triangle containing a point
    getTriangleContaining(point: Point): Triangle | null {
        return this.triangles.find(triangle => triangle.contains(point)) || null;
    }

    // WKT representation
    asText(): string {
        if (this.isEmpty()) {
            return "TIN EMPTY";
        }

        const trianglesText = this.triangles
            .map(triangle => {
                const triangleText = triangle.asText().replace("POLYGON ", "");
                return triangleText;
            })
            .join(", ");

        return `TIN (${trianglesText})`;
    }

    // Helper methods
    private isValidNewTriangle(triangle: Triangle): boolean {
        if (!triangle.isValid()) {
            return false;
        }

        if (this.isEmpty()) {
            return true;
        }

        const hasSharedEdge = this.triangles.some(existing => 
            this.trianglesAreAdjacent(triangle, existing)
        );

        const hasIntersection = this.triangles.some(existing => 
            this.trianglesIntersect(triangle, existing)
        );

        return hasSharedEdge && !hasIntersection;
    }

    private trianglesAreAdjacent(t1: Triangle, t2: Triangle): boolean {
        const edges1 = this.getTriangleEdges(t1);
        const edges2 = this.getTriangleEdges(t2);

        return edges1.some(edge1 => 
            edges2.some(edge2 => this.compareEdges(edge1, edge2))
        );
    }

    private getTriangleEdges(triangle: Triangle): Array<{start: Point, end: Point}> {
        const vertices = triangle.getVertices();
        return [
            { start: vertices[0], end: vertices[1] },
            { start: vertices[1], end: vertices[2] },
            { start: vertices[2], end: vertices[0] }
        ];
    }

    // Renamed from edgesAreEqual to compareEdges to avoid collision
    private compareEdges(edge1: {start: Point, end: Point}, 
                        edge2: {start: Point, end: Point}): boolean {
        return (edge1.start.equals(edge2.start) && edge1.end.equals(edge2.end)) ||
               (edge1.start.equals(edge2.end) && edge1.end.equals(edge2.start));
    }

    private trianglesIntersect(t1: Triangle, t2: Triangle): boolean {
        const vertices1 = t1.getVertices();
        const vertices2 = t2.getVertices();

        return vertices1.some(v => t2.containsInInterior(v)) ||
               vertices2.some(v => t1.containsInInterior(v));
    }

    // Surface analysis methods
    getSlope(triangle: Triangle): number {
        throw new Error("Method not implemented");
    }

    getAspect(triangle: Triangle): number {
        throw new Error("Method not implemented");
    }

    interpolateHeight(point: Point): number {
        throw new Error("Method not implemented");
    }
}