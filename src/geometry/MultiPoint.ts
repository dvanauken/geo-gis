// MultiPoint.ts
import { GeometryCollection } from "./GeometryCollection";
import { Point } from "./Point";

export class MultiPoint extends GeometryCollection<Point> {
    constructor() {
        super();  // Initializes GeometryCollection to handle an array of Point objects
    }

    // Additional methods specific to MultiPoint can be added here
}
