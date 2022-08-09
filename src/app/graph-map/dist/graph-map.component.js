"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.GraphMapComponent = void 0;
var core_1 = require("@angular/core");
var d3 = require("d3");
var Node_1 = require("../vdma_classes/Node");
var Edge_1 = require("../vdma_classes/Edge");
var Route_1 = require("../vdma_classes/Route");
var FTF_1 = require("../vdma_classes/FTF");
var Paho = require("paho-mqtt");
var settings_form_component_1 = require("../settings-form/settings-form.component");
var ftf_form_component_1 = require("../ftf-form/ftf-form.component");
var dialog_1 = require("@angular/material/dialog");
var edge_form_component_1 = require("../edge-form/edge-form.component");
// WORKAROUND FÜR NAMESPACE BUG https://github.com/eclipse/paho.mqtt.javascript/issues/150
window.Paho = Paho;
window.Paho.MQTT = Paho;
var GraphMapComponent = /** @class */ (function () {
    function GraphMapComponent(settingsDialog, snackBar, ftfDialog, edgeDialog) {
        this.settingsDialog = settingsDialog;
        this.snackBar = snackBar;
        this.ftfDialog = ftfDialog;
        this.edgeDialog = edgeDialog;
        // Stuff um routen, nodes und edges zu verwalten
        this.nodes = [];
        this.currentRoute = new Route_1.Route();
        this.routes = [this.currentRoute];
        this.edges = [];
        this.coordinateSystem = {
            x: 0,
            y: 0
        };
        // Stuff für Flottenverwaltung
        this.ftfs = [];
        // Stuff für Maus-Events
        this.buttonDownNode = null;
        this.buttonUpNode = null;
        this.selectedNode = null;
        this.svgActive = false;
        // Tastaturevents
        this.lastKeyDown = -1;
        this.colors = d3.scaleOrdinal(d3.schemeCategory10);
        this.mqttHost = '127.0.0.1';
        this.mqttPort = 9001;
        this.mqttClientID = 'VDMA_FTF_PROTO_WEBAPP_' + Math.random().toString(36).substr(2, 6);
        this.mqttConnected = false;
        this.mqttManuallyDisconnected = false;
        // MapStuff
        this.mapWidthInPixels = 642; //get from map pixel width
        this.mapHeightInPixels = 665; //get from map pixel height
        this.map_origin = [0.0, 0.0]; //[0.0, 0.0];
        this.mapWidthInMeters = 0.0; //Intitalvalue will be calculated
        this.mapHeightInMeters = 0.0; //Intitalvalue will be calculated
        this.mapMetersPerPixel = 0.05; // get from map yaml file (resolution)
        this.mapXoffset = 0.0; // will be calculated from input in settings
        this.mapYoffset = 0.0; //will be calculated from input in settings
        this.xScale = d3.scaleLinear()
            .domain([this.map_origin[0], -this.map_origin[0]])
            .range([0, this.mapWidthInPixels]);
        this.yScale = d3.scaleLinear()
            .domain([-this.map_origin[1], this.map_origin[1]])
            .range([0, this.mapHeightInPixels]);
        // Component visibility
        this.routeFormVisible = true;
        this.ftfListVisible = false;
    }
    GraphMapComponent.prototype.ngOnInit = function () {
        var _this = this;
        // Hier die App starten!
        this.initSvg();
        //this.drawCircles(event);
        this.stage.on('mouseup', this.addNodes.bind(this));
        d3.select(window)
            .on('keydown', this.keyDown.bind(this))
            .on('keyup', this.keyUp.bind(this))
            .on('mousedown', function () {
            _this.svgActive = false;
        });
        this.loadMQTTSettings();
        this.initMQTT();
        // @ts-ignore Route mit Farbe versehen
        this.currentRoute.color = this.colors(this.currentRoute.routeID);
    };
    GraphMapComponent.prototype.loadMQTTSettings = function () {
        if (localStorage.getItem('mqttHost')) {
            this.mqttHost = localStorage.getItem('mqttHost');
        }
        if (localStorage.getItem('mqttPort')) {
            this.mqttPort = Number(localStorage.getItem('mqttPort'));
        }
        if (localStorage.getItem('mqttClientID')) {
            this.mqttClientID = localStorage.getItem('mqttClientID');
        }
    };
    GraphMapComponent.prototype.saveMQTTSettings = function () {
        localStorage.setItem('mqttHost', this.mqttHost);
        localStorage.setItem('mqttPort', this.mqttPort.toString());
        localStorage.setItem('mqttClientID', this.mqttClientID);
    };
    GraphMapComponent.prototype.initMQTT = function () {
        this.mqtt = new Paho.Client(this.mqttHost, this.mqttPort, this.mqttClientID);
        this.mqtt.connect({ onSuccess: this.onMQTTConnect.bind(this),
            onFailure: this.onMQTTError.bind(this)
        });
        this.mqtt.onMessageArrived = this.onMQTTMessage.bind(this);
        this.mqtt.onConnectionLost = this.onMQTTConnectionLost.bind(this);
    };
    GraphMapComponent.prototype.initScales = function () {
        this.mapWidthInMeters = this.mapWidthInPixels * this.mapMetersPerPixel;
        this.mapHeightInMeters = this.mapHeightInPixels * this.mapMetersPerPixel;
        this.xScale = d3.scaleLinear()
            .domain([-this.mapWidthInMeters / 2 - this.mapXoffset, this.mapWidthInMeters / 2 - this.mapXoffset])
            .range([0, this.mapDisplayWidth]);
        this.yScale = d3.scaleLinear()
            .domain([this.mapHeightInMeters / 2 - this.mapYoffset, -this.mapHeightInMeters / 2 - this.mapYoffset])
            .range([0, this.mapDisplayHeight]);
        console.log('Kartenmaße: ' + this.mapWidthInPixels + 'x' + this.mapHeightInPixels + ' (px) '
            + this.mapWidthInMeters + 'x' + this.mapHeightInMeters + ' (m) Auflösung:' + this.mapMetersPerPixel + ',Origin: ' + this.map_origin);
    };
    GraphMapComponent.prototype.calculateMapDisplaySettings = function () {
        this.mapAvailableWidth = window.innerWidth;
        this.mapAvailableHeight = window.innerHeight - 70; // To account for toolbar
        var mapWidthSizingFactor = this.mapAvailableWidth / this.mapWidthInPixels;
        var mapHeightSizingFactor = this.mapAvailableHeight / this.mapHeightInPixels;
        if (mapWidthSizingFactor < mapHeightSizingFactor) {
            // Map fills Width before height, so use width!
            this.mapSizingFactor = mapWidthSizingFactor;
            this.mapDisplayWidth = this.mapAvailableWidth;
            this.mapDisplayHeight = this.mapHeightInPixels * this.mapSizingFactor;
        }
        else {
            // Map fills Height before width!
            this.mapSizingFactor = mapHeightSizingFactor;
            this.mapDisplayWidth = this.mapWidthInPixels * this.mapSizingFactor;
            this.mapDisplayHeight = this.mapAvailableHeight;
        }
        this.initScales();
    };
    GraphMapComponent.prototype.loadCustomMap = function () {
        var _this = this;
        var customMap = window.localStorage.getItem('customMap');
        if (customMap !== null) {
            var stage_1 = document.getElementById('stage');
            var image_1 = new Image();
            image_1.src = customMap;
            image_1.onload = function () {
                stage_1.setAttribute('style', "background-image: url('" + customMap + "')");
                _this.mapWidthInPixels = image_1.width;
                _this.mapHeightInPixels = image_1.height;
                _this.calculateMapDisplaySettings();
                _this.setStageSizeToDisplaySettings();
                _this.initScales();
            };
        }
        if (localStorage.getItem('mapMetersPerPixel')) {
            this.mapMetersPerPixel = Number(localStorage.getItem('mapMetersPerPixel'));
            this.initScales();
        }
    };
    GraphMapComponent.prototype.setStageSizeToDisplaySettings = function () {
        var stage = document.getElementById('stage');
        stage.setAttribute('width', this.mapDisplayWidth + 'px');
        stage.setAttribute('height', this.mapDisplayHeight + 'px');
    };
    GraphMapComponent.prototype.initSvg = function () {
        // load background picture from local storage if there is one
        this.loadCustomMap();
        this.calculateMapDisplaySettings();
        this.setStageSizeToDisplaySettings();
        this.stage = d3.select('#stage');
        this.edgeGroup = this.stage.append('svg:g');
        this.ftfGroup = this.stage.append('svg:g');
        this.circleGroup = this.stage.append('svg:g');
        this.circleGroup.attr('id', 'nodes');
        this.edgeGroup.attr('id', 'edges');
        this.ftfGroup.attr('id', 'ftfs');
        this.stage
            .append('svg:defs').append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 6)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#000');
        this.stage
            .append('svg:defs').append('svg:marker')
            .attr('id', 'start-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 4)
            .attr('markerWidth', 3)
            .attr('markerHeight', 3)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M10,-5L0,0L10,5')
            .attr('fill', '#000');
        this.stage
            .append('svg:defs').append('svg:symbol')
            .attr('id', 'FTF')
            .append('svg:path')
            .attr('fill', '#FF0000');
        // Stuff for FTF Symbols and Power Indicator
        this.stage
            .append('svg:defs')
            .append('svg:line')
            .attr('id', "powerBackground")
            .attr('x1', -52)
            .attr('y1', 0)
            .attr('x2', 52)
            .attr('y2', 0)
            .attr('style', "stroke: #000000; stroke-width: 12px");
        this.stage
            .append('svg:defs')
            .append('svg:line')
            .attr('id', "power")
            .attr('x1', -50)
            .attr('y1', 0)
            .attr('x2', 50)
            .attr('y2', 0)
            .attr('style', "stroke: #00FF00; stroke-width: 9px")
            .attr('transform', "scale(0.3)");
        this.stage
            .append('svg:defs')
            .append('svg:line')
            .attr('id', "powerLost")
            .attr('x1', -50)
            .attr('y1', 0)
            .attr('x2', 50)
            .attr('y2', 0)
            .attr('style', "stroke: #FF0000; stroke-width: 9px");
        var powerBarGroup = this.stage
            .append('svg:defs')
            .append('svg:g')
            .attr('id', 'powerBar')
            .attr('transform', 'scale(0.3)');
        powerBarGroup.append('svg:use')
            .attr('xlink:href', "#powerBackground");
        var ftfBody = this.stage
            .append('svg:defs')
            .append('svg:g')
            .attr('id', 'ftfBody')
            .attr('transform', 'scale(0.3)');
        ftfBody.append('svg:rect')
            .attr('x', -50)
            .attr('y', -40)
            .attr('width', 100)
            .attr('height', 80)
            .attr('style', "stroke: #000000; stroke-width: 4px; fill: #FF0000;");
        ftfBody.append('svg:rect')
            .attr('x', -50)
            .attr('y', -40)
            .attr('width', 15)
            .attr('height', 80)
            .attr('style', "stroke: #000000; stroke-width: 4px; fill: #000000;");
        this.drawCoordinateSystem();
    };
    GraphMapComponent.prototype.drawCircles = function (event) {
        var _this = this;
        var module = this;
        var circle = this.circleGroup.selectAll('g').data(this.nodes, function (d) { return d.nodeId; });
        // update existing circles
        circle
            .selectAll('circle')
            .style('fill', function (d) { return (d === _this.selectedNode) ? d3.rgb(_this.colors(d.routeID)).brighter().toString() : _this.colors(d.routeID); })
            .style('fill-opacity', function (d) { return d.released ? 1 : 0.6; });
        // delete old circles
        circle
            .exit().remove();
        // update position
        circle.attr('transform', function (d) {
            return "translate(" + module.xScale(d.nodePosition.x) + "," + module.yScale(d.nodePosition.y) + ")";
        });
        // update names
        circle.selectAll('.idText')
            .text(function (d) {
            var text = d.nodeDescription;
            if (d.start)
                return text + '-S';
            else if (d.end)
                return text + '-E';
            else
                return text;
        });
        circle.selectAll('line')
            .attr('transform', function (d) { return 'rotate(' + (-d.nodePosition.theta * (180 / 3.1415926)) + ')'; });
        circle.selectAll('.material-icons')
            .text(function (d) {
            var text = '';
            if (d.actions.length > 0) {
                text = 'star_border';
            }
            return text;
        });
        var g = circle.enter().append('svg:g');
        g.append('circle')
            .attr('r', 10)
            .style('fill', function (d) { return (d === _this.selectedNode) ? d3.rgb(_this.colors(d.routeID)).brighter().toString() : _this.colors(d.routeID); })
            .style('stroke', function (d) { return d3.rgb(_this.colors(d.routeID)).darker().toString(); })
            .style('fill-opacity', function (d) { return d.released ? 1 : 0.6; });
        g.append('svg:text')
            .attr('x', 0)
            .attr('y', 4)
            .attr('class', 'idText')
            .style('font', '12px sans-serif')
            .style('pointer-events', 'none')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text(function (d) {
            var text = d.nodeDescription;
            if (d.start)
                return text + '-S';
            else if (d.end)
                return text + '-E';
            else
                return text;
        });
        g.append('svg:text')
            .attr('class', 'material-icons')
            .attr('style', 'font-size: 18px;')
            .attr('x', 4)
            .attr('y', -4)
            .text(function (d) {
            var text = '';
            if (d.actions.length > 0) {
                text = 'star_border';
            }
            return text;
        });
        g.append('line')
            .attr('x1', 10)
            .attr('y1', 0)
            .attr('x2', 16)
            .attr('y2', 0)
            .attr('transform', function (d) { return 'rotate(' + (-d.nodePosition.theta * (180 / 3.1415926)) + ')'; })
            .attr('style', 'stroke-width: 4px;stroke: #000000;');
        g.attr('transform', function (d) {
            return "translate(" + module.xScale(d.nodePosition.x) + "," + module.yScale(d.nodePosition.y) + ")";
        })
            .on('mousedown', function (d) {
            _this.svgActive = true;
            _this.selectedNode = d;
        })
            .on('mouseup', function (d) {
            _this.svgActive = true;
            event.stopPropagation();
            _this.buttonUpNode = d;
            if (_this.buttonDownNode === _this.buttonUpNode) {
                _this.selectedNode = d;
                console.log(_this.selectedNode);
            }
            else {
                _this.addEdge(event, _this.buttonDownNode, _this.buttonUpNode);
            }
            _this.buttonUpNode = null;
            _this.buttonDownNode = null;
            _this.drawCircles(event);
            _this.drawEdges(event);
        });
        this.circleGroup.selectAll('g')
            .call(d3.drag()
            .subject(function (d) {
            // @ts-ignore
            return { x: module.xScale(d.x), y: module.yScale(d.y) };
        })
            .on("drag", this.dragFunc.bind(this)));
    };
    GraphMapComponent.prototype.addNodes = function (event) {
        //@ts-ignore
        this.svgActive = true;
        if (this.selectedNode !== null) {
            console.log("Node selected");
            this.selectedNode = null;
            this.drawCircles(event);
            console.log("I have drawn circles");
            this.drawEdges(event);
            console.log("I have drawn edges");
            return;
        }
        console.log("here!");
        var coords = d3.pointer(event, document.getElementById('stage'));
        console.log(coords);
        var node = new Node_1.Node();
        node.nodePosition.x = this.xScale.invert(coords[0]);
        node.nodePosition.y = this.yScale.invert(coords[1]);
        node.routeID = this.currentRoute.routeID;
        // check if route already has a start
        if (this.currentRoute.nodes.length == 0) {
            node.start = true;
            this.currentRoute.startNode = node;
        }
        else if (this.currentRoute.nodes.length == 1) {
            node.end = true;
            this.currentRoute.endNode = node;
        }
        else {
            node.end = true;
            this.currentRoute.nodes[this.currentRoute.nodes.length - 1].end = false;
            this.currentRoute.endNode = node;
        }
        this.nodes.push(node);
        this.currentRoute.nodes.push(node);
        // automatically add edge between nodes, but only if they are on the same route!
        if (this.currentRoute.nodes.length > 1) {
            this.addEdge(event, this.currentRoute.nodes[this.currentRoute.nodes.length - 2], this.currentRoute.nodes[this.currentRoute.nodes.length - 1]);
        }
        this.drawCircles(event);
        this.drawEdges(event);
        console.log(this.nodes);
        console.log(this.currentRoute);
    };
    GraphMapComponent.prototype.dragFunc = function (event, d) {
        var coords = d3.pointer(event, document.getElementById('stage'));
        console.log("here in drag func");
        d.position.x = this.xScale.invert(coords[0]);
        d.position.y = this.yScale.invert(coords[1]);
        this.drawCircles(event);
        this.drawEdges(event);
        //d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    };
    GraphMapComponent.prototype.drawEdges = function (event) {
        var _this = this;
        var module = this;
        var edge = this.edgeGroup.selectAll('path').data(this.edges, function (d) { return d.edgeId; });
        // Remove old edges
        edge.exit().remove();
        // Update old edges
        edge
            .attr('d', function (d) {
            var deltaX = _this.xScale(d.endNodeObject.nodePosition.x) - _this.xScale(d.startNodeObject.nodePosition.x);
            var deltaY = _this.yScale(d.endNodeObject.nodePosition.y) - _this.yScale(d.startNodeObject.nodePosition.y);
            var dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            var normX = deltaX / dist;
            var normY = deltaY / dist;
            //const sourcePadding = d.left ? 17 : 12;
            //const targetPadding = d.right ? 17 : 12;
            var sourcePadding = 10;
            var targetPadding = 10;
            var sourceX = _this.xScale(d.startNodeObject.nodePosition.x) + (sourcePadding * normX);
            var sourceY = _this.yScale(d.startNodeObject.nodePosition.y) + (sourcePadding * normY);
            var targetX = _this.xScale(d.endNodeObject.nodePosition.x) - (targetPadding * normX);
            var targetY = _this.yScale(d.endNodeObject.nodePosition.y) - (targetPadding * normY);
            var deltaXreal = d.endNodeObject.nodePosition.x - d.startNodeObject.nodePosition.x;
            var deltaYreal = d.endNodeObject.nodePosition.y - d.startNodeObject.nodePosition.y;
            d.length = Math.sqrt(deltaXreal * deltaXreal + deltaYreal * deltaYreal);
            return "M" + sourceX + "," + sourceY + "L" + targetX + "," + targetY;
        })
            .style('stroke-opacity', function (d) {
            if (d.startNodeObject.released && d.endNodeObject.released) {
                d.released = true;
                return "1";
            }
            else {
                d.released = false;
                return "0.2";
            }
        });
        edge.enter().append('path')
            .attr('d', function (d) {
            var deltaX = _this.xScale(d.endNodeObject.nodePosition.x) - _this.xScale(d.startNodeObject.nodePosition.x);
            var deltaY = _this.yScale(d.endNodeObject.nodePosition.y) - _this.yScale(d.startNodeObject.nodePosition.y);
            var dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            var normX = deltaX / dist;
            var normY = deltaY / dist;
            //const sourcePadding = d.left ? 17 : 12;
            //const targetPadding = d.right ? 17 : 12;
            var sourcePadding = 12;
            var targetPadding = 12;
            var sourceX = _this.xScale(d.startNodeObject.nodePosition.x) + (sourcePadding * normX);
            var sourceY = _this.yScale(d.startNodeObject.nodePosition.y) + (sourcePadding * normY);
            var targetX = _this.xScale(d.endNodeObject.nodePosition.x) - (targetPadding * normX);
            var targetY = _this.yScale(d.endNodeObject.nodePosition.y) - (targetPadding * normY);
            var deltaXreal = d.endNodeObject.nodePosition.x - d.startNodeObject.nodePosition.x;
            var deltaYreal = d.endNodeObject.nodePosition.y - d.startNodeObject.nodePosition.y;
            d.length = Math.sqrt(deltaXreal * deltaXreal + deltaYreal * deltaYreal);
            return "M" + sourceX + "," + sourceY + "L" + targetX + "," + targetY;
        })
            .on('mouseup', function (e) {
            event.stopPropagation();
            if (_this.lastKeyDown === 17) {
                // Control key held!
                // maybe add trajectory config mode?
            }
            var dialogConfig = new dialog_1.MatDialogConfig();
            dialogConfig.width = "600px";
            dialogConfig.data = Object.assign({}, e);
            var edgeDialogRef = _this.edgeDialog.open(edge_form_component_1.EdgeFormComponent, dialogConfig);
            edgeDialogRef.afterClosed().subscribe(function (result) {
                if (result) {
                    Object.assign(e, result);
                }
            });
        });
    };
    GraphMapComponent.prototype.addEdge = function (event, source, target) {
        if (source === target)
            return;
        if (source === null || target === null)
            return;
        if (source.routeID != target.routeID)
            return;
        var edge = new Edge_1.Edge(source.nodeId, target.nodeId);
        // provisorisch
        edge.startNodeObject = source;
        edge.endNodeObject = target;
        edge.edgeDescription = 's' + source.nodeId.toString() + 't' + target.nodeId.toString();
        if (this.edges.find(function (e) {
            return e.edgeDescription == edge.edgeDescription;
        }) != null) {
            console.log("Edge already existent!");
            return;
        }
        else {
            this.edges.push(edge);
            this.currentRoute.edges.push(edge);
            console.log('Added edge. Source:' + source.nodeId + ' Target:' + target.nodeId);
            console.log(this.edges);
            this.drawEdges(event);
            // adjust theta of source node to point in target direction
            var xDiff = target.nodePosition.x - source.nodePosition.x;
            var yDiff = target.nodePosition.y - source.nodePosition.y;
            var theta = Math.atan2(yDiff, xDiff);
            source.nodePosition.theta = theta;
            //????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
            target.nodePosition.theta = source.nodePosition.theta;
            this.drawCircles(event);
        }
    };
    GraphMapComponent.prototype.addRoute = function () {
        // get start and end point
        var startNodes = this.currentRoute.nodes.filter(function (n) {
            return n.start;
        });
        if (startNodes.length < 1) {
            console.log('NO START POINT DEFINED IN CURRENT ROUTE!');
            this.snackBar.open('Kein Startpunkt in aktueller Route definiert. Bitte korrigieren.', 'OK');
            return;
        }
        else if (startNodes.length > 1) {
            console.log('MORE THAN ONE START POINT DEFINED! CHECK THESE NODES: ');
            console.log(startNodes);
            this.snackBar.open('Zu viele Startpunkte in aktueller Route definiert. Bitte korrigieren.', 'OK');
            return;
        }
        else {
            // == 1
            this.currentRoute.startNode = startNodes[0];
        }
        var endNodes = this.currentRoute.nodes.filter(function (n) {
            return n.end;
        });
        if (endNodes.length < 1) {
            console.log('NO END POINT DEFINED IN CURRENT ROUTE!');
            this.snackBar.open('Kein Endpunkt in aktueller Route definiert. Bitte korrigieren.', 'OK');
            return;
        }
        else if (endNodes.length > 1) {
            console.log('MORE THAN ONE END POINT DEFINED! CHECK THESE NODES: ');
            console.log(endNodes);
            this.snackBar.open('Zu viele Endpunkte in aktueller Route definiert. Bitte korrigieren.', 'OK');
            return;
        }
        else {
            // == 1
            this.currentRoute.endNode = endNodes[0];
        }
        // all is well
        console.log('Saved route:');
        console.log(this.currentRoute);
        this.currentRoute = new Route_1.Route();
        //@ts-ignore
        this.currentRoute.color = this.colors(this.currentRoute.routeID);
        this.routes.push(this.currentRoute);
        console.log('New route ID: ' + this.currentRoute.routeID);
    };
    GraphMapComponent.prototype.keyDown = function (event) {
        var _this = this;
        var module = this;
        if (this.lastKeyDown !== -1)
            return;
        this.lastKeyDown = event.keyCode;
        // entf oder backspace
        if (this.lastKeyDown === 8 || this.lastKeyDown === 46) {
            if (this.selectedNode !== null) {
                if (!this.svgActive)
                    return;
                // remove edges with node
                var edgesToRemove = this.edges.filter(function (e) {
                    return (e.startNodeId === _this.selectedNode.nodeId || e.endNodeId === _this.selectedNode.nodeId);
                });
                for (var _i = 0, edgesToRemove_1 = edgesToRemove; _i < edgesToRemove_1.length; _i++) {
                    var edge = edgesToRemove_1[_i];
                    this.edges.splice(this.edges.indexOf(edge), 1);
                }
                // remove node
                this.nodes.splice(this.nodes.indexOf(this.selectedNode), 1);
                // remove node from currentroute to fix the Edge-To-Disappearing-Node Bug
                if (this.selectedNode.routeID === this.currentRoute.routeID) {
                    this.currentRoute.nodes.splice(this.currentRoute.nodes.indexOf(this.selectedNode), 1);
                }
                this.selectedNode = null;
                this.drawCircles(event);
                this.drawEdges(event);
            }
        }
    };
    GraphMapComponent.prototype.keyUp = function (event) {
        this.lastKeyDown = -1;
        var key = event.keyCode;
    };
    GraphMapComponent.prototype.onMQTTConnect = function () {
        // Subscribe
        console.log('MQTT connected');
        this.mqtt.subscribe('hello');
        this.mqttConnected = true;
        this.snackBar.open('MQTT verbunden!', null, { duration: 2000 });
        this.initFTF();
    };
    GraphMapComponent.prototype.onMQTTError = function (error) {
        this.mqttConnected = this.mqtt.isConnected();
        console.log('MQTT ERROR:');
        console.log(error);
        this.snackBar.open('MQTT Fehler: ' + error.errorMessage, null, { duration: 2000 });
    };
    GraphMapComponent.prototype.onMQTTConnectionLost = function (info) {
        console.log('MQTT CONNECTION LOST!');
        console.log(info);
        this.mqttConnected = false;
        this.snackBar.open('MQTT getrennt!', null, { duration: 2000 });
    };
    GraphMapComponent.prototype.onMQTTMessage = function (message) {
        if (message.destinationName == 'hello') {
            this.snackBar.open('MQTT Message: ' + message.payloadString, null, { duration: 10000 });
        }
        else {
            try {
                this.updateFTFs(message);
            }
            catch (error) {
                console.log(error);
            }
        }
    };
    GraphMapComponent.prototype.onMQTTDisconnect = function () {
        console.log('MQTT Disconnected.');
        this.mqttConnected = false;
        this.snackBar.open('MQTT getrennt!', 'OK', { duration: 2000 });
    };
    GraphMapComponent.prototype.toggleSettings = function () {
        var _this = this;
        var component = this;
        var dialogConfig = new dialog_1.MatDialogConfig();
        dialogConfig.width = "400px";
        dialogConfig.data = {
            mapChanged: false,
            mapMetersPerPixel: this.mapMetersPerPixel,
            mapXoffset: this.map_origin[0],
            mapYoffset: this.map_origin[1],
            mqttChanged: false,
            mqttHost: this.mqttHost,
            mqttPort: this.mqttPort,
            mqttClientID: this.mqttClientID
        };
        var settingsDialogRef = this.settingsDialog.open(settings_form_component_1.SettingsFormComponent, dialogConfig);
        settingsDialogRef.afterClosed().subscribe(function (result) {
            if (result) {
                console.log('saved');
                _this.mapMetersPerPixel = result.mapMetersPerPixel;
                _this.map_origin = [result.mapXoffset, result.mapYoffset];
                _this.mapXoffset = result.mapXoffset + _this.mapWidthInMeters * 0.5;
                _this.mapYoffset = _this.mapHeightInMeters * 0.5 + result.mapYoffset;
                if (result.customMap) {
                    var stage_2 = document.getElementById('stage');
                    var image_2 = new Image();
                    image_2.src = result.customMap;
                    image_2.onload = function () {
                        stage_2.setAttribute('style', "background-image: url('" + result.customMap + "')");
                        localStorage.setItem('customMap', result.customMap);
                        component.mapWidthInPixels = image_2.width;
                        component.mapHeightInPixels = image_2.height;
                        component.calculateMapDisplaySettings();
                        component.setStageSizeToDisplaySettings();
                        component.initScales();
                    };
                }
                _this.mqttHost = result.mqttHost;
                _this.mqttPort = Number(result.mqttPort);
                _this.mqttClientID = result.mqttClientID;
                if (result.mqttChanged) {
                    _this.saveMQTTSettings();
                    _this.initMQTT();
                }
                if (result.mapChanged) {
                    // evtl. berichtigung der Längen und Breitenangaben
                    _this.initScales();
                    _this.updateCoordinateSystem();
                    localStorage.setItem('mapMetersPerPixel', result.mapMetersPerPixel.toString());
                }
            }
            else {
                console.log('not saved');
            }
        });
    };
    GraphMapComponent.prototype.toggleMQTT = function () {
        if (this.mqttConnected) {
            this.mqtt.disconnect();
            this.mqttManuallyDisconnected = true;
        }
        else {
            this.initMQTT();
        }
    };
    GraphMapComponent.prototype.initFTF = function () {
        if (!this.loadFTFs()) {
            var ftf = new FTF_1.FTF();
            ftf.manufacturer = 'Neobotix';
            ftf.fleet = 'LTC';
            ftf.name = 'MMO_500';
            ftf.x = 0;
            ftf.y = 0;
            ftf.theta = 0;
            ftf.batteryStatus = 0.1;
            this.mqtt.subscribe(ftf.getBaseTopic() + '/#');
            this.ftfs.push(ftf);
        }
    };
    GraphMapComponent.prototype.drawFTFs = function () {
        var _this = this;
        var ftfSymbolGroup = this.ftfGroup.selectAll('g').data(this.ftfs, function (d) { return d.id; });
        var module = this;
        ftfSymbolGroup
            .attr('transform', function (d) {
            return 'translate(' + _this.xScale(d.x) + ',' + _this.yScale(d.y) + ')';
        });
        ftfSymbolGroup
            .select('use.ftfBodyClass')
            .attr('transform', function (d) {
            return 'rotate(' + (-d.theta * (180.0 / Math.PI)) + ')';
        });
        ftfSymbolGroup
            .select('use.powerClass')
            .attr('transform', function (d) {
            return 'translate(' + -15.0 * (1 - d.batteryStatus) + ',0) scale(' + d.batteryStatus + ',1)';
        });
        var initFtfSymbol = ftfSymbolGroup.enter()
            .append('svg:g')
            .attr('id', function (d) { return 'FTF' + d.id; })
            .attr('transform', function (d) {
            return 'translate(' + _this.xScale(d.x) + ',' + _this.yScale(d.y) + ')';
        })
            .on('mouseup', function (event, d) {
            event.stopPropagation();
            if (_this.lastKeyDown === 17) {
                // Control key held!
                module.addNodeOnFTFPosition(event, d);
                return;
            }
            var dialogConfig = new dialog_1.MatDialogConfig();
            dialogConfig.data = d;
            var ftfDialogRef = _this.ftfDialog.open(ftf_form_component_1.FtfFormComponent, dialogConfig);
            ftfDialogRef.afterClosed().subscribe(function (result) {
                if (result) {
                    Object.assign(d, result);
                }
            });
        });
        initFtfSymbol
            .append('svg:use')
            .attr('xlink:href', "#ftfBody")
            .attr('class', 'ftfBodyClass')
            //.attr('id', 'ftfBody')
            .attr('transform', function (d) {
            return 'rotate(' + -d.theta * (180.0 / Math.PI) + ')';
        });
        initFtfSymbol
            .append('svg:use')
            .attr('class', 'powerBarClass')
            .attr('xlink:href', "#powerBar")
            .attr('x', 0)
            .attr('y', 18);
        initFtfSymbol
            .append('svg:use')
            .attr('xlink:href', "#power")
            .attr('class', 'powerClass')
            //.attr('id', 'power')
            .attr('x', 0)
            .attr('y', 18)
            .attr('transform', function (d) {
            return 'translate(' + -15.0 * (1 - d.batteryStatus) + ',0) scale(' + d.batteryStatus + ',1)';
        });
        ftfSymbolGroup
            .exit()
            .remove();
    };
    GraphMapComponent.prototype.updateFTFs = function (message) {
        try {
            var topic = message.destinationName.split('/');
            var name_1 = topic[2];
            var subtopic = topic[3];
            var ftfToUpdate = this.ftfs.find(function (ftf) { return ftf.name == name_1; });
            ftfToUpdate.addMessage(message);
            ftfToUpdate.updateByMQTT(message);
            this.drawFTFs();
        }
        catch (error) {
            this.snackBar.open('Kaputtes JSON als Navimessage erhalten. Kein Positionsupdate möglich.', undefined, { duration: 2000 });
            console.log(error);
            console.log(message);
        }
    };
    GraphMapComponent.prototype.addFTF = function () {
        var _this = this;
        var newFTF = new FTF_1.FTF();
        var dialogConfig = new dialog_1.MatDialogConfig();
        dialogConfig.data = newFTF;
        var ftfDialogRef = this.ftfDialog.open(ftf_form_component_1.FtfFormComponent, dialogConfig);
        ftfDialogRef.afterClosed().subscribe(function (result) {
            if (result) {
                _this.ftfs.push(result);
                _this.mqtt.subscribe(result.getBaseTopic() + '/#');
                console.log(result);
            }
        });
    };
    GraphMapComponent.prototype.toggleRouteForm = function () {
        if (this.routeFormVisible) {
            this.routeFormVisible = false;
        }
        else {
            this.routeFormVisible = true;
            this.ftfListVisible = false;
        }
    };
    GraphMapComponent.prototype.toggleFtfList = function () {
        if (this.ftfListVisible) {
            this.ftfListVisible = false;
        }
        else {
            this.ftfListVisible = true;
            this.routeFormVisible = false;
        }
    };
    GraphMapComponent.prototype.loadFTFs = function () {
        var ftfJson = localStorage.getItem('list_of_ftfs');
        if (ftfJson != null) {
            var ftfArray = JSON.parse(ftfJson);
            for (var _i = 0, ftfArray_1 = ftfArray; _i < ftfArray_1.length; _i++) {
                var ftfToRestore = ftfArray_1[_i];
                var ftf = new FTF_1.FTF();
                ftf.manufacturer = ftfToRestore.manufacturer;
                ftf.fleet = ftfToRestore.fleet;
                ftf.name = ftfToRestore.name;
                this.ftfs.push(ftf);
                this.mqtt.subscribe(ftf.getBaseTopic() + '/#');
            }
            return true;
        }
        else {
            return false;
        }
    };
    GraphMapComponent.prototype.addNodeOnFTFPosition = function (event, ftf) {
        var node = new Node_1.Node();
        node.nodePosition.x = ftf.x;
        node.nodePosition.y = ftf.y;
        node.nodePosition.theta = ftf.theta;
        node.routeID = this.currentRoute.routeID;
        // check if route already has a start
        if (this.currentRoute.nodes.length == 0) {
            node.start = true;
            this.currentRoute.startNode = node;
        }
        else if (this.currentRoute.nodes.length == 1) {
            node.end = true;
            this.currentRoute.endNode = node;
        }
        else {
            node.end = true;
            this.currentRoute.nodes[this.currentRoute.nodes.length - 1].end = false;
            this.currentRoute.endNode = node;
        }
        this.nodes.push(node);
        this.currentRoute.nodes.push(node);
        // automatically add edge between nodes, but only if they are on the same route!
        if (this.currentRoute.nodes.length > 1) {
            this.addEdge(event, this.currentRoute.nodes[this.currentRoute.nodes.length - 2], this.currentRoute.nodes[this.currentRoute.nodes.length - 1]);
        }
        this.drawCircles(event);
        this.drawEdges(event);
    };
    GraphMapComponent.prototype.drawCoordinateSystem = function () {
        this.stage.append('g')
            .attr('id', 'coordinateSystem')
            .attr('transform', 'translate(' + this.xScale(0) + ',' + this.yScale(0) + ')')
            .append('svg:use')
            .attr('xlink:href', '#coordSys');
        //.attr('transform', 'scale(0.3)')
    };
    GraphMapComponent.prototype.updateCoordinateSystem = function () {
        this.stage.selectAll('#coordinateSystem')
            .attr('transform', 'translate(' + this.xScale(0) + ',' + this.yScale(0) + ')');
    };
    GraphMapComponent = __decorate([
        core_1.Component({
            selector: 'app-graph-map',
            templateUrl: './graph-map.component.html',
            styleUrls: ['./graph-map.component.css']
        })
    ], GraphMapComponent);
    return GraphMapComponent;
}());
exports.GraphMapComponent = GraphMapComponent;
