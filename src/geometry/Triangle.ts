// Triangle.ts
import { Polygon } from "./Polygon";
import { LinearRing } from "./LinearRing";  // Ensure this import if you're using LinearRing to define the triangle

export class Triangle extends Polygon {
    constructor() {
        super();  // Calls the constructor of the base class, Polygon
        // Initialize with a single LinearRing that defines the three edges of the triangle
        this.linearrings = [new LinearRing()];  // Assuming LinearRing can take points defining the triangle
    }

    // You can add methods specific to Triangle here, such as methods to calculate area or check collinearity
}
