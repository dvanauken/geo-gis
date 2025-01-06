// TIN.ts
import { PolyhedralSurface } from "./PolyhedralSurface";
import { Triangle } from "./Triangle";  // Importing Triangle

export class TIN extends PolyhedralSurface {
    triangles: Triangle[];  // An array to store Triangle objects

    constructor() {
        super();  // Calls the constructor of the base class, PolyhedralSurface
        this.triangles = new Array<Triangle>();  // Initializes the array of Triangle objects
    }

    // You can add methods specific to TIN here, such as methods to calculate total surface area, check for neighbor triangles, etc.
}
