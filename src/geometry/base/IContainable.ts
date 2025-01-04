import { Point } from "./Point";

export interface IContainable {
    contains(point: Point): boolean;
  }