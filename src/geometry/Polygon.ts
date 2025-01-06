// Polygon.ts
import { Surface } from "./Surface";  // Make sure this import points to where Surface is defined
import { LinearRing } from "./LinearRing";  // Importing LinearRing

export class Polygon extends Surface {
    linearrings: LinearRing[];  // An array to store LinearRing objects

    constructor() {
        super();  // Calls the constructor of the base class, Surface
        this.linearrings = new Array<LinearRing>();  // Initializes the array of LinearRing objects
    }

    // You can add methods specific to Polygon here, such as methods to calculate area, perimeter, etc.
}
