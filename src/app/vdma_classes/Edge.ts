import { Action } from "./Action";
import { Trajectory } from "./systemState";
import { Node  } from "./Node";

export class Edge {
    
    edgeId: string;
    /**
     * Id to track the sequence of nodes and edges in an order and to simplify order updates.
     * The variable sequenceId runs across all nodes and edges of the same order and is reset
     * when a new orderId is issued.
     */
    sequenceId: number; 
    /**
     * Verbose description of the edge.
     */
    edgeDescription?: string;
    /**
     * If true, the edge is part of the base plan. If false, the edge is part of the horizon
     * plan.
     */
    released: boolean;
    /**
     * The nodeId of the start node.
     */
    startNodeId: string;
    /**
     * The nodeId of the end node.
     */
    endNodeId: string;
    /**
     * permitted maximum speed of the agv on the edge in m/s. Speed is defined by the fastest
     * point of the vehicle.
     */
    maxSpeed?: number;
    
    /**
     * Permitted maximum height of the vehicle, including the load, on edge. In meters.
     */
    maxHeight?: number;
    /**
     * Permitted minimal height of the edge measured at the bottom of the load. In meters.
     */
    minHeight?: number;
    
    /**
     * Orientation of the AGV on the edge relative to the map coordinate origin (for holonomic
     * vehicles with more than one driving direction).
     * Example: orientation Pi/2 rad will lead to a rotation of 90 degrees.
     * If AGV starts in different orientation, rotate the vehicle on the edge to the desired
     * orientation if rotationAllowed is set to “true”.
     * If rotationAllowed is “false”, rotate before entering the edge.
     * If that is not possible, reject the order.
     * If a trajectory with orientation is defined, follow the trajectories orientation. If a
     * trajectory without orientation and the orientation field here is defined, apply the
     * orientation to the tangent of the trajectory.
     */
    orientation?: number;
    /**
     * Sets direction at junctions for line-guided vehicles, to be defined initially
     * (vehicle-individual). Can be descriptive (left, right, middle) or a frequency.
     */
    direction?: string;
    /**
     * If true, rotation is allowed on the edge.
     */
    rotationAllowed?: boolean;
    /**
     * Maximum rotation speed in rad/s
     */
    maxRotationSpeed?: number;
    /**
     * Trajectory that an AGV has to follow on this edge. The trajectory is to be defined as a
     * NURBS.
     */
    trajectory?: Trajectory;
    /**
     * Array of action objects with detailed information.
     */
    actions: Action[];
    /**
     * Distance of the path from startNode to endNode in meters. This value is used by
     * line-guided AGVs to decrease their speed before reaching a stop position.
     */
    distance?: number;

    // from old script
    static count = 0;
    replaceBase?: boolean;
    // objects for easier drawing, IS NOT INCLUDED IN SERIALIZATION.
    startNodeObject: Node;
    endNodeObject: Node;

    constructor(startNode, endNode, name = null) {
        this.edgeId = Edge.count.toString();
        Edge.count++;
    
        if (name === null) {
          this.edgeDescription = this.edgeId.toString()
        }
        else {
          this.edgeDescription = name;
        }
    
        this.startNodeId = startNode;
        this.endNodeId = endNode;
      }
    
      toJSON() {
        return {
          "edgeId":this.edgeId,
          "edgeDescription":this.edgeDescription,
          "released":this.released,
          "replaceBase":this.replaceBase,
          "startNodeId":this.startNodeId,
          "endNodeId":this.endNodeId,
          "maxSpeed":this.maxSpeed,
          "maxHeight":this.maxHeight,
          "orientation":this.orientation,
          "direction":this.direction,
          "rotationAllowed":this.rotationAllowed,
          "maxRotationSpeed":this.maxRotationSpeed,
          "trajectory":this.trajectory,
          "distance":this.distance,
          "actions":this.actions
        }
      }
   

    
    
    
}