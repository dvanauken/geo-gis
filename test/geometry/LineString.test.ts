import { describe, it, expect } from 'vitest';
import { LineString } from '../../src/geometry/LineString';
import { Point } from '../../src/geometry/Point';

describe('LineString', () => {
    // Test 1: Basic LineString construction and properties
    it('should handle basic line operations correctly', () => {
        const line = new LineString();
        
        // Test empty line
        expect(line.isEmpty()).toBe(true);
        expect(line.length()).toBe(0);
        expect(() => line.startPoint()).toThrow("LineString is empty");
        expect(() => line.endPoint()).toThrow("LineString is empty");
        
        // Add points and test properties
        line.addPoint(new Point(0, 0));
        line.addPoint(new Point(3, 4));
        
        expect(line.isEmpty()).toBe(false);
        expect(line.length()).toBe(5); // 3-4-5 triangle distance
        expect(line.numPoints()).toBe(2);
        expect(line.startPoint().equals(new Point(0, 0))).toBe(true);
        expect(line.endPoint().equals(new Point(3, 4))).toBe(true);
    });

    // Test 2: Testing closure and ring properties
    it('should correctly identify closed lines and rings', () => {
        const line = new LineString();
        
        // Create a triangle
        line.addPoint(new Point(0, 0));
        line.addPoint(new Point(1, 1));
        line.addPoint(new Point(0, 1));
        
        // Not closed yet
        expect(line.isClosed()).toBe(false);
        expect(line.isRing()).toBe(false);
        
        // Close the line by adding the start point
        line.addPoint(new Point(0, 0));
        
        expect(line.isClosed()).toBe(true);
        expect(line.isRing()).toBe(true);  // Should be both closed and simple
    });

    // Test 3: Testing simplicity and self-intersection
    it('should correctly identify simple and self-intersecting lines', () => {
        // Create a simple line (straight line)
        const simpleLine = new LineString();
        simpleLine.addPoint(new Point(0, 0));
        simpleLine.addPoint(new Point(1, 1));
        simpleLine.addPoint(new Point(2, 2));
        expect(simpleLine.isSimple()).toBe(true);
        
        // Create a self-intersecting line (figure 8 shape)
        const crossingLine = new LineString();
        crossingLine.addPoint(new Point(0, 0));
        crossingLine.addPoint(new Point(2, 2));
        crossingLine.addPoint(new Point(0, 2));
        crossingLine.addPoint(new Point(2, 0));
        expect(crossingLine.isSimple()).toBe(false);
        
        // Line with repeated points should be simple
        const repeatedPointLine = new LineString();
        repeatedPointLine.addPoint(new Point(0, 0));
        repeatedPointLine.addPoint(new Point(1, 1));
        repeatedPointLine.addPoint(new Point(1, 1)); // Repeated point
        expect(repeatedPointLine.isSimple()).toBe(true);
    });
});