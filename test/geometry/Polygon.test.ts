import { describe, it, expect } from 'vitest';
import { Polygon } from '../../src/geometry/Polygon';
import { LinearRing } from '../../src/geometry/LinearRing';
import { Point } from '../../src/geometry/Point';

describe('Polygon', () => {
    // Test 1: Creating and manipulating a simple polygon
    it('should correctly create a simple polygon with an exterior ring', () => {
        const polygon = new Polygon();
        const exteriorRing = new LinearRing();
        
        // Create a square
        exteriorRing.addPoint(new Point(0, 0));
        exteriorRing.addPoint(new Point(10, 0));
        exteriorRing.addPoint(new Point(10, 10));
        exteriorRing.addPoint(new Point(0, 10));
        exteriorRing.addPoint(new Point(0, 0));  // Close the ring

        polygon.setExteriorRing(exteriorRing);

        // Verify the polygon's exterior ring
        expect(polygon.exteriorRing().numPoints()).toBe(5);
        expect(polygon.area()).toBe(100); // 10 x 10 square
        expect(polygon.isEmpty()).toBe(false);
    });

    // Test 2: Creating a polygon with a hole (interior ring)
    it('should handle polygon with an interior ring (hole)', () => {
        const polygon = new Polygon();
        
        // Create exterior ring (10x10 square)
        const exteriorRing = new LinearRing();
        exteriorRing.addPoint(new Point(0, 0));
        exteriorRing.addPoint(new Point(10, 0));
        exteriorRing.addPoint(new Point(10, 10));
        exteriorRing.addPoint(new Point(0, 10));
        exteriorRing.addPoint(new Point(0, 0));
        
        // Create interior ring (2x2 square hole in middle)
        const interiorRing = new LinearRing();
        interiorRing.addPoint(new Point(4, 4));
        interiorRing.addPoint(new Point(6, 4));
        interiorRing.addPoint(new Point(6, 6));
        interiorRing.addPoint(new Point(4, 6));
        interiorRing.addPoint(new Point(4, 4));

        polygon.setExteriorRing(exteriorRing);
        polygon.addInteriorRing(interiorRing);

        // Verify polygon properties
        expect(polygon.numInteriorRing()).toBe(1);
        expect(polygon.area()).toBe(96); // 100 - 4 (exterior area - hole area)
        
        // Verify we can access the interior ring
        const retrievedRing = polygon.interiorRingN(1);
        expect(retrievedRing.numPoints()).toBe(5);
    });

    // Test 3: Testing WKT representation of polygons
    it('should generate correct WKT representation', () => {
        const polygon = new Polygon();
        const exteriorRing = new LinearRing();
        
        // Create a triangle
        exteriorRing.addPoint(new Point(0, 0));
        exteriorRing.addPoint(new Point(1, 0));
        exteriorRing.addPoint(new Point(0, 1));
        exteriorRing.addPoint(new Point(0, 0));

        polygon.setExteriorRing(exteriorRing);

        // Verify WKT format
        const wkt = polygon.asText();
        expect(wkt).toBe('POLYGON ((0 0, 1 0, 0 1, 0 0))');
        
        // Test empty polygon
        const emptyPolygon = new Polygon();
        expect(emptyPolygon.asText()).toBe('POLYGON EMPTY');
    });
});