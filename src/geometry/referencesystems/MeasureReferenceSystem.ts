// MeasureReferenceSystem.ts

export class MeasureReferenceSystem {
    // Properties commonly associated with a measurement reference system
    unitOfMeasure: string;
    description: string;

    constructor(unitOfMeasure: string, description: string) {
        this.unitOfMeasure = unitOfMeasure;
        this.description = description;
    }

    // Method to provide a description of the measurement reference system
    describe(): string {
        return `${this.description} (Unit: ${this.unitOfMeasure})`;
    }
}
