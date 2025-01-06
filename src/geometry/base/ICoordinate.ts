import { CoordinateType } from "./CoordinateType";

export interface ICoordinate {
    x: number;
    y: number;
    z?: number;
    m?: number;
    coordinateType: CoordinateType;
    equals(other: ICoordinate): boolean;
    clone(): ICoordinate;
    toString(): string;
    getM?(): number;
  }
  