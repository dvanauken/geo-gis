// MultiSurface.ts
import { GeometryCollection } from "./GeometryCollection";
import { Surface } from "./Surface";  // Ensure this import points to where Surface is defined

export class MultiSurface extends GeometryCollection<Surface> {
    constructor() {
        super();  // Calls constructor of GeometryCollection, initializing items array for Surfaces
    }

    // Additional methods specific to handling surfaces can be added here
}
