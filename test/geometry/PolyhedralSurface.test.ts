import { describe, it, expect } from 'vitest'
import { LinearRing } from '../../src/geometry/LinearRing';
import { Point } from '../../src/geometry/Point';
import { PolyhedralSurface } from '../../src/geometry/PolyhedralSurface';
import { Polygon } from '../../src/geometry/Polygon';

describe('PolyhedralSurface', () => {
    it('should calculate the total area correctly for multiple polygons', () => {
        const surface = new PolyhedralSurface();
        const ring1 = new LinearRing();
        ring1.addPoint(new Point(0, 0));
        ring1.addPoint(new Point(4, 0));
        ring1.addPoint(new Point(4, 4));
        ring1.addPoint(new Point(0, 4));
        ring1.addPoint(new Point(0, 0));
        const polygon1 = new Polygon(ring1);

        const ring2 = new LinearRing();
        ring2.addPoint(new Point(0, 0));
        ring2.addPoint(new Point(3, 0));
        ring2.addPoint(new Point(3, 3));
        ring2.addPoint(new Point(0, 3));
        ring2.addPoint(new Point(0, 0));
        const polygon2 = new Polygon(ring2);

        surface.addPatch(polygon1);
        surface.addPatch(polygon2);
        expect(surface.area()).toBe(25); // 16 from polygon1 and 9 from polygon2
    });

    it('should return true for isEmpty when no polygons are added', () => {
        const surface = new PolyhedralSurface();
        expect(surface.isEmpty()).toBeTruthy();
    });

    it('should return false for isClosed if not all edges are shared exactly once by two polygons', () => {
        const surface = new PolyhedralSurface();
        const ring1 = new LinearRing();
        ring1.addPoint(new Point(0, 0));
        ring1.addPoint(new Point(4, 0));
        ring1.addPoint(new Point(4, 4));
        ring1.addPoint(new Point(0, 4));
        ring1.addPoint(new Point(0, 0));
        const polygon1 = new Polygon(ring1);

        const ring2 = new LinearRing();
        ring2.addPoint(new Point(4, 0));
        ring2.addPoint(new Point(8, 0));
        ring2.addPoint(new Point(8, 4));
        ring2.addPoint(new Point(4, 4));
        ring2.addPoint(new Point(4, 0));
        const polygon2 = new Polygon(ring2);

        surface.addPatch(polygon1);
        surface.addPatch(polygon2);
        expect(surface.isClosed()).toBeFalsy(); // Edges at (4,0)-(4,4) are shared twice
    });
})
