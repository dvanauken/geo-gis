// // LineString.ts
// import { Curve } from "./Curve";
// import { Point } from "./Point";
// import { Geometry } from "./Geometry";

// export class LineString extends Curve {
//     points: Point[];

//     constructor() {
//         super();
//         this.points = new Array<Point>();
//     }

//     // Implement abstract methods from Curve
//     length(): number {
//         if (this.points.length < 2) {
//             return 0;
//         }

//         let totalLength = 0;
//         for (let i = 0; i < this.points.length - 1; i++) {
//             totalLength += this.points[i].distance(this.points[i + 1]);
//         }
//         return totalLength;
//     }

//     startPoint(): Point {
//         if (this.isEmpty()) {
//             throw new Error("Cannot get start point of empty LineString");
//         }
//         return this.points[0];
//     }

//     endPoint(): Point {
//         if (this.isEmpty()) {
//             throw new Error("Cannot get end point of empty LineString");
//         }
//         return this.points[this.points.length - 1];
//     }

//     // Required methods from spec
//     numPoints(): number {
//         return this.points.length;
//     }

//     pointN(n: number): Point {
//         if (n < 1 || n > this.points.length) {
//             throw new Error("Point index out of range");
//         }
//         return this.points[n - 1];  // Convert from 1-based to 0-based indexing
//     }

//     // Override from Geometry
//     geometryType(): string {
//         return 'LINESTRING';
//     }

//     isEmpty(): boolean {
//         return this.points.length === 0;
//     }

//     equals(another: Geometry): boolean {
//         if (!(another instanceof LineString)) {
//             return false;
//         }

//         if (this.points.length !== another.points.length) {
//             return false;
//         }

//         return this.points.every((point, index) => 
//             point.equals(another.points[index])
//         );
//     }

//     // A LineString is simple if it does not self-intersect
//     isSimple(): boolean {
//         if (this.points.length < 2) {
//             return true;
//         }

//         // Check for self-intersections
//         for (let i = 0; i < this.points.length - 1; i++) {
//             for (let j = i + 2; j < this.points.length - 1; j++) {
//                 if (this.segmentsIntersect(
//                     this.points[i], this.points[i + 1],
//                     this.points[j], this.points[j + 1]
//                 )) {
//                     return false;
//                 }
//             }
//         }

//         return true;
//     }

//     // Additional methods
//     addPoint(point: Point): void {
//         this.points.push(point);
//     }

//     // WKT representation
//     asText(): string {
//         if (this.isEmpty()) {
//             return "LINESTRING EMPTY";
//         }

//         const pointsText = this.points
//             .map(p => `${p.x()} ${p.y()}`)
//             .join(", ");

//         return `LINESTRING (${pointsText})`;
//     }

//     // Helper method to check if a point is on this LineString
//     contains(point: Point): boolean {
//         if (this.isEmpty()) {
//             return false;
//         }

//         // Check if point lies on any segment
//         for (let i = 0; i < this.points.length - 1; i++) {
//             if (this.isPointOnSegment(point, this.points[i], this.points[i + 1])) {
//                 return true;
//             }
//         }

//         return false;
//     }

//     // Helper methods for geometric calculations

//     private segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
//         // Quick check for shared endpoints
//         if (p1.equals(p3) || p1.equals(p4) || p2.equals(p3) || p2.equals(p4)) {
//             return false;
//         }

//         const ccw = (A: Point, B: Point, C: Point): number => {
//             return (C.y() - A.y()) * (B.x() - A.x()) -
//                    (B.y() - A.y()) * (C.x() - A.x());
//         };

//         const a = ccw(p1, p2, p3);
//         const b = ccw(p1, p2, p4);
//         const c = ccw(p3, p4, p1);
//         const d = ccw(p3, p4, p2);

//         // Segments intersect if signs are opposite
//         return (((a > 0 && b < 0) || (a < 0 && b > 0)) &&
//                 ((c > 0 && d < 0) || (c < 0 && d > 0)));
//     }

//     private isPointOnSegment(p: Point, start: Point, end: Point): boolean {
//         // Check if point lies on the segment
//         if (this.ccw(start, end, p) !== 0) {
//             return false;
//         }

//         // Check if point lies within the segment's bounding box
//         return p.x() >= Math.min(start.x(), end.x()) &&
//                p.x() <= Math.max(start.x(), end.x()) &&
//                p.y() >= Math.min(start.y(), end.y()) &&
//                p.y() <= Math.max(start.y(), end.y());
//     }

//     private ccw(p1: Point, p2: Point, p3: Point): number {
//         // Returns 0 if points are collinear
//         // Returns positive value if p1p2p3 makes a counter-clockwise turn
//         // Returns negative value if p1p2p3 makes a clockwise turn
//         return (p2.x() - p1.x()) * (p3.y() - p1.y()) -
//                (p2.y() - p1.y()) * (p3.x() - p1.x());
//     }
// }