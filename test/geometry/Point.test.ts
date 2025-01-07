import { describe, it, expect } from 'vitest';
import { Point } from '../../src/geometry/Point';

describe('Point', () => {
    // Test 1: Basic point operations and coordinate access
    it('should correctly handle coordinate operations', () => {
        // Create point with coordinates
        const point = new Point(3, 4);
        
        // Test coordinate getters
        expect(point.x()).toBe(3);
        expect(point.y()).toBe(4);
        
        // Test coordinate setters
        point.setX(5);
        point.setY(6);
        expect(point.x()).toBe(5);
        expect(point.y()).toBe(6);
    });

    // Test 2: Distance calculation between points
    it('should calculate correct distances between points', () => {
        const point1 = new Point(0, 0);
        const point2 = new Point(3, 4);
        
        // Distance should be 5 (using Pythagorean theorem: sqrt(3² + 4²) = 5)
        expect(point1.distance(point2)).toBe(5);
        
        // Distance should be symmetric
        expect(point2.distance(point1)).toBe(5);
        
        // Distance to self should be 0
        expect(point1.distance(point1)).toBe(0);
    });

    // Test 3: WKT (Well-Known Text) representation and equality
    it('should handle WKT representation and equality comparison', () => {
        const point1 = new Point(2, 3);
        const point2 = new Point(2, 3);
        const point3 = new Point(3, 2);
        
        // Test WKT representation
        expect(point1.asText()).toBe('POINT (2 3)');
        
        // Test equality
        expect(point1.equals(point2)).toBe(true);  // Same coordinates
        expect(point1.equals(point3)).toBe(false); // Different coordinates
        
        // Test clone
        const clonedPoint = point1.clone();
        expect(point1.equals(clonedPoint)).toBe(true);
        
        // Verify clone is a separate instance
        clonedPoint.setX(5);
        expect(point1.equals(clonedPoint)).toBe(false);
    });
});