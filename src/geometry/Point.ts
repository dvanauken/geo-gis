// Point.ts
import { Geometry } from "./Geometry";  // Make sure this import points to where Geometry is defined

export class Point extends Geometry {
    // Properties specific to Point can be added here. For example:
    // x: number;
    // y: number;

    constructor() {
        super();  // Calls the constructor of the base class, Geometry
        // Initialize properties if any are added
        // this.x = 0;
        // this.y = 0;
    }

    // You can add methods specific to Point, such as distance calculations, etc.
}
