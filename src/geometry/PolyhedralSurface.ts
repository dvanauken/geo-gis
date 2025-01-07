// PolyhedralSurface.ts
import { Surface } from "./Surface";
import { Polygon } from "./Polygon";
import { Point } from "./Point";
import { MultiCurve } from "./MultiCurve";
import { MultiLineString } from "./MultiLineString";
import { Geometry } from "./Geometry";
import { LineString } from "./LineString";

export class PolyhedralSurface extends Surface {
    polygons: Polygon[];

    constructor() {
        super();
        this.polygons = new Array<Polygon>();
    }

    // Required methods from Surface
    area(): number {
        return this.polygons.reduce((sum, polygon) => sum + polygon.area(), 0);
    }

    pointOnSurface(): Point {
        if (this.isEmpty()) {
            throw new Error("Cannot get point on empty PolyhedralSurface");
        }
        // Return point from first polygon (simple implementation)
        return this.polygons[0].pointOnSurface();
    }

    centroid(): Point {
        if (this.isEmpty()) {
            throw new Error("Cannot compute centroid of empty PolyhedralSurface");
        }

        // Weighted centroid calculation
        let totalArea = 0;
        let weightedX = 0;
        let weightedY = 0;

        this.polygons.forEach(polygon => {
            const area = polygon.area();
            const center = polygon.centroid();
            totalArea += area;
            weightedX += center.x() * area;
            weightedY += center.y() * area;
        });

        return new Point(weightedX / totalArea, weightedY / totalArea);
    }

    boundary(): MultiCurve {
        const multiCurve = new MultiLineString();
        
        // Get all edges and count occurrences
        const edgeMap = new Map<string, number>();
        
        this.polygons.forEach(polygon => {
            const edges = this.getPolygonEdges(polygon);
            edges.forEach(edge => {
                const edgeKey = this.getEdgeKey(edge.start, edge.end);
                edgeMap.set(edgeKey, (edgeMap.get(edgeKey) || 0) + 1);
            });
        });
    
        // Add edges that appear only once (boundary edges)
        edgeMap.forEach((count, edgeKey) => {
            if (count === 1) {
                const [start, end] = this.parseEdgeKey(edgeKey);
                const lineString = new LineString();  // Changed from MultiLineString to LineString
                lineString.addPoint(start);
                lineString.addPoint(end);
                multiCurve.addCurve(lineString);  // Changed from addLineString to addCurve
            }
        });
    
        return multiCurve as unknown as MultiCurve;  // Explicit cast to MultiCurve
    }

    // Override from Geometry
    geometryType(): string {
        return 'POLYHEDRALSURFACE';
    }

    isEmpty(): boolean {
        return this.polygons.length === 0;
    }

    equals(another: Geometry): boolean {
        if (!(another instanceof PolyhedralSurface)) {
            return false;
        }

        if (this.polygons.length !== another.polygons.length) {
            return false;
        }

        return this.polygons.every(polygon => 
            another.polygons.some(otherPolygon => polygon.equals(otherPolygon))
        );
    }

    // Methods specific to PolyhedralSurface
    numPatches(): number {
        return this.polygons.length;
    }

    patchN(n: number): Polygon {
        if (n < 1 || n > this.polygons.length) {
            throw new Error("Patch index out of range");
        }
        return this.polygons[n - 1];
    }

    addPatch(polygon: Polygon): void {
        if (!this.isValidNewPatch(polygon)) {
            throw new Error("Invalid patch: doesn't share proper boundary with existing patches");
        }
        this.polygons.push(polygon);
    }

    isClosed(): boolean {
        return this.boundary().isEmpty();
    }

    // WKT representation
    asText(): string {
        if (this.isEmpty()) {
            return "POLYHEDRALSURFACE EMPTY";
        }

        const patchesText = this.polygons
            .map(polygon => {
                // Remove "POLYGON" prefix and trim
                const polygonText = polygon.asText().replace("POLYGON ", "");
                return polygonText;
            })
            .join(", ");

        return `POLYHEDRALSURFACE (${patchesText})`;
    }

    // Helper methods
    private getPolygonEdges(polygon: Polygon): Array<{start: Point, end: Point}> {
        const edges: Array<{start: Point, end: Point}> = [];
        const ring = polygon.exteriorRing();
        
        for (let i = 0; i < ring.numPoints() - 1; i++) {
            edges.push({
                start: ring.pointN(i + 1),
                end: ring.pointN(i + 2)
            });
        }

        return edges;
    }

    private getEdgeKey(start: Point, end: Point): string {
        // Create a consistent key for an edge regardless of direction
        const [p1, p2] = this.orderPoints(start, end);
        return `${p1.x()},${p1.y()}-${p2.x()},${p2.y()}`;
    }

    private orderPoints(p1: Point, p2: Point): [Point, Point] {
        // Order points consistently based on coordinates
        if (p1.x() < p2.x() || (p1.x() === p2.x() && p1.y() < p2.y())) {
            return [p1, p2];
        }
        return [p2, p1];
    }

    private parseEdgeKey(key: string): [Point, Point] {
        const [start, end] = key.split('-');
        const [x1, y1] = start.split(',').map(Number);
        const [x2, y2] = end.split(',').map(Number);
        return [new Point(x1, y1), new Point(x2, y2)];
    }

    private isValidNewPatch(polygon: Polygon): boolean {
        if (this.isEmpty()) {
            return true;
        }

        // Check if the new polygon shares at least one edge with existing polygons
        const newEdges = this.getPolygonEdges(polygon);
        const existingEdges = this.polygons.flatMap(p => this.getPolygonEdges(p));

        return newEdges.some(newEdge => 
            existingEdges.some(existingEdge => 
                this.edgesAreEqual(newEdge, existingEdge)
            )
        );
    }

    private edgesAreEqual(edge1: {start: Point, end: Point}, 
                         edge2: {start: Point, end: Point}): boolean {
        return (edge1.start.equals(edge2.start) && edge1.end.equals(edge2.end)) ||
               (edge1.start.equals(edge2.end) && edge1.end.equals(edge2.start));
    }
}