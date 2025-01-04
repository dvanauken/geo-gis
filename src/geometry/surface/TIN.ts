import { Point, Geometry, CoordinateSystem } from '../base/Point';
import { LinearRing } from '../primitive/LinearRing';
import { Polygon } from '../primitive/Polygon';
import { Triangle } from './Triangle';


/**
 * Implementation of a Triangulated Irregular Network (TIN)
 * Represents a surface as a network of connected triangles
 */
class TIN implements Geometry {
  private triangles: Triangle[];
  private points: Point[];
  private srid: number;
  private readonly coordinateSystem: CoordinateSystem;

  /**
   * Creates a new TIN
   * @param points Array of points to triangulate
   * @param srid Spatial Reference System Identifier
   * @param coordinateSystem Coordinate system type
   */
  constructor(
    points: Point[],
    srid: number = 0,
    coordinateSystem: CoordinateSystem = CoordinateSystem.CARTESIAN_2D
  ) {
    this.validatePoints(points);
    this.points = points.map(p => p.clone());
    this.srid = srid;
    this.coordinateSystem = coordinateSystem;
    this.triangles = this.createDelaunayTriangulation(this.points);
  }
    asWKT(): string {
        throw new Error('Method not implemented.');
    }

  private validatePoints(points: Point[]): void {
    if (points.length < 3) {
      throw new Error('TIN requires at least 3 points');
    }

    // Check coordinate system consistency
    const firstCs = points[0].getCoordinateSystem();
    if (!points.every(p => p.getCoordinateSystem() === firstCs)) {
      throw new Error('All points must have the same coordinate system');
    }

    // Check dimensionality consistency
    const firstIs3D = points[0].is3D();
    if (!points.every(p => p.is3D() === firstIs3D)) {
      throw new Error('All points must be consistently 2D or 3D');
    }
  }

  /**
   * Creates a Delaunay triangulation from a set of points
   * Uses the Bowyer-Watson incremental algorithm
   */
  private createDelaunayTriangulation(points: Point[]): Triangle[] {
    // Create super-triangle that contains all points
    const superTriangle = this.createSuperTriangle(points);
    let triangulation = [superTriangle];

    // Add points one at a time
    for (const point of points) {
      const badTriangles: Triangle[] = [];

      // Find all triangles whose circumcircle contains the point
      for (const triangle of triangulation) {
        if (triangle.inCircumcircle(point)) {
          badTriangles.push(triangle);
        }
      }

      // Find boundary of polygon hole
      const boundary: [Point, Point][] = [];
      for (const triangle of badTriangles) {
        const vertices = triangle.getVertices();
        for (let i = 0; i < 3; i++) {
          const edge: [Point, Point] = [vertices[i], vertices[(i + 1) % 3]];
          let shared = false;
          
          for (const other of badTriangles) {
            if (other === triangle) continue;
            if (this.triangleContainsEdge(other, edge)) {
              shared = true;
              break;
            }
          }

          if (!shared) {
            boundary.push(edge);
          }
        }
      }

      // Remove bad triangles
      triangulation = triangulation.filter(t => !badTriangles.includes(t));

      // Re-triangulate the hole
      for (const [p1, p2] of boundary) {
        const newTriangle = new Triangle(point, p1, p2);
        triangulation.push(newTriangle);
      }
    }

    // Remove triangles that share vertex with super-triangle
    const superVertices = superTriangle.getVertices();
    triangulation = triangulation.filter(triangle => {
      const vertices = triangle.getVertices();
      return !vertices.some(v => 
        superVertices.some(sv => v.equals(sv))
      );
    });

    // Set up triangle neighbor relationships
    this.establishNeighbors(triangulation);

    return triangulation;
  }

  private createSuperTriangle(points: Point[]): Triangle {
    // Find bounding box
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const point of points) {
      minX = Math.min(minX, point.getX());
      minY = Math.min(minY, point.getY());
      maxX = Math.max(maxX, point.getX());
      maxY = Math.max(maxY, point.getY());
    }

    const dx = (maxX - minX) * 2;
    const dy = (maxY - minY) * 2;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Create triangle that encompasses all points with margin
    return new Triangle(
      new Point(centerX - dx, centerY - dy),
      new Point(centerX + dx * 2, centerY - dy),
      new Point(centerX, centerY + dy * 2)
    );
  }

  private triangleContainsEdge(triangle: Triangle, edge: [Point, Point]): boolean {
    const vertices = triangle.getVertices();
    for (let i = 0; i < 3; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % 3];
      if ((edge[0].equals(v1) && edge[1].equals(v2)) ||
          (edge[0].equals(v2) && edge[1].equals(v1))) {
        return true;
      }
    }
    return false;
  }

  private establishNeighbors(triangles: Triangle[]): void {
    for (let i = 0; i < triangles.length; i++) {
      const triangle = triangles[i];
      const vertices = triangle.getVertices();

      for (let j = i + 1; j < triangles.length; j++) {
        const other = triangles[j];
        const otherVertices = other.getVertices();

        // Check each edge
        for (let k = 0; k < 3; k++) {
          const v1 = vertices[k];
          const v2 = vertices[(k + 1) % 3];

          for (let l = 0; l < 3; l++) {
            const ov1 = otherVertices[l];
            const ov2 = otherVertices[(l + 1) % 3];

            if ((v1.equals(ov1) && v2.equals(ov2)) ||
                (v1.equals(ov2) && v2.equals(ov1))) {
              triangle.setNeighbor(k, other);
              other.setNeighbor(l, triangle);
            }
          }
        }
      }
    }
  }

  // Geometry interface implementation
  public isEmpty(): boolean {
    return this.triangles.length === 0;
  }

  public is3D(): boolean {
    return this.points.length > 0 && this.points[0].is3D();
  }

  public dimension(): number {
    return 2; // TINs are 2-dimensional surfaces
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

  public getGeometryType(): string {
    return 'TIN';
  }

  public equals(other: Geometry): boolean {
    if (!(other instanceof TIN)) {
      return false;
    }

    const otherTin = other as TIN;
    if (this.points.length !== otherTin.points.length) {
      return false;
    }

    // Compare points (order-independent)
    const thisPoints = new Set(this.points.map(p => p.toString()));
    return otherTin.points.every(p => thisPoints.has(p.toString()));
  }

  // Additional TIN-specific methods
  /**
   * Gets all triangles in the TIN
   */
  public getTriangles(): Triangle[] {
    return [...this.triangles];
  }

  /**
   * Gets all points in the TIN
   */
  public getPoints(): Point[] {
    return this.points.map(p => p.clone());
  }

  /**
   * Gets the triangle containing a point
   * @returns The containing triangle or null if not found
   */
  public getTriangleAt(point: Point): Triangle | null {
    for (const triangle of this.triangles) {
      if (triangle.contains(point)) {
        return triangle;
      }
    }
    return null;
  }

  /**
   * Interpolates a Z value at a given point
   * Uses linear interpolation within the containing triangle
   */
  public interpolateZ(point: Point): number | null {
    const triangle = this.getTriangleAt(point);
    if (!triangle || !this.is3D()) {
      return null;
    }

    const [v1, v2, v3] = triangle.getVertices();
    const area = triangle.getArea();

    // Barycentric coordinates
    const area1 = new Triangle(point, v2, v3).getArea();
    const area2 = new Triangle(v1, point, v3).getArea();
    const area3 = new Triangle(v1, v2, point).getArea();

    const w1 = area1 / area;
    const w2 = area2 / area;
    const w3 = area3 / area;

    // Interpolate Z value using barycentric coordinates
    return w1 * v1.getZ()! + w2 * v2.getZ()! + w3 * v3.getZ()!;
  }

  /**
   * Gets the surface area of the TIN
   */
  public getSurfaceArea(): number {
    return this.triangles.reduce((sum, triangle) => sum + triangle.getArea(), 0);
  }

  /**
   * Gets the boundary of the TIN as a collection of edges
   * @returns Array of edge segments that form the boundary
   */
  public getBoundary(): [Point, Point][] {
    const edges = new Map<string, number>();

    // Count occurrences of each edge
    for (const triangle of this.triangles) {
      const vertices = triangle.getVertices();
      for (let i = 0; i < 3; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % 3];
        const edgeKey = this.getEdgeKey(v1, v2);
        edges.set(edgeKey, (edges.get(edgeKey) || 0) + 1);
      }
    }

    // Collect edges that appear only once (boundary edges)
    const boundary: [Point, Point][] = [];
    for (const triangle of this.triangles) {
      const vertices = triangle.getVertices();
      for (let i = 0; i < 3; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % 3];
        const edgeKey = this.getEdgeKey(v1, v2);
        if (edges.get(edgeKey) === 1) {
          boundary.push([v1.clone(), v2.clone()]);
        }
      }
    }

    return boundary;
  }

  /**
   * Creates a unique key for an edge
   */
  private getEdgeKey(p1: Point, p2: Point): string {
    // Order points consistently to ensure same key for same edge
    const [minP, maxP] = p1.getX() < p2.getX() ? [p1, p2] : [p2, p1];
    return `${minP.getX()},${minP.getY()}-${maxP.getX()},${maxP.getY()}`;
  }

  /**
   * Finds the steepest slope at a given point
   * @returns Slope in degrees or null if point is not in TIN or TIN is not 3D
   */
  public getSteepestSlope(point: Point): number | null {
    if (!this.is3D()) {
      return null;
    }

    const triangle = this.getTriangleAt(point);
    if (!triangle) {
      return null;
    }

    const [v1, v2, v3] = triangle.getVertices();
    
    // Calculate normal vector using cross product
    const ux = v2.getX() - v1.getX();
    const uy = v2.getY() - v1.getY();
    const uz = v2.getZ()! - v1.getZ()!;
    
    const vx = v3.getX() - v1.getX();
    const vy = v3.getY() - v1.getY();
    const vz = v3.getZ()! - v1.getZ()!;
    
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    
    // Calculate slope angle
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    const cosAngle = Math.abs(nz) / length;
    return Math.acos(cosAngle) * 180 / Math.PI;
  }

  /**
   * Converts the TIN to a collection of polygons
   * Each triangle becomes a polygon
   */
  public toPolygons(): Polygon[] {
    return this.triangles.map(triangle => {
      const vertices = triangle.getVertices();
      const ring = new LinearRing([
        ...vertices,
        vertices[0].clone() // Close the ring
      ]);
      return new Polygon(ring);
    });
  }

  /**
   * Finds all points within a given radius of a point
   */
  public findPointsWithinRadius(center: Point, radius: number): Point[] {
    return this.points.filter(p => p.distanceTo(center) <= radius)
                     .map(p => p.clone());
  }

  /**
   * Validates the TIN structure
   * Checks for topological correctness
   * @returns Array of validation errors, empty if valid
   */
  public validate(): string[] {
    const errors: string[] = [];

    // Check for minimum points
    if (this.points.length < 3) {
      errors.push('TIN must have at least 3 points');
    }

    // Check for duplicate points
    const pointMap = new Map<string, number>();
    this.points.forEach((point, index) => {
      const key = `${point.getX()},${point.getY()}`;
      if (pointMap.has(key)) {
        errors.push(`Duplicate point found at indices ${pointMap.get(key)} and ${index}`);
      }
      pointMap.set(key, index);
    });

    // Check triangle connectivity
    for (const triangle of this.triangles) {
      const neighbors = triangle.getNeighbors();
      for (let i = 0; i < 3; i++) {
        const neighbor = neighbors[i];
        if (neighbor) {
          // Check reciprocal relationship
          const neighborVertices = neighbor.getVertices();
          const triangleVertices = triangle.getVertices();
          let found = false;
          for (let j = 0; j < 3; j++) {
            if (neighbor.getNeighbors()[j] === triangle) {
              found = true;
              break;
            }
          }
          if (!found) {
            errors.push('Inconsistent triangle neighbor relationship found');
          }
        }
      }
    }

    // Check for overlapping triangles
    for (let i = 0; i < this.triangles.length; i++) {
      const tri1 = this.triangles[i];
      for (let j = i + 1; j < this.triangles.length; j++) {
        const tri2 = this.triangles[j];
        if (this.trianglesOverlap(tri1, tri2)) {
          errors.push(`Overlapping triangles found at indices ${i} and ${j}`);
        }
      }
    }

    return errors;
  }

  private trianglesOverlap(tri1: Triangle, tri2: Triangle): boolean {
    // Check if any vertex of one triangle is inside the other
    const vertices1 = tri1.getVertices();
    const vertices2 = tri2.getVertices();

    for (const vertex of vertices1) {
      if (tri2.contains(vertex)) {
        return true;
      }
    }

    for (const vertex of vertices2) {
      if (tri1.contains(vertex)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Simplifies the TIN by removing points that contribute least to the surface accuracy
   * @param maxError Maximum allowed vertical error
   * @returns A new simplified TIN
   */
  public simplify(maxError: number): TIN {
    if (!this.is3D()) {
      throw new Error('Simplification requires 3D points');
    }

    // Calculate importance of each point
    const importance = new Map<Point, number>();
    for (const point of this.points) {
      importance.set(point, this.calculatePointImportance(point));
    }

    // Sort points by importance
    const sortedPoints = [...this.points].sort((a, b) => 
      (importance.get(b) || 0) - (importance.get(a) || 0)
    );

    // Keep removing points until error threshold is exceeded
    const keepPoints = new Set<Point>();
    for (const point of sortedPoints) {
      const testPoints = new Set(keepPoints);
      testPoints.add(point);
      
      if (this.calculateMaxError(testPoints) <= maxError) {
        keepPoints.add(point);
      }
    }

    return new TIN(Array.from(keepPoints), this.srid, this.coordinateSystem);
  }

  private calculatePointImportance(point: Point): number {
    // Calculate how much this point contributes to the surface variation
    const neighbors = this.findNeighborPoints(point);
    if (neighbors.length === 0) return 0;

    let sumDiff = 0;
    for (const neighbor of neighbors) {
      sumDiff += Math.abs(point.getZ()! - neighbor.getZ()!);
    }
    return sumDiff / neighbors.length;
  }

  private findNeighborPoints(point: Point): Point[] {
    const neighbors: Point[] = [];
    for (const triangle of this.triangles) {
      const vertices = triangle.getVertices();
      const index = vertices.findIndex(v => v.equals(point));
      if (index !== -1) {
        neighbors.push(vertices[(index + 1) % 3]);
        neighbors.push(vertices[(index + 2) % 3]);
      }
    }
    return [...new Set(neighbors)];
  }

  private calculateMaxError(points: Set<Point>): number {
    const testTin = new TIN(Array.from(points), this.srid, this.coordinateSystem);
    let maxError = 0;

    for (const point of this.points) {
      if (!points.has(point)) {
        const interpolated = testTin.interpolateZ(point);
        if (interpolated !== null) {
          const error = Math.abs(point.getZ()! - interpolated);
          maxError = Math.max(maxError, error);
        }
      }
    }

    return maxError;
  }
}

export { TIN };