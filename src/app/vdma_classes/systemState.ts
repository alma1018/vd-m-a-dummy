/**
 * Trajectory that an AGV has to follow on this edge. The trajectory is to be defined as a
 * NURBS.
 */
 export class Trajectory {
    /**
     * List of JSON controlPoint objects defining the control points of the NURBS. This includes
     * the start and end point.
     */
    controlPoints: ControlPoint[];
    /**
     * The degree of the NURBS.
     */
    degree: number;
    /**
     * Sequence of parameter values that determine where and how the control points affect the
     * NURBS curve. knotVector has size of number of control points + degree + 1
     */
    knotVector: number[];
}

export class ControlPoint {
    /**
     * Orientation of the AGV on this position of the curve. The orientation is in world
     * coordinates.
     * When not defined the orientation of the AGV will be tangential to the curve.
     */
    orientation?: number;
    /**
     * The weight with which this control point pulls no the curve.
     * When not defined, the default will be 1.0.
     */
    weight: number;
    x:      number;
    y:      number;
}

/**
 * Defines the position on a map in world coordinates. Each floor has its own map. Precision
 * is up to the specific implementation
 */
 export class NodePosition {
    /**
     * Indicates how exact an AGV has to align its orientation with the nodes theta. The value
     * is interpreted as theta+-deviation.nIf = 0: no deviation is allowed (no deviation means
     * within the normal tolerance of the AGV manufacturer).
     */
    allowedDeviationTheta?: number;
    /**
     * Indicates how exact an AGV has to drive over a node in order for it to count as
     * traversed.
     * If = 0: no deviation is allowed (no deviation means within the normal tolerance of the
     * AGV manufacturer).
     * If > 0: allowed deviation-radius in meters. If the AGV passes a node within the
     * deviation-radius, the node is considered to have been traversed.
     */
    allowedDeviationXy?: number;
    /**
     * Verbose description of the Map
     */
    mapDescription?: string;
    /**
     * Unique identification of the map in which the position is referenced.
     * Each map has the same origin of coordinates. When an AGV uses an elevator, e. g. leading
     * from a departure floor to a target floor, it will disappear off the map of the departure
     * floor and spawn in the related lift node on the map of the target floor.
     */
    mapId: string;
    /**
     * Orientation of the AGV on the node.
     * Optional: vehicle can plan the path by itself.
     * If defined, the AGV has to assume the theta angle on this node.
     * If previous edge disallows rotation, the AGV is to rotate on the node.
     * If following edge has a differing orientation defined but disallows rotation, the AGV is
     * to rotate on the node to the edges desired rotation before entering the edge.
     */
    theta?: number;
    x:      number;
    y:      number;
}
