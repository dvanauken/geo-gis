import { CoordinateType } from "./CoordinateType";
import { ICoordinate } from "./ICoordinate";

  /**
   * Base implementation of 2D coordinates
   */
  export class Coordinate2D implements ICoordinate {
    readonly x: number;
    readonly y: number;
    readonly coordinateType: CoordinateType = CoordinateType.XY;
  
    constructor(x: number, y: number) {
      this.validateCoordinate(x, y);
      this.x = x;
      this.y = y;
    }
  
    protected validateCoordinate(x: number, y: number): void {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error('Coordinates must be finite numbers');
      }
    }
  
    equals(other: ICoordinate): boolean {
      const EPSILON = 1e-10;
      return Math.abs(this.x - other.x) < EPSILON &&
             Math.abs(this.y - other.y) < EPSILON;
    }
  
    clone(): ICoordinate {
      return new Coordinate2D(this.x, this.y);
    }
  
    toString(): string {
      return `(${this.x}, ${this.y})`;
    }
  }