import { Point } from '../base/Point';
import { CoordinateSystem } from '../base/CoordinateSystem';
import { Geometry } from '../base/Geometry';
import { ICloseable } from '../base/ICloseable';

/**
 * Abstract base class for all curve geometries.
 * A curve is a one-dimensional geometric object usually stored as a sequence of points.
 */
export abstract class Curve implements Geometry, ICloseable {
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
    public abstract isEmpty(): boolean;
    public abstract is3D(): boolean;

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

    public abstract getGeometryType(): string;
    public abstract equals(other: Geometry): boolean;
    public abstract clone(): Curve;
    public abstract asWKT(): string;
    
    // ICloseable interface implementation
    public abstract isClosed(): boolean;

    // Basic curve operations
    /**
     * Gets the start point of the curve.
     */
    public abstract getStartPoint(): Point;

    /**
     * Gets the end point of the curve.
     */
    public abstract getEndPoint(): Point;

    /**
     * Gets all points that define the curve.
     */
    public abstract getPoints(): Point[];

    /**
     * Gets the number of points in the curve.
     */
    public abstract getNumPoints(): number;

    /**
     * Gets the point at the specified index.
     * @param n Index of the point
     */
    public abstract getPointN(n: number): Point;

    /**
     * Gets the length of the curve.
     */
    public abstract getLength(): number;

    /**
     * Gets a point at a specified distance along the curve.
     * @param distance Distance along the curve
     * @returns Point at the specified distance, or null if distance is invalid
     */
    public abstract getPointAtDistance(distance: number): Point | null;

    /**
     * Gets a point at a specified parameter value.
     * @param parameter Parameter value between 0 and 1
     * @returns Point at the specified parameter value, or null if parameter is invalid
     */
    public abstract getPointAtParameter(parameter: number): Point | null;

    /**
     * Gets the parameter value for a point on the curve.
     * @param point Point to find parameter for
     * @returns Parameter value between 0 and 1, or null if point is not on curve
     */
    public abstract getParameterAtPoint(point: Point): number | null;

    /**
     * Gets the distance of a point to the curve.
     * @param point Point to measure distance to
     */
    public abstract getDistanceToPoint(point: Point): number;

    /**
     * Gets the closest point on the curve to a given point.
     * @param point Point to find closest point to
     */
    public abstract getClosestPoint(point: Point): Point;

    /**
     * Gets a subcurve between two parameter values.
     * @param startParam Start parameter (0 to 1)
     * @param endParam End parameter (0 to 1)
     */
    public abstract getSubCurve(startParam: number, endParam: number): Curve;

    /**
     * Gets the tangent vector at a parameter value.
     * @param parameter Parameter value between 0 and 1
     * @returns Unit tangent vector or null if parameter is invalid
     */
    public abstract getTangentAtParameter(parameter: number): Point | null;

    /**
     * Gets the curvature at a parameter value.
     * @param parameter Parameter value between 0 and 1
     * @returns Curvature value or null if parameter is invalid
     */
    public abstract getCurvatureAtParameter(parameter: number): number | null;

    /**
     * Creates an offset curve.
     * @param distance Offset distance (positive for left, negative for right)
     */
    public abstract getOffsetCurve(distance: number): Curve;

    /**
     * Reverses the direction of the curve.
     */
    public abstract reverse(): Curve;

    /**
     * Interpolates a point between two parameters.
     * @param parameter1 First parameter value (0 to 1)
     * @param parameter2 Second parameter value (0 to 1)
     * @param t Interpolation factor (0 to 1)
     */
    public interpolate(parameter1: number, parameter2: number, t: number): Point | null {
        const p1 = this.getPointAtParameter(parameter1);
        const p2 = this.getPointAtParameter(parameter2);
        
        if (!p1 || !p2) return null;

        return new Point(
            p1.getX() + (p2.getX() - p1.getX()) * t,
            p1.getY() + (p2.getY() - p1.getY()) * t,
            p1.is3D() ? p1.getZ()! + (p2.getZ()! - p1.getZ()!) * t : undefined
        );
    }

    /**
     * Tests if a point lies on the curve within a tolerance.
     * @param point Point to test
     * @param tolerance Distance tolerance
     */
    public isPointOnCurve(point: Point, tolerance: number = 1e-10): boolean {
        return this.getDistanceToPoint(point) <= tolerance;
    }

    /**
     * Gets the coordinate system type
     */
    public getCoordinateSystem(): CoordinateSystem {
        return this.coordinateSystem;
    }

    /**
     * Tests if this curve contains a point
     */
    public contains(point: Point): boolean {
        return this.isPointOnCurve(point);
    }

    /**
     * Validates the curve geometry
     * @returns Array of validation errors, empty if valid
     */
    public abstract validate(): string[];
}