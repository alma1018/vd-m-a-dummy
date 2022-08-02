"use strict";
exports.__esModule = true;
exports.Order = void 0;
var Order = /** @class */ (function () {
    //zoneSetId: string; //missing in original file
    function Order(route, sequenceId) {
        this.version = '0.8.6';
        this.orderId = route.name;
        this.headerId = sequenceId;
        this.timestamp = new Date().toISOString();
        this.success = route.sortNodesAndEdgesFromStartToEnd();
        this.nodes = route.nodes;
        this.edges = route.edges;
        /*this.nodes.forEach((n: Node) => {
            n.cleanupForVdmaRepresentation();
        });

        this.edges.forEach((e: Edge) => {
            e.cleanupForVdmaRepresentation();
        });*/
        console.log("Original Route:");
        console.log(route);
        console.log("Generated Order:");
        console.log(this);
    }
    Order.prototype.getJSON = function (indent) {
        if (indent === void 0) { indent = 2; }
        delete this.success;
        return JSON.stringify(this, undefined, indent);
    };
    Order.sequenceIdcounter = 0;
    return Order;
}());
exports.Order = Order;
