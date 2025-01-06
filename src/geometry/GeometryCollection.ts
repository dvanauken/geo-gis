import { Geometry } from "./Geometry";

// GeometryCollection.ts
export class GeometryCollection<T> {
    items: T[];

    constructor() {
        this.items = new Array<T>();
    }
}

