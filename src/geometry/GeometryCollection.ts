// GeometryCollection.ts
import { Geometry } from "./Geometry";

export class GeometryCollection<T extends Geometry> extends Geometry {
    items: T[];

    constructor() {
        super();
        this.items = new Array<T>();
    }

    // Required methods from Geometry
    geometryType(): string {
        return 'GEOMETRYCOLLECTION';
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    equals(another: Geometry): boolean {
        if (!(another instanceof GeometryCollection)) {
            return false;
        }

        if (this.items.length !== another.items.length) {
            return false;
        }

        // Check if all geometries match (order doesn't matter)
        return this.items.every(item => 
            another.items.some(otherItem => item.equals(otherItem))
        );
    }

    // GeometryCollection specific methods required by spec
    numGeometries(): number {
        return this.items.length;
    }

    geometryN(n: number): T {
        if (n < 1 || n > this.items.length) {
            throw new Error("Geometry index out of range");
        }
        return this.items[n - 1];  // Convert from 1-based to 0-based indexing
    }

    // Inherited methods that need specific implementation
    boundary(): Geometry {
        // The boundary of a geometry collection is the boundary of 
        // the set theoretic union of its elements
        throw new Error("Method not implemented");
    }

    // isSimple(): boolean {
    //     // A GeometryCollection is simple if all its elements are simple
    //     return this.items.every(item => item.isSimple());
    // }

    // WKT representation
    asText(): string {
        if (this.isEmpty()) {
            return "GEOMETRYCOLLECTION EMPTY";
        }

        const geometriesText = this.items
            .map(item => item.asText())
            .join(", ");

        return `GEOMETRYCOLLECTION (${geometriesText})`;
    }

    // Additional utility methods
    add(geometry: T): void {
        this.items.push(geometry);
    }

    remove(geometry: T): boolean {
        const index = this.items.findIndex(item => item.equals(geometry));
        if (index !== -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }

    clear(): void {
        this.items = [];
    }

    // Check if collection contains a specific geometry
    contains(geometry: T): boolean {
        return this.items.some(item => item.equals(geometry));
    }

    // Get all geometries of a specific type
    getGeometriesOfType(geometryType: string): T[] {
        return this.items.filter(item => 
            item.geometryType() === geometryType
        );
    }

    // Transform all geometries using a provided function
    transform(transformer: (geometry: T) => T): GeometryCollection<T> {
        const transformed = new GeometryCollection<T>();
        this.items.forEach(item => {
            transformed.add(transformer(item));
        });
        return transformed;
    }
}