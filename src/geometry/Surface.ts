// Surface.ts
import { Geometry } from "./Geometry";
import { Point } from "./Point";
import { MultiCurve } from "./MultiCurve";
import { LineString } from "./LineString"; // Add this for ray creation
import { Curve } from "./Curve";

export abstract class Surface extends Geometry {
    constructor() {
        super();
    }

    // Required abstract methods
    abstract area(): number;
    abstract pointOnSurface(): Point;
    abstract centroid(): Point;
    abstract boundary(): MultiCurve;

    // Override from Geometry
    geometryType(): string {
        return 'SURFACE';
    }

    // Default implementation for surfaces
    isEmpty(): boolean {
        return this.area() === 0;
    }

    isSimple(): boolean {
        return true;
    }

    // Surface-specific methods
    isRegular(): boolean {
        return true;
    }

    isPlanar(): boolean {
        return true;
    }

    hasInteriorRings(): boolean {
        return false;
    }

    // Point containment check
    contains(point: Point): boolean {
        if (this.isEmpty()) {
            return false;
        }

        // Check if point is on the boundary
        if (this.isPointOnBoundary(point)) {
            return true;
        }

        // If not on boundary, check interior
        return this.isPointInInterior(point);
    }

    // Helper method to check if point is on boundary
    protected isPointOnBoundary(point: Point): boolean {
        // Get the boundary curves
        const boundaryMultiCurve = this.boundary();
        
        // Check each curve in the boundary
        for (let i = 0; i < boundaryMultiCurve.numGeometries(); i++) {
            const curve = boundaryMultiCurve.geometryN(i);
            if (curve.contains(point)) {
                return true;
            }
        }
        
        return false;
    }

    // Helper method to check if point is in the interior
    protected isPointInInterior(point: Point): boolean {
        // Ray casting algorithm implementation
        let intersectionCount = 0;
        const boundaryMultiCurve = this.boundary();

        // Create horizontal ray from point
        const ray = this.createRayFromPoint(point);

        // Count intersections with boundary
        for (let i = 0; i < boundaryMultiCurve.numGeometries(); i++) {
            const curve = boundaryMultiCurve.geometryN(i);
            if (this.rayIntersectsCurve(ray, curve)) {
                intersectionCount++;
            }
        }

        // Point is inside if number of intersections is odd
        return (intersectionCount % 2) === 1;
    }

    // Helper method to create a ray for point-in-polygon testing
    protected createRayFromPoint(point: Point): LineString {
        // Create a horizontal ray extending to the right
        const rayEnd = new Point(point.x() + this.calculateRayLength(), point.y());
        const ray = new LineString();
        ray.addPoint(point);
        ray.addPoint(rayEnd);
        return ray;
    }

    // Helper method to calculate appropriate ray length
    private calculateRayLength(): number {
        // Calculate a ray length that extends beyond the surface's bounds
        // This is a simple implementation - could be made more sophisticated
        return 1000000; // Large enough to extend beyond typical surface bounds
    }

    // Helper method to check ray-curve intersection
    private rayIntersectsCurve(ray: LineString, curve: Curve): boolean {
        // Basic implementation - could be made more sophisticated
        // Returns true if the ray intersects the curve
        // This would need proper geometric intersection testing
        return false; // Placeholder
    }
}