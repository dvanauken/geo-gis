import { Geometry } from "./Geometry";
import { Point } from "./Point";
import { MultiPoint } from "./MultiPoint";

export abstract class Curve extends Geometry {
    constructor() {
        super();
    }

    // Returns the length of this Curve in its associated spatial reference
    abstract length(): number;

    // Returns the start Point of this Curve
    abstract startPoint(): Point;

    // Returns the end Point of this Curve
    abstract endPoint(): Point;

    // Returns true if this Curve is closed (start point = end point)
    isClosed(): boolean {
        return !this.isEmpty() && this.startPoint().equals(this.endPoint());
    }

    // Returns true if this Curve is closed AND simple
    isRing(): boolean {
        return this.isClosed() && this.isSimple();
    }

    // Override from Geometry
    geometryType(): string {
        return 'CURVE';
    }

    // A Curve is simple if it does not pass through the same Point twice
    // with possible exception of start/end points
    isSimple(): boolean {
        // Abstract base implementation
        // Subclasses should override with specific checks
        return true;
    }

    // The boundary of a Curve consists of its endpoints
    // If the curve is closed, its boundary is empty
    boundary(): Geometry {
        if (this.isEmpty() || this.isClosed()) {
            return new Point(); // Empty point as boundary
        }
        
        // For non-closed curves, boundary consists of endpoints
        const multiPoint = new MultiPoint();
        multiPoint.addPoint(this.startPoint());
        multiPoint.addPoint(this.endPoint());
        return multiPoint;
    }

    // Additional utility methods

    // Returns true if this curve contains the given point
    contains(point: Point): boolean {
        // Basic implementation - subclasses should provide more efficient versions
        return this.distanceToPoint(point) === 0;
    }

    // Calculates distance from curve to a point
    distanceToPoint(point: Point): number {
        // Abstract base implementation
        // Subclasses should override with specific distance calculations
        throw new Error("Method not implemented");
    }

    // Returns true if curve is self-intersecting
    hasSelfIntersections(): boolean {
        // Abstract base implementation
        // Subclasses should override with specific intersection checks
        throw new Error("Method not implemented");
    }

    // Returns true if this curve is continuous
    isContinuous(): boolean {
        // Basic curves are continuous by default
        // Subclasses might override for special cases
        return !this.isEmpty();
    }

    // Orientation check (useful for curves used in surface boundaries)
    isCounterClockwise(): boolean {
        // Abstract base implementation
        // Subclasses should override with specific orientation checks
        throw new Error("Method not implemented");
    }

    // Point interpolation along curve
    interpolatePoint(distance: number): Point {
        // Abstract base implementation
        // Subclasses should override with specific interpolation algorithms
        throw new Error("Method not implemented");
    }
}