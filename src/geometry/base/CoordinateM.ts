import { Coordinate2D } from "./Coordinate2d";
import { CoordinateType } from "./CoordinateType";
import { ICoordinate } from "./ICoordinate";

/**
 * Implementation of 2D coordinates with measure
 */
export class CoordinateM extends Coordinate2D implements ICoordinate {
  readonly m: number;
  readonly coordinateType: CoordinateType = CoordinateType.XYM;

  constructor(x: number, y: number, m: number) {
    super(x, y);
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
    return new CoordinateM(this.x, this.y, this.m);
  }

  override toString(): string {
    return `(${this.x}, ${this.y}, M=${this.m})`;
  }
}
