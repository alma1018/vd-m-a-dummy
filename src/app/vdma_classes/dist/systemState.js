"use strict";
exports.__esModule = true;
exports.NodePosition = exports.ControlPoint = exports.Trajectory = void 0;
/**
 * Trajectory that an AGV has to follow on this edge. The trajectory is to be defined as a
 * NURBS.
 */
var Trajectory = /** @class */ (function () {
    function Trajectory() {
    }
    return Trajectory;
}());
exports.Trajectory = Trajectory;
var ControlPoint = /** @class */ (function () {
    function ControlPoint() {
    }
    return ControlPoint;
}());
exports.ControlPoint = ControlPoint;
/**
 * Defines the position on a map in world coordinates. Each floor has its own map. Precision
 * is up to the specific implementation
 */
var NodePosition = /** @class */ (function () {
    function NodePosition() {
    }
    return NodePosition;
}());
exports.NodePosition = NodePosition;
