// Surface.ts
import { Geometry } from "./Geometry";  // Ensure this import points to where Geometry is defined

export class Surface extends Geometry {
    constructor() {
        super();  // Calls the constructor of the base class, Geometry
    }

    // You can add methods specific to surfaces here, such as methods to calculate area, check planarity, etc.
}
