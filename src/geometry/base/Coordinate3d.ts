import { Coordinate2D } from "./Coordinate2d";
import { CoordinateType } from "./CoordinateType";
import { ICoordinate } from "./ICoordinate";

  /**
   * Implementation of 3D coordinates
   */
  export class Coordinate3D extends Coordinate2D implements ICoordinate {
    readonly z: number;
    readonly coordinateType: CoordinateType = CoordinateType.XYZ;
  
    constructor(x: number, y: number, z: number) {
      super(x, y);
      this.validateZ(z);
      this.z = z;
    }
  
    protected validateZ(z: number): void {
      if (!Number.isFinite(z)) {
        throw new Error('Z coordinate must be a finite number');
      }
    }
  
    override equals(other: ICoordinate): boolean {
      const EPSILON = 1e-10;
      if (!('z' in other)) return false;
      return super.equals(other) && Math.abs(this.z - other.z!) < EPSILON;
    }
    
  
    override clone(): ICoordinate {
      return new Coordinate3D(this.x, this.y, this.z);
    }
  
    override toString(): string {
      return `(${this.x}, ${this.y}, ${this.z})`;
    }
  }
  