import { describe, it, expect } from 'vitest'
import { TIN } from '../../src/geometry/TIN'
import { Triangle } from '../../src/geometry/Triangle'
import { Point } from '../../src/geometry/Point'

describe('TIN', () => {
    it('should create an empty TIN and confirm it is empty', () => {
        const tin = new TIN();
        expect(tin.isEmpty()).toBeTruthy();
    });

    // it('should add triangles and increase the triangle count', () => {
    //     const tin = new TIN();
    //     const triangle1 = new Triangle(new Point(0, 0), new Point(1, 0), new Point(0, 1));
    //     const triangle2 = new Triangle(new Point(1, 1), new Point(2, 1), new Point(1, 2));
    //     tin.addTriangle(triangle1);
    //     tin.addTriangle(triangle2);
    //     expect(tin.numTriangles()).toBe(2);
    // });

    // it('should calculate the correct area for multiple triangles', () => {
    //     const tin = new TIN();
    //     const triangle1 = new Triangle(new Point(0, 0), new Point(1, 0), new Point(0, 1));
    //     const triangle2 = new Triangle(new Point(1, 1), new Point(2, 1), new Point(1, 2));
    //     tin.addTriangle(triangle1);
    //     tin.addTriangle(triangle2);
    //     expect(tin.area()).toBeCloseTo(1.5); // Assuming each triangle is 0.5 area
    // });

    // it('should return true for isClosed if the TIN forms a closed surface', () => {
    //     const tin = new TIN();
    //     // Assuming that isClosed checks if all edges are shared by exactly two triangles
    //     // This setup is hypothetical and must reflect actual logic from TIN implementation
    //     const triangle1 = new Triangle(new Point(0, 0), new Point(1, 0), new Point(0, 1));
    //     const triangle2 = new Triangle(new Point(1, 0), new Point(1, 1), new Point(0, 1));
    //     tin.addTriangle(triangle1);
    //     tin.addTriangle(triangle2);
    //     expect(tin.isClosed()).toBeTruthy();
    // });

    // it('should correctly identify neighboring triangles', () => {
    //     const tin = new TIN();
    //     const triangle1 = new Triangle(new Point(0, 0), new Point(1, 0), new Point(0, 1));
    //     const triangle2 = new Triangle(new Point(1, 0), new Point(1, 1), new Point(0, 1));
    //     const triangle3 = new Triangle(new Point(2, 0), new Point(3, 0), new Point(2, 1)); // Not a neighbor
    //     tin.addTriangle(triangle1);
    //     tin.addTriangle(triangle2);
    //     tin.addTriangle(triangle3);
    //     const neighbors = tin.getNeighbors(triangle1);
    //     expect(neighbors).toContain(triangle2);
    //     expect(neighbors).not.toContain(triangle3);
    // });
})
