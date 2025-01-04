import { Point, Geometry, CoordinateSystem } from '../base/Point';

/**
 * Type representing a point with interpolation parameter
 */
interface ParametricPoint {
    point: Point;
    parameter: number; // Value between 0 and 1
}

/**
 * Abstract base class for all curve geometries
 * Represents a continuous path in coordinate space
 */
abstract class Curve implements Geometry {
    protected srid: number;
    protected readonly coordinateSystem: CoordinateSystem;

    constructor(
        srid: number = 0,
        coordinateSystem: CoordinateSystem = CoordinateSystem.CARTESIAN_2D
    ) {
        this.srid = srid;
        this.coordinateSystem = coordinateSystem;
    }
    
    // Geometry interface implementation
    abstract isEmpty(): boolean;
    abstract is3D(): boolean;

    public dimension(): number {
        return 1; // Curves are 1-dimensional
    }

    public getSRID(): number {
        return this.srid;
    }

    public setSRID(srid: number): void {
        if (srid < 0) {
            throw new Error('SRID must be non-negative');
        }
        this.srid = srid;
    }

    abstract getGeometryType(): string;
    abstract equals(other: Geometry): boolean;

    // Abstract methods specific to curves
    /**
     * Gets the starting point of the curve
     */
    abstract getStartPoint(): Point;

    /**
     * Gets the ending point of the curve
     */
    abstract getEndPoint(): Point;

    /**
     * Gets the length of the curve
     */
    abstract getLength(): number;

    /**
     * Gets a point at a specific distance along the curve
     * @param distance Distance along the curve
     * @returns Point at the specified distance or null if distance is invalid
     */
    abstract getPointAtDistance(distance: number): Point | null;

    /**
     * Gets a point at a specific parametric value (0 to 1)
     * @param parameter Value between 0 and 1
     * @returns Point at the specified parameter or null if parameter is invalid
     */
    abstract getPointAtParameter(parameter: number): Point | null;

    /**
     * Gets the parameter value for a point on the curve
     * @param point Point to find parameter for
     * @returns Parameter value (0 to 1) or null if point is not on curve
     */
    abstract getParameterAtPoint(point: Point): number | null;

    /**
     * Tests if the curve is closed (start point equals end point)
     */
    abstract isClosed(): boolean;

    /**
     * Gets the points that define the curve
     */
    abstract getPoints(): Point[];

    /**
     * Gets the distance along the curve to a given point
     * @param point Point to measure to
     * @returns Distance along curve or null if point is not on curve
     */
    getDistanceToPoint(point: Point): number | null {
        const param = this.getParameterAtPoint(point);
        if (param === null) {
            return null;
        }
        return param * this.getLength();
    }

    /**
     * Gets a subcurve between two parameters
     * @param startParam Start parameter (0 to 1)
     * @param endParam End parameter (0 to 1)
     * @returns New curve representing the subcurve
     */
    abstract getSubCurve(startParam: number, endParam: number): Curve;

    /**
     * Gets the tangent vector at a given parameter
     * @param parameter Value between 0 and 1
     * @returns Direction vector or null if parameter is invalid
     */
    abstract getTangentAtParameter(parameter: number): Point | null;

    /**
     * Gets the curvature at a given parameter
     * @param parameter Value between 0 and 1
     * @returns Curvature value or null if parameter is invalid
     */
    abstract getCurvatureAtParameter(parameter: number): number | null;

    /**
     * Gets a series of points along the curve at regular parameter intervals
     * @param numPoints Number of points to generate
     */
    getRegularPoints(numPoints: number): Point[] {
        if (numPoints < 2) {
            throw new Error('Number of points must be at least 2');
        }

        const points: Point[] = [];
        for (let i = 0; i < numPoints; i++) {
            const param = i / (numPoints - 1);
            const point = this.getPointAtParameter(param);
            if (point) {
                points.push(point);
            }
        }
        return points;
    }

    /**
     * Gets a series of points along the curve at regular distance intervals
     * @param spacing Distance between points
     */
    getEvenlySpacedPoints(spacing: number): Point[] {
        if (spacing <= 0) {
            throw new Error('Spacing must be positive');
        }

        const length = this.getLength();
        const numPoints = Math.floor(length / spacing) + 1;
        const points: Point[] = [];

        for (let i = 0; i < numPoints; i++) {
            const distance = i * spacing;
            const point = this.getPointAtDistance(distance);
            if (point) {
                points.push(point);
            }
        }

        // Add end point if not already included
        const lastPoint = this.getEndPoint();
        if (points.length > 0 && !points[points.length - 1].equals(lastPoint)) {
            points.push(lastPoint);
        }

        return points;
    }

    /**
     * Computes offset curve (parallel curve)
     * @param distance Offset distance (positive for left, negative for right)
     */
    abstract getOffsetCurve(distance: number): Curve;

    /**
     * Gets closest point on curve to a given point
     * @param point Point to find closest point to
     * @returns Closest point and its parameter value
     */
    abstract getClosestPoint(point: Point): ParametricPoint;

    /**
     * Tests if a point is on the curve
     * @param point Point to test
     * @param tolerance Distance tolerance
     */
    isPointOnCurve(point: Point, tolerance: number = 1e-10): boolean {
        const closest = this.getClosestPoint(point);
        return point.distanceTo(closest.point) <= tolerance;
    }

    /**
     * Gets the normal vector at a given parameter
     * Only valid for planar curves
     * @param parameter Value between 0 and 1
     */
    getNormalAtParameter(parameter: number): Point | null {
        const tangent = this.getTangentAtParameter(parameter);
        if (!tangent) {
            return null;
        }
        // Rotate tangent 90 degrees counterclockwise
        return new Point(-tangent.getY(), tangent.getX());
    }

    /**
     * Projects a point onto the curve
     * @param point Point to project
     * @returns Projected point and its parameter value
     */
    projectPoint(point: Point): ParametricPoint {
        return this.getClosestPoint(point);
    }

    /**
     * Gets the coordinate system type
     */
    getCoordinateSystem(): CoordinateSystem {
        return this.coordinateSystem;
    }

    /**
     * Validates the curve geometry
     * @returns Array of validation errors, empty if valid
     */
    abstract validate(): string[];

    /**
     * Smooths the curve using a specified algorithm
     * @param tolerance Smoothing tolerance
     */
    abstract smooth(tolerance: number): Curve;

    /**
     * Splits the curve at specified parameters
     * @param parameters Array of parameter values (0 to 1)
     * @returns Array of subcurves
     */
    split(parameters: number[]): Curve[] {
        if (parameters.length === 0) {
            return [this];
        }

        // Sort and validate parameters
        const sortedParams = [...new Set(parameters)]
            .filter(p => p > 0 && p < 1)
            .sort((a, b) => a - b);

        // Add start and end parameters
        const allParams = [0, ...sortedParams, 1];

        // Create subcurves
        const curves: Curve[] = [];
        for (let i = 0; i < allParams.length - 1; i++) {
            curves.push(this.getSubCurve(allParams[i], allParams[i + 1]));
        }

        return curves;
    }

    /**
     * Reverses the direction of the curve
     */
    abstract reverse(): Curve;

    /**
     * Creates a deep copy of the curve
     */
    abstract clone(): Curve;

    asWKT(): string {
        throw new Error('Method not implemented.');
    }

}

export { Curve, ParametricPoint };