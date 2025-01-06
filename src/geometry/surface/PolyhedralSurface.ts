import { Point, Geometry, CoordinateSystem } from '../base/Point';
import { SurfacePoint } from '../base/SurfacePoint';
import { Curve } from '../primitive/Curve';
import { LinearRing } from '../primitive/LinearRing';
import { Polygon } from '../primitive/Polygon';
import { Surface } from '../primitive/Surface';

/**
 * Represents a face in a polyhedral surface
 */
interface Face {
  polygon: Polygon;
  neighbors: Set<number>; // Indices of neighboring faces
}

/**
 * Implementation of PolyhedralSurface geometry
 * Represents a surface composed of polygonal faces in 3D space
 */
class PolyhedralSurface extends Surface {
  private readonly faces: Face[];
  private readonly patches: Polygon[];  // Original polygons for WKT output

  /**
   * Creates a new PolyhedralSurface
   * @param polygons Array of polygons forming the surface
   * @param srid Spatial Reference System Identifier
   * @param coordinateSystem Coordinate system type
   */
  constructor(
    polygons: Polygon[],
    srid: number = 0,
    coordinateSystem: CoordinateSystem = CoordinateSystem.CARTESIAN_3D
  ) {
    super(srid, coordinateSystem);
    this.validatePolygons(polygons);
    this.patches = polygons.map(p => p.clone());
    this.faces = this.buildTopology(polygons);
  }

  private validatePolygons(polygons: Polygon[]): void {
    if (polygons.length === 0) {
      throw new Error('PolyhedralSurface must contain at least one polygon');
    }

    // Check 3D requirement
    if (!polygons.every(poly => poly.is3D())) {
      throw new Error('All polygons must be 3D');
    }

    // Check coordinate system consistency
    const firstCs = polygons[0].getCoordinateSystem();
    if (!polygons.every(poly => poly.getCoordinateSystem() === firstCs)) {
      throw new Error('All polygons must have the same coordinate system');
    }

    // Check planarity of each polygon
    polygons.forEach(this.validatePlanarity);
  }

  private validatePlanarity(polygon: Polygon): void {
    const points = polygon.getExteriorRing().getPoints();
    if (points.length < 4) return; // Triangle is always planar

    // Use first three non-collinear points to define plane
    const p1 = points[0];
    let p2 = points[1];
    let p3 = points[2];
    let i = 3;

    while (i < points.length && this.arePointsCollinear(p1, p2, p3)) {
      p2 = points[i - 1];
      p3 = points[i];
      i++;
    }

    if (i === points.length && this.arePointsCollinear(p1, p2, p3)) {
      throw new Error('Cannot determine plane from collinear points');
    }

    // Get plane normal
    const normal = this.computeNormal(p1, p2, p3);

    // Check if all points lie on the plane
    const EPSILON = 1e-10;
    const d = -(normal.getX() * p1.getX() +
      normal.getY() * p1.getY() +
      normal.getZ()! * p1.getZ()!);

    for (const point of points) {
      const distance = Math.abs(normal.getX() * point.getX() +
        normal.getY() * point.getY() +
        normal.getZ()! * point.getZ()! + d);
      if (distance > EPSILON) {
        throw new Error('Polygon is not planar');
      }
    }
  }

  private arePointsCollinear(p1: Point, p2: Point, p3: Point): boolean {
    const EPSILON = 1e-10;
    const v1 = new Point(
      p2.getX() - p1.getX(),
      p2.getY() - p1.getY(),
      p2.getZ()! - p1.getZ()!
    );
    const v2 = new Point(
      p3.getX() - p1.getX(),
      p3.getY() - p1.getY(),
      p3.getZ()! - p1.getZ()!
    );

    // Check if cross product is zero (vectors are parallel)
    const cross = this.crossProduct(v1, v2);
    return Math.abs(cross.getX()) < EPSILON &&
      Math.abs(cross.getY()) < EPSILON &&
      Math.abs(cross.getZ()!) < EPSILON;
  }

  private crossProduct(v1: Point, v2: Point): Point {
    return new Point(
      v1.getY() * v2.getZ()! - v1.getZ()! * v2.getY(),
      v1.getZ()! * v2.getX() - v1.getX() * v2.getZ()!,
      v1.getX() * v2.getY() - v1.getY() * v2.getX()
    );
  }

  private computeNormal(p1: Point, p2: Point, p3: Point): Point {
    const v1 = new Point(
      p2.getX() - p1.getX(),
      p2.getY() - p1.getY(),
      p2.getZ()! - p1.getZ()!
    );
    const v2 = new Point(
      p3.getX() - p1.getX(),
      p3.getY() - p1.getY(),
      p3.getZ()! - p1.getZ()!
    );

    const cross = this.crossProduct(v1, v2);
    const length = Math.sqrt(
      cross.getX() * cross.getX() +
      cross.getY() * cross.getY() +
      cross.getZ()! * cross.getZ()!
    );

    return new Point(
      cross.getX() / length,
      cross.getY() / length,
      cross.getZ()! / length
    );
  }

  private buildTopology(polygons: Polygon[]): Face[] {
    const faces: Face[] = polygons.map(poly => ({
      polygon: poly.clone(),
      neighbors: new Set<number>()
    }));

    // Find adjacent faces
    for (let i = 0; i < faces.length; i++) {
      for (let j = i + 1; j < faces.length; j++) {
        if (this.arePolygonsAdjacent(faces[i].polygon, faces[j].polygon)) {
          faces[i].neighbors.add(j);
          faces[j].neighbors.add(i);
        }
      }
    }

    return faces;
  }

  private arePolygonsAdjacent(poly1: Polygon, poly2: Polygon): boolean {
    const edges1 = this.getPolygonEdges(poly1);
    const edges2 = this.getPolygonEdges(poly2);

    // Check if polygons share any edge
    for (const edge1 of edges1) {
      for (const edge2 of edges2) {
        if (this.areEdgesEqual(edge1, edge2)) {
          return true;
        }
      }
    }
    return false;
  }

  private getPolygonEdges(polygon: Polygon): [Point, Point][] {
    const points = polygon.getExteriorRing().getPoints();
    const edges: [Point, Point][] = [];

    for (let i = 0; i < points.length - 1; i++) {
      edges.push([points[i], points[i + 1]]);
    }

    return edges;
  }

  private areEdgesEqual(
    edge1: [Point, Point],
    edge2: [Point, Point]
  ): boolean {
    return (edge1[0].equals(edge2[0]) && edge1[1].equals(edge2[1])) ||
      (edge1[0].equals(edge2[1]) && edge1[1].equals(edge2[0]));
  }

  // Surface interface implementation
  public override getArea(): number {
    return this.faces.reduce((sum, face) => sum + face.polygon.getArea(), 0);
  }

  public override getPerimeter(): number {
    // Get the length of all boundary edges
    const boundaryEdges = this.getBoundaryEdges();
    return boundaryEdges.reduce((sum, edge) =>
      sum + edge[0].distanceTo(edge[1]), 0
    );
  }

  private getBoundaryEdges(): [Point, Point][] {
    const edgeCount = new Map<string, number>();

    // Count occurrences of each edge
    this.faces.forEach(face => {
      const edges = this.getPolygonEdges(face.polygon);
      edges.forEach(edge => {
        const key = this.getEdgeKey(edge);
        edgeCount.set(key, (edgeCount.get(key) || 0) + 1);
      });
    });

    // Collect edges that appear only once (boundary edges)
    const boundaryEdges: [Point, Point][] = [];
    this.faces.forEach(face => {
      const edges = this.getPolygonEdges(face.polygon);
      edges.forEach(edge => {
        const key = this.getEdgeKey(edge);
        if (edgeCount.get(key) === 1) {
          boundaryEdges.push(edge);
        }
      });
    });

    return boundaryEdges;
  }

  private getEdgeKey(edge: [Point, Point]): string {
    // Create consistent key regardless of edge direction
    const [p1, p2] = edge;
    const points = [p1, p2].sort((a, b) =>
      a.getX() !== b.getX() ? a.getX() - b.getX() :
        a.getY() !== b.getY() ? a.getY() - b.getY() :
          a.getZ()! - b.getZ()!
    );
    return points.map(p =>
      `${p.getX()},${p.getY()},${p.getZ()}`
    ).join('-');
  }

  public override getCentroid(): Point {
    if (this.faces.length === 0) {
      throw new Error('Cannot compute centroid of empty surface');
    }

    let sumX = 0, sumY = 0, sumZ = 0;
    let totalArea = 0;

    this.faces.forEach(face => {
      const centroid = face.polygon.getCentroid();
      const area = face.polygon.getArea();
      sumX += centroid.getX() * area;
      sumY += centroid.getY() * area;
      sumZ += centroid.getZ()! * area;
      totalArea += area;
    });

    return new Point(
      sumX / totalArea,
      sumY / totalArea,
      sumZ / totalArea
    );
  }

  public override getPointAtParameters(u: number, v: number): Point | null {
    // This is a simplified implementation that treats u,v as indices
    // A more sophisticated implementation would need proper parameterization
    if (u < 0 || u > 1 || v < 0 || v > 1) {
      return null;
    }

    const faceIndex = Math.floor(u * this.faces.length);
    const face = this.faces[faceIndex];
    return face.polygon.getPointAtParameters(u * this.faces.length % 1, v);
  }

  public override getParametersAtPoint(point: Point): { u: number; v: number; } | null {
    // Find which face contains the point
    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i];
      if (face.polygon.contains(point)) {
        const params = face.polygon.getParametersAtPoint(point);
        if (params) {
          return {
            u: (i + params.u) / this.faces.length,
            v: params.v
          };
        }
      }
    }
    return null;
  }

  public override getBoundary(): Curve[] {
    const boundaryEdges = this.getBoundaryEdges();
    // Group edges into continuous curves
    const curves: Point[][] = [];
    let currentCurve: Point[] = [];

    while (boundaryEdges.length > 0) {
      if (currentCurve.length === 0) {
        const [start, end] = boundaryEdges.pop()!;
        currentCurve.push(start, end);
      } else {
        const lastPoint = currentCurve[currentCurve.length - 1];
        const nextEdgeIndex = boundaryEdges.findIndex(([start]) =>
          start.equals(lastPoint)
        );

        if (nextEdgeIndex !== -1) {
          const [, end] = boundaryEdges.splice(nextEdgeIndex, 1)[0];
          currentCurve.push(end);
        } else {
          curves.push(currentCurve);
          currentCurve = [];
        }
      }
    }

    if (currentCurve.length > 0) {
      curves.push(currentCurve);
    }

    // Convert point arrays to LinearRings
    return curves.map(points => new LinearRing(points));
  }

  public override isClosed(): boolean {
    return this.getBoundaryEdges().length === 0;
  }

  public override getNormalAtPoint(point: Point): Point | null {
    // Find face containing point and return its normal
    for (const face of this.faces) {
      if (face.polygon.contains(point)) {
        const points = face.polygon.getExteriorRing().getPoints();
        return this.computeNormal(points[0], points[1], points[2]);
      }
    }
    return null;
  }

  public override isPointOnSurface(point: Point, tolerance: number = 1e-10): boolean {
    return this.faces.some(face => face.polygon.contains(point));
  }

  public override getClosestPoint(point: Point): SurfacePoint {
    const closestPoint = this.faces[0].polygon.getClosestPoint(point);
    return {
      point: closestPoint,
      u: 0, // Parametric coordinates - simplified implementation
      v: 0
    };
  }

  // Geometry interface implementation
  public override isEmpty(): boolean {
    return this.faces.length === 0;
  }

  public override is3D(): boolean {
    return true;
  }

  public override getGeometryType(): string {
    return 'PolyhedralSurface Z';
  }

  public equals(other: Geometry): boolean {
    if (!(other instanceof PolyhedralSurface)) {
      return false;
    }

    if (this.faces.length !== other.faces.length) {
      return false;
    }

    // Compare polygon patches (order-independent)
    const unmatched = [...other.patches];
    return this.patches.every(patch => {
      const index = unmatched.findIndex(p => p.equals(patch));
      if (index === -1) return false;
      unmatched.splice(index, 1);
      return true;
    });
  }

  public override triangulate(maxTriangleSize: number = Infinity): Polygon[] {
    const triangles: Polygon[] = [];

    for (const face of this.faces) {
      triangles.push(...face.polygon.triangulate(maxTriangleSize));
    }

    return triangles;
  }

  // Surface-specific methods
  /**
   * Gets all faces in the surface
   */
  public getFaces(): Polygon[] {
    return this.patches.map(p => p.clone());
  }

  /**
   * Gets all edges in the surface
   * @param boundaryOnly If true, returns only boundary edges
   */
  public getEdges(boundaryOnly: boolean = false): [Point, Point][] {
    if (boundaryOnly) {
      return this.getBoundaryEdges();
    }

    const edges = new Set<string>();
    const result: [Point, Point][] = [];

    this.faces.forEach(face => {
      const faceEdges = this.getPolygonEdges(face.polygon);
      faceEdges.forEach(edge => {
        const key = this.getEdgeKey(edge);
        if (!edges.has(key)) {
          edges.add(key);
          result.push(edge);
        }
      });
    });

    return result;
  }

  /**
   * Gets all vertices in the surface
   */
  public getVertices(): Point[] {
    const vertices = new Set<string>();
    const result: Point[] = [];

    this.faces.forEach(face => {
      face.polygon.getExteriorRing().getPoints().forEach(point => {
        const key = `${point.getX()},${point.getY()},${point.getZ()}`;
        if (!vertices.has(key)) {
          vertices.add(key);
          result.push(point.clone());
        }
      });
    });

    return result;
  }

  /**
   * Gets the volume of the surface (if it forms a closed polyhedron)
   */
  public getVolume(): number | null {
    if (!this.isClosed()) {
      return null; // Cannot compute volume of non-closed surface
    }

    let volume = 0;
    const origin = new Point(0, 0, 0);

    // Use divergence theorem to compute volume
    this.faces.forEach(face => {
      const points = face.polygon.getExteriorRing().getPoints();
      const normal = this.computeNormal(points[0], points[1], points[2]);

      // Compute signed volume of tetrahedron formed by face and origin
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        volume += this.signedTetrahedronVolume(origin, p1, p2, normal);
      }
    });

    return Math.abs(volume);
  }

  private signedTetrahedronVolume(
    origin: Point,
    p1: Point,
    p2: Point,
    normal: Point
  ): number {
    const v1 = new Point(
      p1.getX() - origin.getX(),
      p1.getY() - origin.getY(),
      p1.getZ()! - origin.getZ()!
    );
    const v2 = new Point(
      p2.getX() - origin.getX(),
      p2.getY() - origin.getY(),
      p2.getZ()! - origin.getZ()!
    );

    // Triple scalar product
    return (v1.getX() * v2.getY() * normal.getZ()! +
      v2.getX() * normal.getY() * v1.getZ()! +
      normal.getX() * v1.getY() * v2.getZ()! -
      v1.getZ()! * v2.getY() * normal.getX() -
      v2.getZ()! * normal.getY() * v1.getX() -
      normal.getZ()! * v1.getY() * v2.getX()) / 6;
  }

  /**
   * Gets the genus of the surface
   */
  public getGenus(): number {
    const V = this.getVertices().length;
    const E = this.getEdges().length;
    const F = this.faces.length;

    // Using Euler characteristic: V - E + F = 2 - 2g
    // where g is the genus
    return (2 - (V - E + F)) / 2;
  }

  /**
   * Checks if the surface is orientable
   */
  public isOrientable(): boolean {
    // A surface is orientable if we can assign consistent orientations
    // to all faces such that adjacent faces have opposite orientations
    // along their shared edges

    if (this.faces.length === 0) return true;

    const orientations = new Map<number, boolean>();
    const visited = new Set<number>();
    const stack: number[] = [0];
    orientations.set(0, true);

    while (stack.length > 0) {
      const current = stack.pop()!;
      visited.add(current);

      const currentOrientation = orientations.get(current)!;
      const face = this.faces[current];

      // Visit neighbors
      for (const neighbor of face.neighbors) {
        if (!visited.has(neighbor)) {
          orientations.set(neighbor, !currentOrientation);
          stack.push(neighbor);
        } else {
          // Check if orientation is consistent
          if (orientations.get(neighbor) === currentOrientation) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Converts to Well-Known Text (WKT) format
   */
  public asWKT(): string {
    if (this.isEmpty()) {
      return 'POLYHEDRALSURFACE Z EMPTY';
    }

    const patchStrings = this.patches.map(patch => {
      const points = patch.getExteriorRing().getPoints();
      const coords = points.map(p =>
        `${p.getX()} ${p.getY()} ${p.getZ()}`
      ).join(', ');
      return `((${coords}))`;
    });

    return `POLYHEDRALSURFACE Z (${patchStrings.join(', ')})`;
  }

  /**
   * Creates from Well-Known Text (WKT)
   */
  public static fromWKT(wkt: string): PolyhedralSurface {
    const match = wkt.match(/^POLYHEDRALSURFACE\s+Z\s*(\((.*)\))$/i);
    if (!match) {
      throw new Error('Invalid WKT format for PolyhedralSurface');
    }

    if (match[1].trim() === 'EMPTY') {
      return new PolyhedralSurface([]);
    }

    // Parse polygon patches
    const patches: Polygon[] = [];
    const patchRegex = /\(\((.*?)\)\)/g;
    let patchMatch;

    while ((patchMatch = patchRegex.exec(match[2])) !== null) {
      const coords = patchMatch[1].split(',').map(coord => {
        const [x, y, z] = coord.trim().split(/\s+/).map(Number);
        return new Point(x, y, z);
      });
      patches.push(new Polygon(new LinearRing(coords)));
    }

    return new PolyhedralSurface(patches);
  }

  public override clone(): Surface {
    return new PolyhedralSurface(
      this.patches,
      this.srid,
      this.coordinateSystem
    );
  }

  /**
   * Returns string representation
   */
  public toString(): string {
    return this.asWKT();
  }


  public getGaussianCurvature(point: Point): number | null {
    return 0; // Polyhedral surfaces have zero Gaussian curvature except at vertices
  }

  public getMeanCurvature(point: Point): number | null {
    return 0; // Polyhedral surfaces have zero mean curvature except at edges
  }

  public getPrincipalCurvatures(point: Point): [number, number] | null {
    return [0, 0]; // Both principal curvatures are zero on faces
  }

  public getPrincipalDirections(point: Point): [Point, Point] | null {
    const normal = this.getNormalAtPoint(point);
    if (!normal) return null;
    // Return arbitrary orthogonal vectors in the tangent plane
    return [
      new Point(1, 0, 0),
      new Point(0, 1, 0)
    ];
  }

  public intersectWithCurve(curve: Curve): Point[] {
    return []; // Basic implementation
  }

  public intersectWithSurface(surface: Surface): Curve[] {
    return []; // Basic implementation
  }

  public getSectionWithPlane(planePoint: Point, planeNormal: Point): Curve[] {
    return []; // Basic implementation
  }

  public getTangentPlane(point: Point): [Point, Point] | null {
    const normal = this.getNormalAtPoint(point);
    if (!normal) return null;
    return [point.clone(), normal];
  }



  public smooth(tolerance: number): Surface {
    return this.clone(); // Basic implementation
  }

  public getSubSurface(uMin: number, uMax: number, vMin: number, vMax: number): Surface {
    return this.clone(); // Basic implementation
  }

  public getOffsetSurface(distance: number): Surface {
    return this.clone(); // Basic implementation
  }

  public validate(): string[] {
    const errors: string[] = [];

    // Check if there are any faces
    if (this.faces.length === 0) {
      errors.push('PolyhedralSurface must contain at least one polygon');
    }

    // Check coordinate system consistency
    const firstCs = this.faces[0]?.polygon.getCoordinateSystem();
    if (this.faces.some(face => face.polygon.getCoordinateSystem() !== firstCs)) {
      errors.push('All polygons must have the same coordinate system');
    }

    // Check face connectivity and orientation
    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i];

      // Check face planarity
      try {
        this.validatePlanarity(face.polygon);
      } catch (e: any) {
        errors.push(`Face ${i} is not planar: ${e.message}`);
      }

      // Check neighbor relationships
      face.neighbors.forEach((neighborIdx) => {
        if (neighborIdx >= this.faces.length) {
          errors.push(`Face ${i} has invalid neighbor index ${neighborIdx}`);
        }
        // Check reciprocal relationship
        const neighbor = this.faces[neighborIdx];
        if (!neighbor.neighbors.has(i)) {
          errors.push(`Face ${i} and ${neighborIdx} have inconsistent neighbor relationship`);
        }
      });
    }

    // Check if surface is closed (optional - some surfaces might be open)
    const boundaryEdges = this.getBoundaryEdges();
    if (boundaryEdges.length > 0) {
      errors.push(`Surface has ${boundaryEdges.length} boundary edges (might be valid for open surfaces)`);
    }

    return errors;
  }

      /**
     * Tests if a point lies on the polyhedral surface
     * @param point Point to test
     * @returns true if point lies on any face of the surface
     */
      public contains(point: Point): boolean {
        // A point is contained if it lies on any face of the surface
        return this.faces.some(face => face.polygon.contains(point));
    }

}

export { PolyhedralSurface };