import { Action } from "./Action";
import { NodePosition } from "./systemState";

export class Node {
    
    nodeId: string;
    /**
     * Id to track the sequence of nodes and edges in an order and to simplify order updates.
     * The main purpose is to distinguish between a node which is passed more than once within
     * one orderId. The variable sequenceId can run across all nodes and edges of the same order
     * and is reset when a new orderId is issued.
     */
    sequenceId: number;
    nodeDescription?: string;/**
     * If true, the edge is part of the base plan. If false, the edge is part of the horizon
     * plan.
     */
    released: boolean;
    /**
     * Array of actions that are to be executed on the node. Their sequence in the list governs
     * their sequence of execution.
     */
    actions: Action[];
    /**
     * Defines the position on a map in world coordinates. Each floor has its own map. Precision
     * is up to the specific implementation
     */
    nodePosition: NodePosition;     // Changed to none optional
    
    allowedDeviation: any;

    // Stuff for easier drawing, will be removed for serialisation
    routeID?: number;
    start?: boolean;
    end?: boolean;

    static count: number = 0;

    
    replaceBase?: boolean = false; // from old Ts script
    isExact?: boolean = false; // from old Ts script

    constructor(name=null) {
        this.nodeId = Node.count.toString();
        Node.count++;
        if (name === null) {
          this.nodeDescription = this.nodeId.toString();
        }
        else {
          this.nodeDescription = name;
        }
        this.nodePosition = {
          x: 0,
          y: 0,
          theta: 0,
          mapId: "0"
        };
        this.actions = [];
    
        this.start = false;
        this.end = false;
    
    }
    
    toJSON() {
        return {
          'nodeId': this.nodeId,
          'nodeDescription': this.nodeDescription,
          'nodePosition': this.nodePosition,
          'actions': this.actions,
          'released': this.released,
          //'replaceBase': this.replaceBase,
          //'isExact': this.isExact
        }
    }
    
    
}