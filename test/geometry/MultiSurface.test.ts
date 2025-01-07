import { describe, it, expect } from 'vitest'
import { MultiSurface } from '../../src/geometry/MultiSurface'
import { Surface } from '../../src/geometry/Surface'
import { Point } from '../../src/geometry/Point'
import { MultiCurve } from '../../src/geometry/MultiCurve';

// Mock class for Surface to use in testing MultiSurface
class TestSurface extends Surface {
    
    constructor(private areaValue: number, private centroidPoint: Point) {
        super();
    }

    area(): number {
        return this.areaValue;
    }

    centroid(): Point {
        return this.centroidPoint;
    }

    pointOnSurface(): Point {
        throw new Error('Method not implemented.');
    }

    boundary(): MultiCurve {
        throw new Error('Method not implemented.');
    }

    isEmpty(): boolean {
        return this.areaValue === 0;
    }

    geometryType(): string {
        return "TestSurface";
    }
}

describe('MultiSurface', () => {
    it('should create an empty MultiSurface and confirm it is empty', () => {
        const ms = new MultiSurface();
        expect(ms.isEmpty()).toBeTruthy();
    });

    // it('should correctly calculate the total area of all surfaces', () => {
    //     const ms = new MultiSurface();
    //     ms.add(new TestSurface(10, new Point(1, 1)));
    //     ms.add(new TestSurface(20, new Point(2, 2)));
    //     ms.add(new TestSurface(30, new Point(3, 3)));
    //     expect(ms.area()).toBe(60);
    // });

    // it('should calculate the centroid of the MultiSurface', () => {
    //     const ms = new MultiSurface();
    //     ms.add(new TestSurface(10, new Point(0, 0)));
    //     ms.add(new TestSurface(40, new Point(4, 4)));  // This has more weight
    //     const centroid = ms.centroid();
    //     // Weighted average centroid calculation
    //     expect(centroid.x()).toBeCloseTo(3.2);
    //     expect(centroid.y()).toBeCloseTo(3.2);
    // });

    // it('should return true for isSimple if all surfaces are simple and do not intersect', () => {
    //     const ms = new MultiSurface();
    //     // Assuming TestSurface is always simple and non-intersecting for this test
    //     ms.add(new TestSurface(10, new Point(0, 0)));
    //     ms.add(new TestSurface(20, new Point(10, 10)));
    //     expect(ms.isSimple()).toBeTruthy();
    // });

    it('should correctly handle the addition of multiple surfaces', () => {
        const ms = new MultiSurface();
        ms.add(new TestSurface(10, new Point(1, 1)));
        ms.add(new TestSurface(20, new Point(2, 2)));
        expect(ms.numGeometries()).toBe(2);
    });
})
