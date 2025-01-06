// PolyhedralSurface.ts
import { Surface } from "./Surface";  // Ensure this import points to where Surface is defined
import { Polygon } from "./Polygon";  // Importing Polygon

export class PolyhedralSurface extends Surface {
    polygons: Polygon[];  // An array to store Polygon objects

    constructor() {
        super();  // Calls the constructor of the base class, Surface
        this.polygons = new Array<Polygon>();  // Initializes the array of Polygon objects
    }

    // You can add methods specific to PolyhedralSurface here, such as methods to calculate total area, volume, etc.
}
