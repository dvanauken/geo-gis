import { describe, it, expect } from 'vitest';
import { Geometry } from '../../src/geometry/Geometry';

// Create a concrete implementation for testing since Geometry is abstract
class TestGeometry extends Geometry {
    private _isEmpty: boolean;

    constructor(isEmpty: boolean = false) {
        super();
        this._isEmpty = isEmpty;
    }

    isEmpty(): boolean {
        return this._isEmpty;
    }
}

describe('Geometry', () => {
    // Test 1: Basic geometry type identification
    it('should return correct geometry type', () => {
        const geometry = new TestGeometry();
        expect(geometry.geometryType()).toBe('GEOMETRY');
    });

    // Test 2: Testing equality comparison
    it('should correctly compare two geometries for equality', () => {
        const geometry1 = new TestGeometry();
        const geometry2 = new TestGeometry();
        const geometry3 = new TestGeometry();
        
        // Same instance comparison
        expect(geometry1.equals(geometry1)).toBe(true);
        
        // Different instances comparison
        expect(geometry1.equals(geometry2)).toBe(false);
        expect(geometry2.equals(geometry3)).toBe(false);
    });

    // Test 3: Testing WKT (Well-Known Text) representation
    it('should provide correct WKT representation', () => {
        const geometry = new TestGeometry();
        expect(geometry.asText()).toBe('GEOMETRY');
        
        const emptyGeometry = new TestGeometry(true);
        expect(emptyGeometry.asText()).toBe('GEOMETRY');
    });
});