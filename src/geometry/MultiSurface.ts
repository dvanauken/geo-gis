// MultiSurface.ts
import { GeometryCollection } from "./GeometryCollection";
import { Surface } from "./Surface";
import { Geometry } from "./Geometry";
import { Point } from "./Point";

export class MultiSurface extends GeometryCollection<Surface> {
    constructor() {
        super();
    }

    // Override from Geometry
    geometryType(): string {
        return 'MULTISURFACE';
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    equals(another: Geometry): boolean {
        if (!(another instanceof MultiSurface)) {
            return false;
        }
        if (this.items.length !== another.items.length) {
            return false;
        }
        return this.items.every(surface => 
            another.items.some(otherSurface => surface.equals(otherSurface))
        );
    }

    // Required Surface-like methods
    area(): number {
        return this.items.reduce((sum, surface) => sum + surface.area(), 0);
    }

    centroid(): Point {
        if (this.isEmpty()) {
            throw new Error("Cannot compute centroid of empty MultiSurface");
        }

        // Weighted centroid calculation based on area
        let totalArea = 0;
        let weightedX = 0;
        let weightedY = 0;

        this.items.forEach(surface => {
            const area = surface.area();
            const center = surface.centroid();
            totalArea += area;
            weightedX += center.x() * area;
            weightedY += center.y() * area;
        });

        return new Point(weightedX / totalArea, weightedY / totalArea);
    }

    pointOnSurface(): Point {
        if (this.isEmpty()) {
            throw new Error("Cannot compute point on empty MultiSurface");
        }

        // Returns a point from the surface with largest area
        let maxArea = -1;
        let selectedPoint: Point | null = null;

        this.items.forEach(surface => {
            const area = surface.area();
            if (area > maxArea) {
                maxArea = area;
                selectedPoint = surface.pointOnSurface();
            }
        });

        return selectedPoint!;
    }

    // Collection-specific methods
    numSurfaces(): number {
        return this.items.length;
    }

    surfaceN(n: number): Surface {
        if (n < 1 || n > this.items.length) {
            throw new Error("Surface index out of range");
        }
        return this.items[n - 1];
    }

    addSurface(surface: Surface): void {
        if (!this.isValidNewSurface(surface)) {
            throw new Error("Invalid surface: intersects with existing surfaces");
        }
        this.items.push(surface);
    }

    // A MultiSurface is simple if all its surfaces are simple and
    // the interiors of no two surfaces intersect
    isSimple(): boolean {
        // Check if each surface is simple
        if (!this.items.every(surface => surface.isSimple())) {
            return false;
        }

        // Check for intersections between different surfaces
        for (let i = 0; i < this.items.length; i++) {
            for (let j = i + 1; j < this.items.length; j++) {
                if (this.surfacesIntersect(this.items[i], this.items[j])) {
                    return false;
                }
            }
        }

        return true;
    }

    // The boundary of a MultiSurface is the union of the boundaries of its elements
    boundary(): Geometry {
        if (this.isEmpty()) {
            return new Point(); // Empty point as boundary
        }

        // Collect all boundaries
        const boundaries = this.items.map(surface => surface.boundary());

        // TODO: Implement proper boundary union
        // For now, return the first non-empty boundary
        for (const boundary of boundaries) {
            if (!boundary.isEmpty()) {
                return boundary;
            }
        }

        return new Point(); // Empty point if no non-empty boundaries found
    }

    // WKT representation
    asText(): string {
        if (this.isEmpty()) {
            return "MULTISURFACE EMPTY";
        }
        const surfacesText = this.items
            .map(surface => {
                // Remove prefix and trim
                const surfaceText = surface.asText().replace(/^[A-Z]+\s/, "");
                return surfaceText;
            })
            .join(", ");
        return `MULTISURFACE (${surfacesText})`;
    }

    // Helper methods
    private isValidNewSurface(surface: Surface): boolean {
        // Check if the new surface intersects with any existing surfaces
        return !this.items.some(existingSurface => 
            this.surfacesIntersect(surface, existingSurface)
        );
    }

    private surfacesIntersect(surface1: Surface, surface2: Surface): boolean {
        // This is a simplified check
        // A full implementation would need proper geometric intersection testing
        
        // For now, just check if either surface contains points from the other's boundary
        const boundary1 = surface1.boundary();
        const boundary2 = surface2.boundary();

        // Simple test using pointOnSurface - not fully accurate but a basic check
        const point1 = surface1.pointOnSurface();
        const point2 = surface2.pointOnSurface();

        return surface1.contains(point2) || surface2.contains(point1);
    }
}