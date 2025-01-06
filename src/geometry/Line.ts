// LineString.ts
import { Curve } from "./Curve";
import { Point } from "./Point";  // Explicitly handle Point objects

export class LineString extends Curve {
    points: Point[];

    constructor() {
        super();
        this.points = new Array<Point>();  // Initialize points array for storing Point objects
    }
}
