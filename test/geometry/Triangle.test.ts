import { describe, it, expect } from 'vitest'
import { Triangle } from '../../src/geometry/Triangle'
import { Point } from '../../src/geometry/Point'

describe('Triangle', () => {
    // it('should calculate the correct area', () => {
    //     const triangle = new Triangle(new Point(0, 0), new Point(4, 0), new Point(0, 3));
    //     expect(triangle.area()).toBe(6);  // Area = 0.5 * base * height = 0.5 * 4 * 3
    // });

    // it('should correctly identify vertices as collinear or not', () => {
    //     const collinearTriangle = new Triangle(new Point(0, 0), new Point(1, 1), new Point(2, 2));
    //     expect(collinearTriangle.isValid()).toBeFalsy();

    //     const validTriangle = new Triangle(new Point(0, 0), new Point(4, 0), new Point(0, 3));
    //     expect(validTriangle.isValid()).toBeTruthy();
    // });

    // it('should compute the correct centroid', () => {
    //     const triangle = new Triangle(new Point(0, 0), new Point(6, 0), new Point(3, 6));
    //     const centroid = triangle.centroid();
    //     // Centroid formula: (x1 + x2 + x3) / 3, (y1 + y2 + y3) / 3
    //     expect(centroid.x()).toBeCloseTo(3);
    //     expect(centroid.y()).toBeCloseTo(2);
    // });

    // it('should determine if a point is inside the triangle', () => {
    //     const triangle = new Triangle(new Point(0, 0), new Point(6, 0), new Point(3, 6));
    //     const insidePoint = new Point(3, 2);
    //     const outsidePoint = new Point(3, 7);
    //     expect(triangle.contains(insidePoint)).toBeTruthy();
    //     expect(triangle.contains(outsidePoint)).toBeFalsy();
    // });

    // it('should return the correct vertices', () => {
    //     const triangle = new Triangle(new Point(0, 0), new Point(1, 0), new Point(0, 1));
    //     const vertices = triangle.getVertices();
    //     expect(vertices).toContainEqual(new Point(0, 0));
    //     expect(vertices).toContainEqual(new Point(1, 0));
    //     expect(vertices).toContainEqual(new Point(0, 1));
    // });
})
