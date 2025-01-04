import { Coordinate2D } from "./Coordinate2d";
import { Coordinate3D } from "./Coordinate3d";
import { CoordinateM } from "./CoordinateM";
import { CoordinateZM } from "./CoordinateZM";
import { ICoordinate } from "./ICoordinate";

  /**
   * Factory class for creating coordinates
   */
  export class CoordinateFactory {
    /**
     * Creates a coordinate of the appropriate type based on input values
     */
    static create(x: number, y: number, z?: number, m?: number): ICoordinate {
      if (z !== undefined && m !== undefined) {
        return new CoordinateZM(x, y, z, m);
      } else if (z !== undefined) {
        return new Coordinate3D(x, y, z);
      } else if (m !== undefined) {
        return new CoordinateM(x, y, m);
      } else {
        return new Coordinate2D(x, y);
      }
    }
  
    /**
     * Creates a coordinate from an existing one, optionally adding Z or M values
     */
    static from(coord: ICoordinate, z?: number, m?: number): ICoordinate {
      if (z !== undefined && m !== undefined) {
        return new CoordinateZM(coord.x, coord.y, z, m);
      } else if (z !== undefined) {
        return new Coordinate3D(coord.x, coord.y, z);
      } else if (m !== undefined) {
        return new CoordinateM(coord.x, coord.y, m);
      } else {
        return new Coordinate2D(coord.x, coord.y);
      }
    }
  }