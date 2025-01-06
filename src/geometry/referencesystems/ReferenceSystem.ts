// ReferenceSystem.ts

export class ReferenceSystem {
    // Properties common to all reference systems can be added here.
    // For example, a unique identifier or description:
    id: string;
    description: string;

    constructor(id: string, description: string) {
        this.id = id;
        this.description = description;
    }

    // Common methods or utilities for reference systems can be implemented here
    describe(): string {
        return `${this.id} - ${this.description}`;
    }
}
