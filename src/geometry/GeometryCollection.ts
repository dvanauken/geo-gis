// GeometryCollection.ts
import { Geometry } from "./Geometry";
import { Point } from "./Point";

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

    // // Inherited methods that need specific implementation
    // boundary(): Geometry {
    //     // The boundary of a geometry collection is the boundary of 
    //     // the set theoretic union of its elements
    //     throw new Error("Method not implemented");
    // }


    boundary(): Geometry {
        if (this.isEmpty()) {
            return new Point(); // Empty point for empty collection
        }

        // Get boundaries of all elements
        const boundaries = this.items.map(item => item.boundary());

        // Remove empty boundaries
        const nonEmptyBoundaries = boundaries.filter(b => !b.isEmpty());

        if (nonEmptyBoundaries.length === 0) {
            return new Point(); // Empty point if no non-empty boundaries
        }

        // If only one boundary, return it
        if (nonEmptyBoundaries.length === 1) {
            return nonEmptyBoundaries[0];
        }

        // For multiple boundaries, create a composite boundary
        const compositeBoundary = new GeometryCollection<Geometry>();
        nonEmptyBoundaries.forEach(boundary => {
            if (boundary instanceof GeometryCollection) {
                // If boundary is already a collection, add its elements
                for (let i = 1; i <= boundary.numGeometries(); i++) {
                    compositeBoundary.add(boundary.geometryN(i));
                }
            } else {
                compositeBoundary.add(boundary);
            }
        });

        // Now handle overlapping parts by counting occurrences
        // This is a simplified approach - a full implementation would need
        // more sophisticated geometric operations
        const uniqueBoundaries = new Map<string, { geometry: Geometry; count: number }>();

        for (let i = 1; i <= compositeBoundary.numGeometries(); i++) {
            const geom = compositeBoundary.geometryN(i);
            const key = geom.asText(); // Use WKT as a key for comparison
            
            const existing = uniqueBoundaries.get(key);
            if (existing) {
                existing.count++;
            } else {
                uniqueBoundaries.set(key, { geometry: geom, count: 1 });
            }
        }

        // Create final boundary with elements that appear odd number of times
        const finalBoundary = new GeometryCollection<Geometry>();
        uniqueBoundaries.forEach(({ geometry, count }) => {
            if (count % 2 === 1) {
                finalBoundary.add(geometry);
            }
        });

        return finalBoundary;
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