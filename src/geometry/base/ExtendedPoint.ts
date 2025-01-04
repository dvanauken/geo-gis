import { Coordinate2D } from "./Coordinate2d";
import { Coordinate3D } from "./Coordinate3d";
import { CoordinateFactory } from "./CoordinateFactory";
import { CoordinateM } from "./CoordinateM";
import { CoordinateType } from "./CoordinateType";
import { CoordinateZM } from "./CoordinateZM";
import { ICoordinate } from "./ICoordinate";

  /**
   * Extended Point class supporting Z and M values
   */
  export class ExtendedPoint {
    private readonly coordinate: ICoordinate;
  
    constructor(coord: ICoordinate) {
      this.coordinate = coord;
    }
  
    getX(): number {
      return this.coordinate.x;
    }
  
    getY(): number {
      return this.coordinate.y;
    }
  
    getZ(): number | undefined {
      return 'z' in this.coordinate ? this.coordinate.z : undefined;
    }
  
    getM(): number | undefined {
      return 'm' in this.coordinate ? this.coordinate.m : undefined;
    }
  
    hasZ(): boolean {
      return this.coordinate.coordinateType === CoordinateType.XYZ ||
             this.coordinate.coordinateType === CoordinateType.XYZM;
    }
  
    hasM(): boolean {
      return this.coordinate.coordinateType === CoordinateType.XYM ||
             this.coordinate.coordinateType === CoordinateType.XYZM;
    }
  
    getCoordinateType(): CoordinateType {
      return this.coordinate.coordinateType;
    }
  
    equals(other: ExtendedPoint): boolean {
      return this.coordinate.equals(other.coordinate);
    }
  
    clone(): ExtendedPoint {
      return new ExtendedPoint(this.coordinate.clone());
    }
  
    /**
     * Converts to a new point with different coordinate type
     */
    convert(type: CoordinateType): ExtendedPoint {
      switch (type) {
        case CoordinateType.XY:
          return new ExtendedPoint(new Coordinate2D(this.getX(), this.getY()));
        
        case CoordinateType.XYZ:
          if (!this.hasZ()) {
            throw new Error('Cannot convert to XYZ: No Z value present');
          }
          return new ExtendedPoint(
            new Coordinate3D(this.getX(), this.getY(), this.getZ()!)
          );
        
        case CoordinateType.XYM:
          if (!this.hasM()) {
            throw new Error('Cannot convert to XYM: No M value present');
          }
          return new ExtendedPoint(
            new CoordinateM(this.getX(), this.getY(), this.getM()!)
          );
        
        case CoordinateType.XYZM:
          if (!this.hasZ() || !this.hasM()) {
            throw new Error('Cannot convert to XYZM: Missing Z or M value');
          }
          return new ExtendedPoint(
            new CoordinateZM(this.getX(), this.getY(), this.getZ()!, this.getM()!)
          );
      }
    }
  
    /**
     * Interpolates between two points
     * @param other Point to interpolate to
     * @param t Interpolation parameter (0 to 1)
     */
    interpolate(other: ExtendedPoint, t: number): ExtendedPoint {
      if (t < 0 || t > 1) {
        throw new Error('Interpolation parameter must be between 0 and 1');
      }
  
      const x = this.getX() + (other.getX() - this.getX()) * t;
      const y = this.getY() + (other.getY() - this.getY()) * t;
      
      const z = this.hasZ() && other.hasZ()
        ? this.getZ()! + (other.getZ()! - this.getZ()!) * t
        : undefined;
      
      const m = this.hasM() && other.hasM()
        ? this.getM()! + (other.getM()! - this.getM()!) * t
        : undefined;
  
      return new ExtendedPoint(CoordinateFactory.create(x, y, z, m));
    }
  
    toString(): string {
      return this.coordinate.toString();
    }
  }
  