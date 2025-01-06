import { Point, Geometry, CoordinateSystem } from '../base/Point';
import { Curve } from './Curve';
import { Polygon } from './Polygon';

/**
 * Interface representing a point with surface parameters
 */
interface SurfacePoint {
  point: Point;
  u: number;  // First surface parameter (0 to 1)
  v: number;  // Second surface parameter (0 to 1)
}

/**
 * Abstract base class for all surface geometries
 * Represents a continuous 2-dimensional geometry in coordinate space
 */
abstract class Surface implements Geometry {
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
    return 2; // Surfaces are 2-dimensional
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

  // Abstract methods specific to surfaces
  /**
   * Gets the area of the surface
   */
  abstract getArea(): number;

  /**
   * Gets the perimeter (boundary length) of the surface
   */
  abstract getPerimeter(): number;

  /**
   * Gets the centroid of the surface
   */
  abstract getCentroid(): Point;

  /**
   * Gets a point on the surface given parametric coordinates
   * @param u First parameter (0 to 1)
   * @param v Second parameter (0 to 1)
   */
  abstract getPointAtParameters(u: number, v: number): Point | null;

  /**
   * Gets the parameters for a point on the surface
   * @param point Point to find parameters for
   * @returns Surface parameters or null if point is not on surface
   */
  abstract getParametersAtPoint(point: Point): { u: number; v: number; } | null;

  /**
   * Gets the boundary of the surface
   * @returns Array of curves representing the boundary
   */
  abstract getBoundary(): Curve[];

  /**
   * Tests if the surface is closed (has no boundary)
   */
  abstract isClosed(): boolean;

  /**
   * Gets the normal vector at a point on the surface
   * @param point Point to get normal at
   */
  abstract getNormalAtPoint(point: Point): Point | null;

  /**
   * Tests if a point lies on the surface
   * @param point Point to test
   * @param tolerance Distance tolerance
   */
  abstract isPointOnSurface(point: Point, tolerance?: number): boolean;

  /**
   * Gets the closest point on the surface to a given point
   * @param point Point to find closest point to
   */
  abstract getClosestPoint(point: Point): SurfacePoint;

  /**
   * Gets a triangulation of the surface
   * @param maxTriangleSize Maximum size of triangles
   * @returns Array of triangular polygons
   */
  abstract triangulate(maxTriangleSize?: number): Polygon[];

  /**
   * Gets the coordinate system type
   */
  getCoordinateSystem(): CoordinateSystem {
    return this.coordinateSystem;
  }

  /**
   * Projects a point onto the surface
   * @param point Point to project
   */
  projectPoint(point: Point): SurfacePoint {
    return this.getClosestPoint(point);
  }

  /**
   * Gets the Gaussian curvature at a point
   * @param point Point to get curvature at
   */
  abstract getGaussianCurvature(point: Point): number | null;

  /**
   * Gets the mean curvature at a point
   * @param point Point to get curvature at
   */
  abstract getMeanCurvature(point: Point): number | null;

  /**
   * Gets the principal curvatures at a point
   * @param point Point to get curvatures at
   * @returns Array [k1, k2] of principal curvatures or null
   */
  abstract getPrincipalCurvatures(point: Point): [number, number] | null;

  /**
   * Gets the principal directions at a point
   * @param point Point to get directions at
   * @returns Array [d1, d2] of principal direction vectors or null
   */
  abstract getPrincipalDirections(point: Point): [Point, Point] | null;

  /**
   * Intersects the surface with a curve
   * @param curve Curve to intersect with
   * @returns Array of intersection points
   */
  abstract intersectWithCurve(curve: Curve): Point[];

  /**
   * Intersects the surface with another surface
   * @param surface Surface to intersect with
   * @returns Array of intersection curves
   */
  abstract intersectWithSurface(surface: Surface): Curve[];

  /**
   * Gets a section of the surface by intersecting with a plane
   * @param planePoint Point on the plane
   * @param planeNormal Normal vector of the plane
   * @returns Array of intersection curves
   */
  abstract getSectionWithPlane(planePoint: Point, planeNormal: Point): Curve[];

  /**
   * Gets the tangent plane at a point
   * @param point Point to get tangent plane at
   * @returns Array [point, normal] representing the tangent plane or null
   */
  abstract getTangentPlane(point: Point): [Point, Point] | null;

  /**
   * Validates the surface geometry
   * @returns Array of validation errors, empty if valid
   */
  abstract validate(): string[];

  /**
   * Smooths the surface using a specified algorithm
   * @param tolerance Smoothing tolerance
   */
  abstract smooth(tolerance: number): Surface;

  /**
   * Gets a subsurface defined by parameter ranges
   * @param uMin Minimum u parameter
   * @param uMax Maximum u parameter
   * @param vMin Minimum v parameter
   * @param vMax Maximum v parameter
   */
  abstract getSubSurface(
    uMin: number,
    uMax: number,
    vMin: number,
    vMax: number
  ): Surface;

  /**
   * Computes offset surface
   * @param distance Offset distance (positive for outward, negative for inward)
   */
  abstract getOffsetSurface(distance: number): Surface;

  /**
   * Gets surface properties at a point
   * @param point Point to get properties at
   * @returns Object containing various surface properties
   */
  getSurfaceProperties(point: Point): {
    normal: Point | null;
    gaussianCurvature: number | null;
    meanCurvature: number | null;
    principalCurvatures: [number, number] | null;
    principalDirections: [Point, Point] | null;
  } {
    return {
      normal: this.getNormalAtPoint(point),
      gaussianCurvature: this.getGaussianCurvature(point),
      meanCurvature: this.getMeanCurvature(point),
      principalCurvatures: this.getPrincipalCurvatures(point),
      principalDirections: this.getPrincipalDirections(point)
    };
  }


  /**
 * Tests if a point lies on the surface
 * @param point Point to test
 * @returns true if point lies on surface, false otherwise
 */
  public abstract contains(point: Point): boolean;


  /**
   * Creates a deep copy of the surface
   */
  abstract clone(): Surface;

  asWKT(): string {
    throw new Error('Method not implemented.');
  }

}

export { Surface, SurfacePoint };