import { describe, it, expect } from 'vitest'
import { MultiPoint } from '../../src/geometry/MultiPoint'
import { Point } from '../../src/geometry/Point'

describe('MultiPoint', () => {
    it('should create an empty MultiPoint', () => {
        const mp = new MultiPoint();
        expect(mp.isEmpty()).toBeTruthy();
    });

    it('should add points to the MultiPoint and return the correct count', () => {
        const mp = new MultiPoint();
        mp.addPoint(new Point(1, 1));
        mp.addPoint(new Point(2, 2));
        expect(mp.numPoints()).toBe(2);
    });

    it('should correctly identify if a point is contained within the MultiPoint', () => {
        const mp = new MultiPoint();
        const p1 = new Point(1, 1);
        const p2 = new Point(2, 2);
        mp.addPoint(p1);
        mp.addPoint(p2);
        expect(mp.contains(p1)).toBeTruthy();
        expect(mp.contains(new Point(3, 3))).toBeFalsy();
    });

    it('should calculate the correct centroid for multiple points', () => {
        const mp = new MultiPoint();
        mp.addPoint(new Point(0, 0));
        mp.addPoint(new Point(2, 0));
        mp.addPoint(new Point(2, 2));
        mp.addPoint(new Point(0, 2));
        const centroid = mp.centroid();
        expect(centroid.x()).toBeCloseTo(1);
        expect(centroid.y()).toBeCloseTo(1);
    });

    it('should return the correct point when accessed by index', () => {
        const mp = new MultiPoint();
        const p1 = new Point(1, 1);
        const p2 = new Point(2, 2);
        mp.addPoint(p1);
        mp.addPoint(p2);
        expect(mp.pointN(1)).toEqual(p1);
        expect(mp.pointN(2)).toEqual(p2);
    });
})
