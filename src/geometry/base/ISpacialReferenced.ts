export interface ISpatialReferenced {
    getSRID(): number;
    setSRID(srid: number): void;
  }