import { CoordinateSystem } from "./CoordinateSystem";
import { Point } from "./Point";
import { WKTRepresentable } from "./WKTRepresentable";

export interface Geometry extends WKTRepresentable {
    isEmpty(): boolean;
    is3D(): boolean;
    dimension(): number;
    getSRID(): number;
    setSRID(srid: number): void;
    getGeometryType(): string;
    equals(other: Geometry): boolean;
    getCoordinateSystem(): CoordinateSystem;
    clone(): Geometry;
    contains(point: Point): boolean;
  }