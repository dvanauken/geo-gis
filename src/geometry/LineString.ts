// LineString.ts
import { Curve } from "./Curve";
import { Point } from "./Point";

export class LineString extends Curve {
    points: Point[];

    constructor() {
        super();
        this.points = new Array<Point>();  // Initializes points as an array of Point objects
    }
}
