// MultiPolygon.ts
import { GeometryCollection } from "./GeometryCollection";
import { Polygon } from "./Polygon";
import { Geometry } from "./Geometry";
import { Point } from "./Point";

export class MultiPolygon extends GeometryCollection<Polygon> {
    constructor() {
        super();
    }

    // Override from Geometry
    geometryType(): string {
        return 'MULTIPOLYGON';
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    equals(another: Geometry): boolean {
        if (!(another instanceof MultiPolygon)) {
            return false;
        }

        if (this.items.length !== another.items.length) {
            return false;
        }

        // Check if all polygons match (order doesn't matter)
        return this.items.every(polygon => 
            another.items.some(otherPolygon => polygon.equals(otherPolygon))
        );
    }

    // Surface-like methods
    area(): number {
        return this.items.reduce((sum, polygon) => sum + polygon.area(), 0);
    }

    centroid(): Point {
        if (this.isEmpty()) {
            throw new Error("Cannot compute centroid of empty MultiPolygon");
        }

        // Weighted centroid calculation
        let totalArea = 0;
        let weightedX = 0;
        let weightedY = 0;

        this.items.forEach(polygon => {
            const area = polygon.area();
            const center = polygon.centroid();
            totalArea += area;
            weightedX += center.x() * area;
            weightedY += center.y() * area;
        });

        return new Point(weightedX / totalArea, weightedY / totalArea);
    }

    pointOnSurface(): Point {
        if (this.isEmpty()) {
            throw new Error("Cannot compute point on empty MultiPolygon");
        }
        // Returns a point from the polygon with largest area
        let maxArea = -1;
        let selectedPoint: Point | null = null;

        this.items.forEach(polygon => {
            const area = polygon.area();
            if (area > maxArea) {
                maxArea = area;
                selectedPoint = polygon.pointOnSurface();
            }
        });

        return selectedPoint!;
    }

    // MultiPolygon-specific methods
    addPolygon(polygon: Polygon): void {
        if (!this.isValidNewPolygon(polygon)) {
            throw new Error("Invalid polygon: intersects with existing polygons");
        }
        this.items.push(polygon);
    }

    polygonN(n: number): Polygon {
        if (n < 1 || n > this.items.length) {
            throw new Error("Polygon index out of range");
        }
        return this.items[n - 1];
    }

    numPolygons(): number {
        return this.items.length;
    }

    // A MultiPolygon is simple if all its polygons are simple and
    // the interiors of no two polygons intersect
    isSimple(): boolean {
        // Check if each polygon is simple
        if (!this.items.every(polygon => polygon.isSimple())) {
            return false;
        }

        // Check for intersections between different polygons
        for (let i = 0; i < this.items.length; i++) {
            for (let j = i + 1; j < this.items.length; j++) {
                if (this.polygonsIntersect(this.items[i], this.items[j])) {
                    return false;
                }
            }
        }

        return true;
    }

    // WKT representation
    asText(): string {
        if (this.isEmpty()) {
            return "MULTIPOLYGON EMPTY";
        }

        const polygonsText = this.items
            .map(polygon => {
                // Remove "POLYGON" prefix and trim
                const polygonText = polygon.asText().replace("POLYGON ", "");
                return polygonText;
            })
            .join(", ");

        return `MULTIPOLYGON (${polygonsText})`;
    }

    // Helper methods
    private isValidNewPolygon(polygon: Polygon): boolean {
        // Check if the new polygon intersects with any existing polygons
        return !this.items.some(existingPolygon => 
            this.polygonsIntersect(polygon, existingPolygon)
        );
    }

    private polygonsIntersect(poly1: Polygon, poly2: Polygon): boolean {
        // This is a simplified check - a full implementation would need
        // proper geometric intersection testing between polygons
        
        // For now, we'll just check if any vertex of one polygon
        // lies inside the other polygon
        const vertices1 = this.getPolygonVertices(poly1);
        const vertices2 = this.getPolygonVertices(poly2);

        return vertices1.some(vertex => poly2.contains(vertex)) ||
               vertices2.some(vertex => poly1.contains(vertex));
    }

    private getPolygonVertices(polygon: Polygon): Point[] {
        const vertices: Point[] = [];
        
        // Get points from exterior ring
        const exteriorRing = polygon.exteriorRing();
        for (let i = 0; i < exteriorRing.numPoints(); i++) {
            vertices.push(exteriorRing.pointN(i + 1));
        }

        // Get points from interior rings
        for (let i = 0; i < polygon.numInteriorRing(); i++) {
            const ring = polygon.interiorRingN(i + 1);
            for (let j = 0; j < ring.numPoints(); j++) {
                vertices.push(ring.pointN(j + 1));
            }
        }

        return vertices;
    }
}