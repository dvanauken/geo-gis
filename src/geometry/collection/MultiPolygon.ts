import { CoordinateSystem } from "../base/CoordinateSystem";
import { Geometry } from "../base/Geometry";
import { Point } from "../base/Point";
import { Polygon } from "../primitive/Polygon";

/**
 * Implementation of OpenGIS MultiPolygon geometry
 * Represents a collection of Polygons
 */
class MultiPolygon implements Geometry {
  private readonly polygons: Polygon[];
  private srid: number;
  private readonly coordinateSystem: CoordinateSystem;

  /**
   * Creates a new MultiPolygon
   * @param polygons - Array of Polygons
   * @param srid - Spatial Reference System Identifier
   * @param coordinateSystem - Coordinate system type
   * @throws Error if polygons overlap or have different coordinate systems
   */
  constructor(
    polygons: Polygon[],
    srid: number = 0,
    coordinateSystem: CoordinateSystem = CoordinateSystem.CARTESIAN_2D
  ) {
    this.validatePolygons(polygons);
    this.polygons = [...polygons]; // Create defensive copy
    this.srid = srid;
    this.coordinateSystem = coordinateSystem;
  }

  /**
   * Validates the input polygons array
   */
  private validatePolygons(polygons: Polygon[]): void {
    if (!Array.isArray(polygons)) {
      throw new Error('Polygons must be provided as an array');
    }

    if (polygons.length === 0) {
      return; // Empty MultiPolygon is valid
    }

    // Check coordinate system consistency
    const firstCs = polygons[0].getExteriorRing().getPoints()[0].getCoordinateSystem();
    const invalidCs = polygons.some(poly => 
      poly.getExteriorRing().getPoints()[0].getCoordinateSystem() !== firstCs
    );
    if (invalidCs) {
      throw new Error('All polygons must have the same coordinate system');
    }

    // Check dimensionality consistency
    const firstIs3D = polygons[0].is3D();
    if (!polygons.every(poly => poly.is3D() === firstIs3D)) {
      throw new Error('All polygons must be consistently 2D or 3D');
    }

    // Check for polygon overlaps
    for (let i = 0; i < polygons.length; i++) {
      for (let j = i + 1; j < polygons.length; j++) {
        if (this.polygonsOverlap(polygons[i], polygons[j])) {
          throw new Error('Polygons in a MultiPolygon cannot overlap');
        }
      }
    }
  }

  /**
   * Checks if two polygons overlap
   * This is a simplified check that can be enhanced for production use
   */
  private polygonsOverlap(poly1: Polygon, poly2: Polygon): boolean {
    // Check if any vertex of poly1 is inside poly2 or vice versa
    const poly1Points = this.getAllPoints(poly1);
    const poly2Points = this.getAllPoints(poly2);

    return poly1Points.some(p => poly2.contains(p)) ||
           poly2Points.some(p => poly1.contains(p));
  }

  /**
   * Gets all points from a polygon (exterior and interior rings)
   */
  private getAllPoints(polygon: Polygon): Point[] {
    return [
      ...polygon.getExteriorRing().getPoints(),
      ...polygon.getInteriorRings().flatMap(ring => ring.getPoints())
    ];
  }

  // Geometry interface implementation
  public isEmpty(): boolean {
    return this.polygons.length === 0;
  }

  public is3D(): boolean {
    return this.polygons.length > 0 && this.polygons[0].is3D();
  }

  public dimension(): number {
    return 2; // MultiPolygons are 2-dimensional
  }

  public getSRID(): number {
    return this.srid;
  }

  public setSRID(srid: number): void {
    if (srid < 0) {
      throw new Error('SRID must be non-negative');
    }
    this.srid = srid;
    // Update SRID for all contained polygons
    this.polygons.forEach(poly => poly.setSRID(srid));
  }

  public getGeometryType(): string {
    return 'MultiPolygon';
  }

  public equals(other: Geometry): boolean {
    if (!(other instanceof MultiPolygon)) {
      return false;
    }

    const otherMulti = other as MultiPolygon;
    if (this.polygons.length !== otherMulti.polygons.length) {
      return false;
    }

    // Check if all polygons match (order matters)
    return this.polygons.every((poly, index) => 
      poly.equals(otherMulti.polygons[index])
    );
  }

  // WKTRepresentable interface implementation
  public asWKT(): string {
    if (this.isEmpty()) {
      return 'MULTIPOLYGON EMPTY';
    }

    const polygonStrings = this.polygons.map(poly => {
      // Remove the 'POLYGON' or 'POLYGON Z' prefix and trim
      const wkt = poly.asWKT();
      const startIndex = wkt.indexOf('(');
      return wkt.substring(startIndex);
    }).join(', ');

    if (this.is3D()) {
      return `MULTIPOLYGON Z (${polygonStrings})`;
    }
    return `MULTIPOLYGON (${polygonStrings})`;
  }

  // Additional utility methods
  /**
   * Gets all polygons in the collection
   */
  public getPolygons(): Polygon[] {
    return [...this.polygons]; // Return defensive copy
  }

  /**
   * Gets the number of polygons in the collection
   */
  public getNumGeometries(): number {
    return this.polygons.length;
  }

  /**
   * Gets the polygon at the specified index
   */
  public getGeometryN(n: number): Polygon {
    if (n < 0 || n >= this.polygons.length) {
      throw new Error('Index out of bounds');
    }
    return this.polygons[n].clone();
  }

  /**
   * Calculates the total area of all polygons
   * For geographic coordinates, this is an approximate calculation
   * @returns Total area in square units (or square meters for geographic coordinates)
   */
  public getTotalArea(): number {
    return this.polygons.reduce((sum, poly) => sum + poly.getArea(), 0);
  }

  /**
   * Determines if a point lies within any of the polygons
   */
  public contains(point: Point): boolean {
    if (point.getCoordinateSystem() !== this.coordinateSystem) {
      throw new Error('Point must be in the same coordinate system as the MultiPolygon');
    }
    return this.polygons.some(poly => poly.contains(point));
  }

  /**
   * Gets the coordinate system type
   */
  public getCoordinateSystem(): CoordinateSystem {
    return this.coordinateSystem;
  }

  /**
   * Finds adjacent polygons that share boundaries
   * @returns Array of polygon index pairs that are adjacent
   */
  public findAdjacentPolygons(): [number, number][] {
    const adjacent: [number, number][] = [];
    
    for (let i = 0; i < this.polygons.length; i++) {
      for (let j = i + 1; j < this.polygons.length; j++) {
        if (this.polygonsAreAdjacent(this.polygons[i], this.polygons[j])) {
          adjacent.push([i, j]);
        }
      }
    }
    
    return adjacent;
  }

  private polygonsAreAdjacent(poly1: Polygon, poly2: Polygon): boolean {
    // Check if polygons share any vertices
    const poly1Points = this.getAllPoints(poly1);
    const poly2Points = this.getAllPoints(poly2);

    let sharedPoints = 0;
    for (const p1 of poly1Points) {
      if (poly2Points.some(p2 => p2.equals(p1))) {
        sharedPoints++;
        if (sharedPoints >= 2) {
          return true; // Polygons share at least 2 vertices
        }
      }
    }
    
    return false;
  }

  /**
   * Creates a copy of this MultiPolygon
   */
  public clone(): MultiPolygon {
    return new MultiPolygon(
      this.polygons.map(poly => poly.clone()),
      this.srid,
      this.coordinateSystem
    );
  }

  /**
   * Returns a string representation of the MultiPolygon
   */
  public toString(): string {
    return this.asWKT();
  }

  /**
   * Merges adjacent polygons if possible
   * @returns A new MultiPolygon with adjacent polygons merged
   */
  public mergeAdjacent(): MultiPolygon {
    const adjacent = this.findAdjacentPolygons();
    if (adjacent.length === 0) {
      return this.clone();
    }

    // Create sets of connected polygon indices
    const sets: Set<number>[] = [];
    for (const [i, j] of adjacent) {
      let foundSet = false;
      for (const set of sets) {
        if (set.has(i) || set.has(j)) {
          set.add(i);
          set.add(j);
          foundSet = true;
          break;
        }
      }
      if (!foundSet) {
        sets.push(new Set([i, j]));
      }
    }

    // Merge polygons in each set
    const mergedPolygons: Polygon[] = [];
    const usedIndices = new Set<number>();

    for (const set of sets) {
      // Add merged polygon
      const polygonsToMerge = Array.from(set).map(i => this.polygons[i]);
      // Note: Actual polygon merging would require complex geometric operations
      // This is a placeholder for the merging logic
      mergedPolygons.push(polygonsToMerge[0].clone());
      set.forEach(i => usedIndices.add(i));
    }

    // Add remaining unmerged polygons
    for (let i = 0; i < this.polygons.length; i++) {
      if (!usedIndices.has(i)) {
        mergedPolygons.push(this.polygons[i].clone());
      }
    }

    return new MultiPolygon(mergedPolygons, this.srid, this.coordinateSystem);
  }
}

export { MultiPolygon };