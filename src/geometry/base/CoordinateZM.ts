import { Coordinate3D } from "./Coordinate3d";
import { CoordinateType } from "./CoordinateType";
import { ICoordinate } from "./ICoordinate";

/**
 * Implementation of 3D coordinates with measure
 */
export class CoordinateZM extends Coordinate3D implements ICoordinate {
  readonly m: number;
  readonly coordinateType: CoordinateType = CoordinateType.XYZM;

  constructor(x: number, y: number, z: number, m: number) {
    super(x, y, z);
    this.validateM(m);
    this.m = m;
  }

  protected validateM(m: number): void {
    if (!Number.isFinite(m)) {
      throw new Error('M value must be a finite number');
    }
  }

  // In CoordinateM.ts and CoordinateZM.ts similarly
  override equals(other: ICoordinate): boolean {
    const EPSILON = 1e-10;
    if (!('m' in other)) return false;
    return super.equals(other) && Math.abs(this.m - other.m!) < EPSILON;
  }

  override clone(): ICoordinate {
    return new CoordinateZM(this.x, this.y, this.z, this.m);
  }

  override toString(): string {
    return `(${this.x}, ${this.y}, ${this.z}, M=${this.m})`;
  }
}
