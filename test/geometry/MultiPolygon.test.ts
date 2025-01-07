import { describe, it, expect } from 'vitest'
import { MultiPolygon } from '../../src/geometry/MultiPolygon'
import { Polygon } from '../../src/geometry/Polygon'
import { LinearRing } from '../../src/geometry/LinearRing'
import { Point } from '../../src/geometry/Point'

describe('MultiPolygon', () => {
    it('should create an empty MultiPolygon', () => {
        const mp = new MultiPolygon();
        expect(mp.isEmpty()).toBeTruthy();
    });

    it('should add polygons and increase the count accordingly', () => {
        const mp = new MultiPolygon();
        const ring = new LinearRing();
        ring.addPoint(new Point(0, 0));
        ring.addPoint(new Point(1, 0));
        ring.addPoint(new Point(1, 1));
        ring.addPoint(new Point(0, 1));
        ring.addPoint(new Point(0, 0));
        const polygon = new Polygon(ring);
        mp.addPolygon(polygon);
        expect(mp.numPolygons()).toBe(1);
    });

    it('should calculate the correct total area for multiple polygons', () => {
        const mp = new MultiPolygon();
        const ring1 = new LinearRing();
        ring1.addPoint(new Point(0, 0));
        ring1.addPoint(new Point(1, 0));
        ring1.addPoint(new Point(1, 1));
        ring1.addPoint(new Point(0, 1));
        ring1.addPoint(new Point(0, 0));
        const polygon1 = new Polygon(ring1);

        const ring2 = new LinearRing();
        ring2.addPoint(new Point(1, 1));
        ring2.addPoint(new Point(2, 1));
        ring2.addPoint(new Point(2, 2));
        ring2.addPoint(new Point(1, 2));
        ring2.addPoint(new Point(1, 1));
        const polygon2 = new Polygon(ring2);

        mp.addPolygon(polygon1);
        mp.addPolygon(polygon2);
        expect(mp.area()).toBe(2);
    });

    it('should check if a MultiPolygon is simple when no overlapping or intersecting', () => {
        const mp = new MultiPolygon();
        const ring1 = new LinearRing();
        ring1.addPoint(new Point(0, 0));
        ring1.addPoint(new Point(2, 0));
        ring1.addPoint(new Point(2, 2));
        ring1.addPoint(new Point(0, 2));
        ring1.addPoint(new Point(0, 0));
        const polygon1 = new Polygon(ring1);

        const ring2 = new LinearRing();
        ring2.addPoint(new Point(3, 3));
        ring2.addPoint(new Point(4, 3));
        ring2.addPoint(new Point(4, 4));
        ring2.addPoint(new Point(3, 4));
        ring2.addPoint(new Point(3, 3));
        const polygon2 = new Polygon(ring2);

        mp.addPolygon(polygon1);
        mp.addPolygon(polygon2);
        expect(mp.isSimple()).toBeTruthy();
    });

    it('should verify the centroid of a MultiPolygon is calculated correctly', () => {
        const mp = new MultiPolygon();
        const ring1 = new LinearRing();
        ring1.addPoint(new Point(0, 0));
        ring1.addPoint(new Point(4, 0));
        ring1.addPoint(new Point(4, 4));
        ring1.addPoint(new Point(0, 4));
        ring1.addPoint(new Point(0, 0));
        const polygon1 = new Polygon(ring1);

        const ring2 = new LinearRing();
        ring2.addPoint(new Point(5, 5));
        ring2.addPoint(new Point(7, 5));
        ring2.addPoint(new Point(7, 7));
        ring2.addPoint(new Point(5, 7));
        ring2.addPoint(new Point(5, 5));
        const polygon2 = new Polygon(ring2);

        mp.addPolygon(polygon1);
        mp.addPolygon(polygon2);
        const centroid = mp.centroid();
        // Checking the centroid considering the areas of polygons for weighted centroid
        expect(centroid.x()).toBeCloseTo((32/3));
        expect(centroid.y()).toBeCloseTo((32/3));
    });
})
