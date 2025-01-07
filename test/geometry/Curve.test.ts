import { describe, it, expect } from 'vitest';
import { Curve } from '../../src/geometry/Curve';
import { Point } from '../../src/geometry/Point';
import { MultiPoint } from '../../src/geometry/MultiPoint';

// Create a concrete implementation for testing
class TestCurve extends Curve {
    private points: Point[];

    constructor(points: Point[] = []) {
        super();
        this.points = points;
    }

    length(): number {
        if (this.points.length < 2) return 0;
        let totalLength = 0;
        for (let i = 0; i < this.points.length - 1; i++) {
            totalLength += this.points[i].distance(this.points[i + 1]);
        }
        return totalLength;
    }

    startPoint(): Point {
        if (this.isEmpty()) throw new Error("Empty curve");
        return this.points[0];
    }

    endPoint(): Point {
        if (this.isEmpty()) throw new Error("Empty curve");
        return this.points[this.points.length - 1];
    }

    isEmpty(): boolean {
        return this.points.length === 0;
    }
}

describe('Curve', () => {
    // Test 1: Testing curve closure
    it('should correctly identify if a curve is closed', () => {
        // Create a closed curve - square
        const closedCurve = new TestCurve([
            new Point(0, 0),
            new Point(1, 0),
            new Point(1, 1),
            new Point(0, 1),
            new Point(0, 0)  // Back to start
        ]);

        // Create an open curve - L shape
        const openCurve = new TestCurve([
            new Point(0, 0),
            new Point(1, 0),
            new Point(1, 1)
        ]);

        expect(closedCurve.isClosed()).toBe(true);
        expect(openCurve.isClosed()).toBe(false);
    });

    // Test 2: Testing boundary calculation
    it('should correctly calculate the boundary of a curve', () => {
        // Create an open curve
        const curve = new TestCurve([
            new Point(0, 0),
            new Point(1, 1),
            new Point(2, 2)
        ]);

        const boundary = curve.boundary();
        expect(boundary).toBeInstanceOf(MultiPoint);
        
        // For an open curve, boundary should contain start and end points
        const boundaryPoints = boundary as MultiPoint;
        expect(boundaryPoints.numPoints()).toBe(2);
        expect(boundaryPoints.pointN(1).equals(new Point(0, 0))).toBe(true);
        expect(boundaryPoints.pointN(2).equals(new Point(2, 2))).toBe(true);
    });

    // Test 3: Testing length calculation
    it('should calculate correct length for a curve', () => {
        // Create a simple right triangle curve
        const curve = new TestCurve([
            new Point(0, 0),
            new Point(3, 0),
            new Point(3, 4)
        ]);

        // Length should be 3 + 4 = 7 units
        expect(curve.length()).toBe(7);

        // Empty curve should have length 0
        const emptyCurve = new TestCurve();
        expect(emptyCurve.length()).toBe(0);
    });
});