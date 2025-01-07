import { describe, it, expect } from 'vitest'
import { LinearRing } from '../../src/geometry/LinearRing.ts'
import { Point } from '../../src/geometry/Point.ts';

describe('LinearRing', () => {
    it('should enforce closure by having the first and last points equal', () => {
        const points = [new Point(0, 0), new Point(1, 1), new Point(2, 2)];
        const ring = new LinearRing();
        points.forEach(point => ring.addPoint(point));
        expect(ring.points[0]).toEqual(ring.points[ring.points.length - 1]);
    });

    it('should only be valid if it has at least 4 points and is closed without self-intersections', () => {
        const ring = new LinearRing();
        ring.addPoint(new Point(0, 0));
        ring.addPoint(new Point(1, 1));
        ring.addPoint(new Point(1, 0));
        ring.addPoint(new Point(0, 0)); // Ensures closure
        expect(ring.isValid()).toBeTruthy();
        ring.addPoint(new Point(0.5, 0.5)); 
        expect(ring.isValid()).toBeFalsy();
    });

    it('should correctly identify the orientation of points in the ring', () => {
        const ccwRing = new LinearRing();
        ccwRing.addPoint(new Point(0, 0));
        ccwRing.addPoint(new Point(1, 0));
        ccwRing.addPoint(new Point(1, 1));
        ccwRing.addPoint(new Point(0, 1));
        ccwRing.addPoint(new Point(0, 0)); // Closure
        expect(ccwRing.isCounterClockwise()).toBeTruthy();
        expect(ccwRing.isClockwise()).toBeFalsy();

        const cwRing = new LinearRing();
        cwRing.addPoint(new Point(0, 0));
        cwRing.addPoint(new Point(0, 1));
        cwRing.addPoint(new Point(1, 1));
        cwRing.addPoint(new Point(1, 0));
        cwRing.addPoint(new Point(0, 0)); // Closure
        expect(cwRing.isCounterClockwise()).toBeFalsy();
        expect(cwRing.isClockwise()).toBeTruthy();
    });
});
