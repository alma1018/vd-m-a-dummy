import {Edge} from "./Edge";
import {Node} from "./Node";
import {FTF} from "./FTF";

export class Route {
  routeID: number;
  name: string;
  startNode: Node;
  endNode: Node;
  color: string;
  assignedFtfBaseTopic: string;

  nodes: Node[] = [];
  edges: Edge[] = [];

  static count = 0;

  constructor(name = null) {
    this.routeID = Route.count;
    Route.count++;

    if (name===null) {
      this.name = 'Route ' + this.routeID;
    }
    else {
      this.name = name;
    }
  }

  getNodeByID(nodeId) {
    return this.nodes.filter((node) => {
      return node.nodeId === nodeId;
    })[0];
  }

  getEdgeByID(edgeId) {
    return this.edges.filter((edge) => {
      return edge.edgeId === edgeId;
    })[0];
  }

  getStartNodeByEdgeID(edgeId) {
    let edge = this.getEdgeByID(edgeId);
    let node = this.getNodeByID(edge.startNodeId);
    return node;
  }

  getEndNodeByEdgeID(edgeId) {
    let edge = this.getEdgeByID(edgeId);
    let node = this.getNodeByID(edge.endNodeId);
    return node;
  }

  getEdgeByStartNodeID(nodeId) {
    return this.edges.find((e: Edge) => { return e.startNodeId === nodeId});
  }

  setFtfBaseTopic(ftf: FTF) {
    this.assignedFtfBaseTopic = ftf.getBaseTopic();
  }

  getFtfBaseTopic() {
    return this.assignedFtfBaseTopic;
  }

  sortNodesAndEdgesFromStartToEnd() {
    // method returns true if there is a graph between start and end, otherwise false.
    let sortedNodeList = [];
    let sortedEdgeList = [];
    let startNode = this.nodes.find((n: Node) => {return n.start;});
    let startEdge = this.edges.find((e: Edge) => {return e.startNodeId === startNode.nodeId});
    sortedNodeList.push(startNode);
    sortedEdgeList.push(startEdge);
    let nextNode = this.getEndNodeByEdgeID(startEdge.edgeId);
    let endNodeFound = false;
    sortedNodeList.push(nextNode);
    endNodeFound = nextNode.end;
    while (!endNodeFound) {
      let nextEdge = this.getEdgeByStartNodeID(nextNode.nodeId);
      nextNode = this.getEndNodeByEdgeID(nextEdge.edgeId);
      if ((nextNode === undefined) || (nextEdge === undefined)) {
        return false;
      }
      sortedNodeList.push(nextNode);
      sortedEdgeList.push(nextEdge);
      endNodeFound = nextNode.end;
    }
    this.nodes = sortedNodeList;
    this.edges = sortedEdgeList;
    return true;
  }




}
