// MultiSurface.ts
import { GeometryCollection } from "./GeometryCollection";
import { Surface } from "./Surface";

export class MultiSurface extends GeometryCollection<Surface> {
    constructor() {
        super();  // Initializes the items array with type Surface
    }

    // Additional methods specific to Surface can be added here
}
