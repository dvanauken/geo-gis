import { Point } from "../base/Point";

/**
 * Represents a triangle in a TIN
 */
class Triangle {
    private vertices: [Point, Point, Point];
    private neighbors: [Triangle | null, Triangle | null, Triangle | null];
  
    constructor(v1: Point, v2: Point, v3: Point) {
      // Ensure vertices are ordered counterclockwise
      if (this.isClockwise(v1, v2, v3)) {
        this.vertices = [v1, v2, v3];
      } else {
        this.vertices = [v1, v3, v2];
      }
      this.neighbors = [null, null, null];
    }
  
    /**
     * Gets the vertices of the triangle
     */
    getVertices(): [Point, Point, Point] {
      return [
        this.vertices[0].clone(),
        this.vertices[1].clone(),
        this.vertices[2].clone()
      ];
    }
  
    /**
     * Gets the neighboring triangles
     */
    getNeighbors(): [Triangle | null, Triangle | null, Triangle | null] {
      return [...this.neighbors];
    }
  
    /**
     * Sets a neighboring triangle
     * @param index Edge index (0-2)
     * @param neighbor The neighboring triangle
     */
    setNeighbor(index: number, neighbor: Triangle | null): void {
      if (index < 0 || index > 2) {
        throw new Error('Invalid neighbor index');
      }
      this.neighbors[index] = neighbor;
    }
  
    /**
     * Calculates the circumcenter of the triangle
     */
    getCircumcenter(): Point {
      const [a, b, c] = this.vertices;
      
      const D = 2 * (a.getX() * (b.getY() - c.getY()) +
                     b.getX() * (c.getY() - a.getY()) +
                     c.getX() * (a.getY() - b.getY()));
  
      const Ux = ((a.getX() * a.getX() + a.getY() * a.getY()) * (b.getY() - c.getY()) +
                  (b.getX() * b.getX() + b.getY() * b.getY()) * (c.getY() - a.getY()) +
                  (c.getX() * c.getX() + c.getY() * c.getY()) * (a.getY() - b.getY())) / D;
  
      const Uy = ((a.getX() * a.getX() + a.getY() * a.getY()) * (c.getX() - b.getX()) +
                  (b.getX() * b.getX() + b.getY() * b.getY()) * (a.getX() - c.getX()) +
                  (c.getX() * c.getX() + c.getY() * c.getY()) * (b.getX() - a.getX())) / D;
  
      return new Point(Ux, Uy);
    }
  
    /**
     * Tests if a point lies within the triangle's circumcircle
     */
    inCircumcircle(point: Point): boolean {
      const center = this.getCircumcenter();
      const radius = center.distanceTo(this.vertices[0]);
      return point.distanceTo(center) < radius;
    }
  
    /**
     * Calculates the area of the triangle
     */
    getArea(): number {
      const [a, b, c] = this.vertices;
      return Math.abs(
        (b.getX() - a.getX()) * (c.getY() - a.getY()) -
        (c.getX() - a.getX()) * (b.getY() - a.getY())
      ) / 2;
    }
  
    /**
     * Tests if a point lies within the triangle
     */
    contains(point: Point): boolean {
      const [a, b, c] = this.vertices;
      
      const v0x = c.getX() - a.getX();
      const v0y = c.getY() - a.getY();
      const v1x = b.getX() - a.getX();
      const v1y = b.getY() - a.getY();
      const v2x = point.getX() - a.getX();
      const v2y = point.getY() - a.getY();
  
      const dot00 = v0x * v0x + v0y * v0y;
      const dot01 = v0x * v1x + v0y * v1y;
      const dot02 = v0x * v2x + v0y * v2y;
      const dot11 = v1x * v1x + v1y * v1y;
      const dot12 = v1x * v2x + v1y * v2y;
  
      const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
      const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
      const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
  
      return u >= 0 && v >= 0 && u + v <= 1;
    }
  
    private isClockwise(p1: Point, p2: Point, p3: Point): boolean {
      return ((p2.getX() - p1.getX()) * (p3.getY() - p1.getY()) -
              (p3.getX() - p1.getX()) * (p2.getY() - p1.getY())) > 0;
    }
  }
  
  export { Triangle };