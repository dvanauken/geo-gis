// Point.ts
import { Geometry } from "./Geometry";

export class Point extends Geometry {
    private _x: number;
    private _y: number;

    constructor(x: number = 0, y: number = 0) {
        super();
        this._x = x;
        this._y = y;
    }

    // Basic coordinate accessors
    x(): number {
        return this._x;
    }

    y(): number {
        return this._y;
    }

    // Set coordinates
    setX(x: number): void {
        this._x = x;
    }

    setY(y: number): void {
        this._y = y;
    }

    // Override Geometry methods
    geometryType(): string {
        return 'POINT';
    }

    isEmpty(): boolean {
        return false;  // A Point instance is never empty as per spec
    }

    // The boundary of a Point is empty
    boundary(): Geometry {
        return new Point();  // Returns an empty point
    }

    // Point is always simple as per spec
    isSimple(): boolean {
        return true;
    }

    // Equality check
    equals(another: Geometry): boolean {
        if (!(another instanceof Point)) {
            return false;
        }
        return this._x === another.x() && 
               this._y === another.y();
    }

    // Distance calculation to another point
    distance(another: Point): number {
        const dx = this._x - another.x();
        const dy = this._y - another.y();
        return Math.sqrt(dx * dx + dy * dy);
    }

    // WKT (Well-Known Text) representation
    asText(): string {
        return `POINT (${this._x} ${this._y})`;
    }

    // Clone this point
    clone(): Point {
        return new Point(this._x, this._y);
    }

    // Convert to string (for debugging)
    toString(): string {
        return `Point(${this._x}, ${this._y})`;
    }
}