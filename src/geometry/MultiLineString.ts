// MultiLineString.ts
import { GeometryCollection } from "./GeometryCollection";
import { LineString } from "./LineString";

export class MultiLineString extends GeometryCollection<LineString> {
    constructor() {
        super();  // Initializes the items array with type LineString
    }

    // Additional methods specific to LineString can be added here
}
