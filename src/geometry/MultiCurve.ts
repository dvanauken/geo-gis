// MultiCurve.ts
import { GeometryCollection } from "./GeometryCollection";
import { Curve } from "./Curve";
import { Geometry } from "./Geometry";
import { Point } from "./Point";
import { MultiPoint } from "./MultiPoint";

export abstract class MultiCurve<T extends Curve = Curve> extends GeometryCollection<T> {
    constructor() {
        super();
    }

    // Override from Geometry
    geometryType(): string {
        return 'MULTICURVE';
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    equals(another: Geometry): boolean {
        if (!(another instanceof MultiCurve)) {
            return false;
        }
        if (this.items.length !== another.items.length) {
            return false;
        }
        return this.items.every(curve => 
            another.items.some(otherCurve => curve.equals(otherCurve))
        );
    }

    // Required methods from spec
    isClosed(): boolean {
        return this.items.every(curve => curve.isClosed());
    }

    length(): number {
        return this.items.reduce((total, curve) => total + curve.length(), 0);
    }

    isSimple(): boolean {
        if (!this.items.every(curve => curve.isSimple())) {
            return false;
        }

        for (let i = 0; i < this.items.length; i++) {
            for (let j = i + 1; j < this.items.length; j++) {
                if (this.hasInvalidIntersection(this.items[i], this.items[j])) {
                    return false;
                }
            }
        }
        return true;
    }

    boundary(): Geometry {
        if (this.isEmpty()) {
            return new Point();
        }

        const pointCount = new Map<string, number>();
        this.items.forEach(curve => {
            if (!curve.isEmpty() && !curve.isClosed()) {
                const start = curve.startPoint();
                const end = curve.endPoint();
                const startKey = `${start.x()},${start.y()}`;
                const endKey = `${end.x()},${end.y()}`;
                pointCount.set(startKey, (pointCount.get(startKey) || 0) + 1);
                pointCount.set(endKey, (pointCount.get(endKey) || 0) + 1);
            }
        });

        const boundaryPoints = new MultiPoint();
        pointCount.forEach((count, pointKey) => {
            if (count % 2 === 1) {
                const [x, y] = pointKey.split(',').map(Number);
                boundaryPoints.addPoint(new Point(x, y));
            }
        });
        
        return boundaryPoints;
    }

    curveN(n: number): T {
        if (n < 1 || n > this.items.length) {
            throw new Error("Curve index out of range");
        }
        return this.items[n - 1];
    }

    numCurves(): number {
        return this.items.length;
    }

    addCurve(curve: T): void {
        this.items.push(curve);
    }

    private hasInvalidIntersection(curve1: T, curve2: T): boolean {
        const boundary1 = curve1.boundary();
        const boundary2 = curve2.boundary();
        return false; // Placeholder implementation
    }

    protected isPointOnBoundary(point: Point, curve: T): boolean {
        if (curve.isEmpty()) return false;
        return point.equals(curve.startPoint()) || point.equals(curve.endPoint());
    }
}