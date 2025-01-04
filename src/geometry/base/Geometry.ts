import { WKTRepresentable } from "./WKTRepresentable";

export interface Geometry extends WKTRepresentable {
    isEmpty(): boolean;
    is3D(): boolean;
    dimension(): number;
    getSRID(): number;
    setSRID(srid: number): void;
    getGeometryType(): string;
    equals(other: Geometry): boolean;
  }