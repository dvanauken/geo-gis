import { CoordinateSystem } from "./CoordinateSystem";
import { WKTRepresentable } from "./WKTRepresentable";
import { Geometry } from './Geometry';

  
  /**
   * Implementation of OpenGIS Point geometry
   * Represents a location in coordinate space
   */
  class Point implements Geometry {
    private readonly x: number;
    private readonly y: number;
    private readonly z: number | null;
    private srid: number;
    private readonly coordinateSystem: CoordinateSystem;
  
    /**
     * Creates a new Point
     * @param x - X coordinate (or longitude for geographic coordinates)
     * @param y - Y coordinate (or latitude for geographic coordinates)
     * @param z - Optional Z coordinate (or altitude for geographic coordinates)
     * @param srid - Spatial Reference System Identifier (defaults to 0)
     * @param coordinateSystem - Coordinate system type (defaults to Cartesian 2D)
     */
    constructor(
      x: number,
      y: number,
      z: number | null = null,
      srid: number = 0,
      coordinateSystem: CoordinateSystem = CoordinateSystem.CARTESIAN_2D
    ) {
      this.validateCoordinates(x, y, z);
      this.x = x;
      this.y = y;
      this.z = z;
      this.srid = srid;
      this.coordinateSystem = coordinateSystem;
    }
  
    /**
     * Validates coordinate values based on coordinate system
     */
    private validateCoordinates(x: number, y: number, z: number | null): void {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error('Coordinates must be finite numbers');
      }
      if (z !== null && !Number.isFinite(z)) {
        throw new Error('Z coordinate must be a finite number when provided');
      }
  
      if (this.coordinateSystem === CoordinateSystem.GEOGRAPHIC_2D || 
          this.coordinateSystem === CoordinateSystem.GEOGRAPHIC_3D) {
        // Validate longitude (-180 to 180)
        if (x < -180 || x > 180) {
          throw new Error('Longitude must be between -180 and 180 degrees');
        }
        // Validate latitude (-90 to 90)
        if (y < -90 || y > 90) {
          throw new Error('Latitude must be between -90 and 90 degrees');
        }
      }
    }
  
    // Geometry interface implementation
    public isEmpty(): boolean {
      return false; // A Point is never empty if it exists
    }
  
    public is3D(): boolean {
      return this.z !== null;
    }
  
    public dimension(): number {
      return 0; // Points are 0-dimensional
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
      return 'Point';
    }
  
    public equals(other: Geometry): boolean {
      if (!(other instanceof Point)) {
        return false;
      }
      
      const otherPoint = other as Point;
      if (this.x !== otherPoint.x || this.y !== otherPoint.y) {
        return false;
      }
      
      // Compare z values if either point is 3D
      if (this.is3D() || otherPoint.is3D()) {
        return this.z === otherPoint.z;
      }
      
      return true;
    }
  
    // WKTRepresentable interface implementation
    public asWKT(): string {
      if (this.is3D()) {
        return `POINT Z (${this.x} ${this.y} ${this.z})`;
      }
      return `POINT (${this.x} ${this.y})`;
    }
  
    // Additional utility methods
    /**
     * Gets the X coordinate (or longitude for geographic coordinates)
     */
    public getX(): number {
      return this.x;
    }
  
    /**
     * Gets the Y coordinate (or latitude for geographic coordinates)
     */
    public getY(): number {
      return this.y;
    }
  
    /**
     * Gets the Z coordinate (or altitude for geographic coordinates)
     */
    public getZ(): number | null {
      return this.z;
    }
  
    /**
     * Gets the coordinate system type
     */
    public getCoordinateSystem(): CoordinateSystem {
      return this.coordinateSystem;
    }
  
    /**
     * Calculates the 2D distance to another point using Euclidean distance
     * Note: This is only meaningful for Cartesian coordinate systems
     */
    public distanceTo(other: Point): number {
      if (this.coordinateSystem !== other.coordinateSystem) {
        throw new Error('Points must be in the same coordinate system');
      }
      
      if (this.coordinateSystem === CoordinateSystem.GEOGRAPHIC_2D ||
          this.coordinateSystem === CoordinateSystem.GEOGRAPHIC_3D) {
        throw new Error('Use greatCircleDistance() for geographic coordinates');
      }
  
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
  
    /**
     * Calculates the great circle distance to another point using the Haversine formula
     * Only valid for geographic coordinates
     * @returns Distance in meters
     */
    public greatCircleDistance(other: Point): number {
      if (this.coordinateSystem !== CoordinateSystem.GEOGRAPHIC_2D &&
          this.coordinateSystem !== CoordinateSystem.GEOGRAPHIC_3D) {
        throw new Error('Great circle distance only valid for geographic coordinates');
      }
  
      const R = 6371000; // Earth's mean radius in meters
      const φ1 = this.y * Math.PI / 180;
      const φ2 = other.y * Math.PI / 180;
      const Δφ = (other.y - this.y) * Math.PI / 180;
      const Δλ = (other.x - this.x) * Math.PI / 180;
  
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
      return R * c;
    }
  
    /**
     * Creates a copy of this point
     */
    public clone(): Point {
      return new Point(this.x, this.y, this.z, this.srid, this.coordinateSystem);
    }
  
    /**
     * Returns a string representation of the point
     */
    public toString(): string {
      return this.asWKT();
    }
  }
  
  export { Point, CoordinateSystem, Geometry, WKTRepresentable };