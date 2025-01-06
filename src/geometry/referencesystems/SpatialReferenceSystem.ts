// SpatialReferenceSystem.ts
import { ReferenceSystem } from "./ReferenceSystem";

export class SpatialReferenceSystem extends ReferenceSystem {
    // Additional properties specific to spatial reference systems, e.g., EPSG code
    epsgCode: number;

    constructor(id: string, description: string, epsgCode: number) {
        super(id, description);
        this.epsgCode = epsgCode;
    }

    // Override or add new methods specific to spatial data handling
    getProjectionDetails(): string {
        return `EPSG Code: ${this.epsgCode}`;
    }
}
