import { describe, it, expect } from 'vitest';
import { Surface } from '../../src/geometry/Surface';
import { Point } from '../../src/geometry/Point';
import { MultiCurve } from '../../src/geometry/MultiCurve';
import { LineString } from '../../src/geometry/LineString';

// Create a concrete test implementation of Surface
class TestSurface extends Surface {
    private _area: number;
    private _boundary: MultiCurve;
    private _centroidPoint: Point;

    constructor(area: number = 0) {
        super();
        this._area = area;
        this._boundary = new MultiCurve();
        this._centroidPoint = new Point(0, 0);
    }

    area(): number {
        return this._area;
    }

    pointOnSurface(): Point {
        return this._centroidPoint;
    }

    centroid(): Point {
        return this._centroidPoint;
    }

    boundary(): MultiCurve {
        return this._boundary;
    }

    // Method to set up boundary for testing
    setBoundary(boundary: MultiCurve): void {
        this._boundary = boundary;
    }

    // Method to set centroid for testing
    setCentroid(point: Point): void {
        this._centroidPoint = point;
    }
}

describe('Surface', () => {
    // Test 1: Basic surface properties and emptiness
    it('should correctly determine if surface is empty based on area', () => {
        const emptyArea = 0;
        const nonEmptyArea = 100;

        const emptySurface = new TestSurface(emptyArea);
        const nonEmptySurface = new TestSurface(nonEmptyArea);

        expect(emptySurface.isEmpty()).toBe(true);
        expect(nonEmptySurface.isEmpty()).toBe(false);
        
        // Test other basic properties
        expect(emptySurface.geometryType()).toBe('SURFACE');
        expect(emptySurface.isSimple()).toBe(true);
        expect(emptySurface.isPlanar()).toBe(true);
        expect(emptySurface.isRegular()).toBe(true);
    });

    // // Test 2: Point containment with boundary check
    // it('should correctly determine if a point is contained on boundary', () => {
    //     const surface = new TestSurface(100);
    //     const boundaryLine = new LineString();
    //     boundaryLine.addPoint(new Point(0, 0));
    //     boundaryLine.addPoint(new Point(10, 0));

    //     const multiCurve = new MultiCurve();
    //     multiCurve.addCurve(boundaryLine);
    //     surface.setBoundary(multiCurve);

    //     // Test point on boundary
    //     const boundaryPoint = new Point(5, 0);
    //     expect(surface.contains(boundaryPoint)).toBe(true);

    //     // Test point clearly outside
    //     const outsidePoint = new Point(20, 20);
    //     expect(surface.contains(outsidePoint)).toBe(false);
    // });

    // Test 3: Empty surface behavior
    it('should handle empty surface correctly', () => {
        const emptySurface = new TestSurface(0);
        const point = new Point(1, 1);

        // Empty surface should not contain any points
        expect(emptySurface.contains(point)).toBe(false);
        
        // Empty surface properties
        expect(emptySurface.hasInteriorRings()).toBe(false);
        expect(emptySurface.area()).toBe(0);
        expect(emptySurface.isEmpty()).toBe(true);

        // Basic geometric properties should still be valid
        expect(emptySurface.isSimple()).toBe(true);
        expect(emptySurface.isPlanar()).toBe(true);
    });
});