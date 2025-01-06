// import { Geometry } from "../base/Geometry";
// import { Point } from "../base/Point";
// import { Curve } from "../primitive/Curve";
// import { CoordinateSystem } from "../base/CoordinateSystem";

// class LinearRing extends Curve {
//     private readonly points: Point[];

//     constructor(points: Point[], srid: number = 0, coordinateSystem: CoordinateSystem = CoordinateSystem.CARTESIAN_2D) {
//         super(srid, coordinateSystem);
//         this.points = [...points];
//     }

//     public contains(point: Point): boolean {
//         return this.points.some((p, i) => {
//             if (i === this.points.length - 1) return false;
//             return this.pointOnLineSegment(point, this.points[i], this.points[i + 1]);
//         });
//     }

//     public isEmpty(): boolean {
//         return this.points.length === 0;
//     }

//     public is3D(): boolean {
//         return this.points.length > 0 && this.points[0].is3D();
//     }

//     public getGeometryType(): string {
//         return 'LinearRing';
//     }

//     public equals(other: Geometry): boolean {
//         if (!(other instanceof LinearRing)) return false;
//         const otherPoints = (other as LinearRing).points;
//         if (this.points.length !== otherPoints.length) return false;
//         return this.points.every((p, i) => p.equals(otherPoints[i]));
//     }

//     public dimension(): number {
//         return 1; // LinearRings are 1-dimensional
//     }

//     public override clone(): Curve {
//         return new LinearRing([...this.points.map(p => p.clone())], this.getSRID(), this.getCoordinateSystem());
//     }

//     public getPointAtDistance(distance: number): Point | null {
//         if (distance < 0 || distance > this.getLength()) return null;
//         let accumulated = 0;
//         for (let i = 0; i < this.points.length - 1; i++) {
//             const segmentLength = this.points[i].distanceTo(this.points[i + 1]);
//             if (accumulated + segmentLength >= distance) {
//                 const remainder = distance - accumulated;
//                 const ratio = remainder / segmentLength;
//                 return new Point(
//                     this.points[i].getX() + (this.points[i + 1].getX() - this.points[i].getX()) * ratio,
//                     this.points[i].getY() + (this.points[i + 1].getY() - this.points[i].getY()) * ratio,
//                     this.points[i].is3D() ? this.points[i].getZ()! + (this.points[i + 1].getZ()! - this.points[i].getZ()!) * ratio : null
//                 );
//             }
//             accumulated += segmentLength;
//         }
//         return null;
//     }

//     public getPointAtParameter(parameter: number): Point | null {
//         if (parameter < 0 || parameter > 1) return null;
//         const totalPoints = this.points.length;
//         const fIndex = parameter * (totalPoints - 1);
//         const index = Math.floor(fIndex);
//         const fraction = fIndex - index;

//         if (index === totalPoints - 1) return this.points[index].clone();

//         return new Point(
//             this.points[index].getX() + (this.points[index + 1].getX() - this.points[index].getX()) * fraction,
//             this.points[index].getY() + (this.points[index + 1].getY() - this.points[index].getY()) * fraction,
//             this.points[index].is3D() ? this.points[index].getZ()! + (this.points[index + 1].getZ()! - this.points[index].getZ()!) * fraction : null
//         );
//     }

//     public getParameterAtPoint(point: Point): number | null {
//         for (let i = 0; i < this.points.length - 1; i++) {
//             if (this.pointOnLineSegment(point, this.points[i], this.points[i + 1])) {
//                 const segmentLength = this.points[i].distanceTo(this.points[i + 1]);
//                 const distanceFromStart = this.points[i].distanceTo(point);
//                 return (i + distanceFromStart / segmentLength) / (this.points.length - 1);
//             }
//         }
//         return null;
//     }

//     public isClosed(): boolean {
//         return this.points.length > 0 && this.points[0].equals(this.points[this.points.length - 1]);
//     }

//     public getPoints(): Point[] {
//         return [...this.points];
//     }

//     public asWKT(): string {
//         if (this.isEmpty()) {
//             return 'LINEARRING EMPTY';
//         }
//         const coordinates = this.points.map(p => {
//             if (p.is3D()) {
//                 return `${p.getX()} ${p.getY()} ${p.getZ()}`;
//             }
//             return `${p.getX()} ${p.getY()}`;
//         }).join(', ');
//         if (this.is3D()) {
//             return `LINEARRING Z (${coordinates})`;
//         }
//         return `LINEARRING (${coordinates})`;
//     }

//     public toString(): string {
//         return this.asWKT();
//     }

//     public reverse(): Curve {
//         return new LinearRing([...this.points].reverse(), this.getSRID(), this.getCoordinateSystem());
//     }

//     public getStartPoint(): Point {
//         if (this.isEmpty()) throw new Error('LinearRing is empty');
//         return this.points[0].clone();
//     }

//     public getEndPoint(): Point {
//         if (this.isEmpty()) throw new Error('LinearRing is empty');
//         return this.points[this.points.length - 1].clone();
//     }

//     public getLength(): number {
//         let length = 0;
//         for (let i = 0; i < this.points.length - 1; i++) {
//             length += this.points[i].distanceTo(this.points[i + 1]);
//         }
//         return length;
//     }

//     public getSubCurve(startParam: number, endParam: number): Curve {
//         if (startParam < 0 || endParam > 1 || startParam >= endParam) {
//             throw new Error('Invalid parameters');
//         }
//         const startIdx = Math.floor(startParam * (this.points.length - 1));
//         const endIdx = Math.ceil(endParam * (this.points.length - 1));
//         return new LinearRing(this.points.slice(startIdx, endIdx + 1), this.getSRID(), this.getCoordinateSystem());
//     }

//     public getTangentAtParameter(parameter: number): Point | null {
//         if (parameter < 0 || parameter > 1) return null;
//         let idx = Math.floor(parameter * (this.points.length - 1));
//         if (idx >= this.points.length - 1) {
//             idx = this.points.length - 2;
//         }

//         const p1 = this.points[idx];
//         const p2 = this.points[idx + 1];
//         const dx = p2.getX() - p1.getX();
//         const dy = p2.getY() - p1.getY();
//         const length = Math.sqrt(dx * dx + dy * dy);
//         if (length === 0) return null;

//         return new Point(dx / length, dy / length);
//     }

//     public getCurvatureAtParameter(parameter: number): number | null {
//         return 0; // Linear segments have zero curvature
//     }

//     public getOffsetCurve(distance: number): Curve {
//         const offsetPoints = this.points.map((point, i) => {
//             const prev = this.points[i === 0 ? this.points.length - 1 : i - 1];
//             const next = this.points[i === this.points.length - 1 ? 0 : i + 1];
            
//             const dx1 = point.getX() - prev.getX();
//             const dy1 = point.getY() - prev.getY();
//             const dx2 = next.getX() - point.getX();
//             const dy2 = next.getY() - point.getY();

//             const nx1 = -dy1;
//             const ny1 = dx1;
//             const nx2 = -dy2;
//             const ny2 = dx2;

//             const len1 = Math.sqrt(nx1 * nx1 + ny1 * ny1);
//             const len2 = Math.sqrt(nx2 * nx2 + ny2 * ny2);

//             const nx = (nx1 / len1 + nx2 / len2) / 2;
//             const ny = (ny1 / len1 + ny2 / len2) / 2;
//             const len = Math.sqrt(nx * nx + ny * ny);

//             return new Point(
//                 point.getX() + (distance * nx) / len,
//                 point.getY() + (distance * ny) / len,
//                 point.getZ()
//             );
//         });

//         return new LinearRing(offsetPoints, this.getSRID(), this.getCoordinateSystem());
//     }


//     public getClosestPoint(point: Point): Point { // It returns Point, not any made-up type
//       let minDistance = Infinity;
//       let closestPoint: Point | null = null;
  
//       for (let i = 0; i < this.points.length - 1; i++) {
//           const p1 = this.points[i];
//           const p2 = this.points[i + 1];
  
//           const dx = p2.getX() - p1.getX();
//           const dy = p2.getY() - p1.getY();
//           const length = Math.sqrt(dx * dx + dy * dy);
  
//           if (length === 0) {
//               if (point.distanceTo(p1) < minDistance) {
//                   minDistance = point.distanceTo(p1);
//                   closestPoint = p1.clone();
//               }
//               continue;
//           }
  
//           const t = Math.max(0, Math.min(1, (
//               (point.getX() - p1.getX()) * dx +
//               (point.getY() - p1.getY()) * dy
//           ) / (length * length)));
  
//           const projX = p1.getX() + t * dx;
//           const projY = p1.getY() + t * dy;
//           const projPoint = new Point(projX, projY);
//           const distance = point.distanceTo(projPoint);
  
//           if (distance < minDistance) {
//               minDistance = distance;
//               closestPoint = projPoint;
//           }
//       }
  
//       return closestPoint || this.points[0].clone();
//   }

//     public validate(): string[] {
//         const errors: string[] = [];

//         if (this.points.length < 3) {
//             errors.push('A LinearRing must have at least 3 points (not counting the closing point)');
//         }

//         if (this.points.length > 0 && !this.points[0].equals(this.points[this.points.length - 1])) {
//             errors.push('LinearRing must be closed (first and last points must be equal)');
//         }

//         for (let i = 0; i < this.points.length - 1; i++) {
//             if (this.points[i].equals(this.points[i + 1])) {
//                 errors.push(`Duplicate consecutive points found at index ${i}`);
//             }
//         }

//         for (let i = 0; i < this.points.length - 1; i++) {
//             for (let j = i + 2; j < this.points.length - 1; j++) {
//                 if (this.segmentsIntersect(
//                     this.points[i], this.points[i + 1],
//                     this.points[j], this.points[j + 1]
//                 )) {
//                     errors.push(`Self-intersection found between segments ${i} and ${j}`);
//                 }
//             }
//         }

//         return errors;
//     }

//     private pointOnLineSegment(point: Point, start: Point, end: Point): boolean {
//         const dx = end.getX() - start.getX();
//         const dy = end.getY() - start.getY();
//         const length = Math.sqrt(dx * dx + dy * dy);
//         if (length === 0) return point.equals(start);

//         const t = ((point.getX() - start.getX()) * dx + (point.getY() - start.getY()) * dy) / (length * length);
//         if (t < 0 || t > 1) return false;

//         const projX = start.getX() + t * dx;
//         const projY = start.getY() + t * dy;
//         const EPSILON = 1e-10;
//         return Math.abs(point.getX() - projX) < EPSILON && Math.abs(point.getY() - projY) < EPSILON;
//     }

//     private segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
//         const ccw = (A: Point, B: Point, C: Point): number => {
//             return (C.getY() - A.getY()) * (B.getX() - A.getX()) -
//                    (B.getY() - A.getY()) * (C.getX() - A.getX());
//         };

//         const a = ccw(p1, p2, p3);
//         const b = ccw(p1, p2, p4);
//         const c = ccw(p3, p4, p1);
//         const d = ccw(p3, p4, p2);

//         if (((a > 0 && b < 0) || (a < 0 && b > 0)) &&
//             ((c > 0 && d < 0) || (c < 0 && d > 0))) {
//             return true;
//         }

//         return Math.abs(a) < 1e-10 || Math.abs(b) < 1e-10 ||
//                Math.abs(c) < 1e-10 || Math.abs(d) < 1e-10;
//     }
// }

// export { LinearRing };