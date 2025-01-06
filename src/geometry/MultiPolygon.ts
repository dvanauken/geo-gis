// MultiPolygon.ts
import { GeometryCollection } from "./GeometryCollection";
import { Polygon } from "./Polygon";

export class MultiPolygon extends GeometryCollection<Polygon> {
    constructor() {
        super();  // Initializes the items array with type Polygon
    }

    // Additional methods specific to Polygon can be added here
}
