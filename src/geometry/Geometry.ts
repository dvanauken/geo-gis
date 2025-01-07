export abstract class Geometry {
    constructor() {
    }

    //+ dimension() : Integer
    //+ coordinateDimension() : Integer
    //+ spatialDimension() : Integer
    geometryType(): string {
        return 'GEOMETRY';
    }
    
    //+ SRID(): Integer
    envelope(): Geometry {
        return this;
    }

    asText(): string {
        return this.geometryType();
    }

    //+ asBinary () : Binary
    isEmpty(): boolean {
        return false;
    }

    //+ isSimple() : Boolean
    //+ is3D() : Boolean  
    //+ isMeasured()() : Boolean
    boundary(): Geometry {
        return this;
    }

    //query
    equals(another: Geometry): boolean {
        return this === another;
    }
    //+ disjoint(another :Geometry ) : Boolean
    //+ intersects(another :Geometry ) : Boolean
    //+ touches(another :Geometry ) : Boolean
    //+ crosses(another :Geometry ) : Boolean
    //+ within(another :Geometry ) : Boolean
    //+ contains(another :Geometry ) : Boolean
    //+ overlaps(another :Geometry ) : Boolean
    //+ relate(another :Geometry , matrix :String) : Boolean
    //+ locateAlong(mValue :Double) : Geometry
    //+ locateBetween(mStart :Double, mEnd :Double) : Geometry

    //analysis
    //+ distance(another :Geometry ) : Distance
    //+ buffer(distance :Distance) : Geometry
    //+ convexHull() : Geometry
    //+ intersection(another :Geometry ) : Geometry
    //+ union(another :Geometry ) : Geometry
    //+ difference(another :Geometry ) : Geometry
    //+ symDifference(another :Geometry ) : Geometry
}