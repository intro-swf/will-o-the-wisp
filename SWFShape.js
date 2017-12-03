define(function() {

  'use strict';
  
  function SWFShape() {
  }
  
  function Edge(startX, startY, fillLeft, fillRight, stroke) {
    this.parts = [];
    this.startPoint = this.endPoint = new Point(startX, startY);
    this.fillLeft = fillLeft;
    this.fillRight = fillRight;
    this.stroke = stroke;
  }
  Edge.prototype = {
    line: function(x, y) {
      var endPoint = new Point(x, y);
      this.parts.push(new Line(this.endPoint, endPoint));
      this.endPoint = endPoint;
    },
    curve: function(cx,cy, x,y) {
      var controlPoint = new Point(cx, cy);
      var endPoint = new Point(x, y);
      this.parts.push(new Curve(this.endPoint, controlPoint, endPoint));
      this.endPoint = endPoint;
    },
    getRightConnection: function(edge) {
      if (this.fillRight === edge.fillRight) {
        return this.endPoint.isEqualTo(edge.startPoint) ? 1 : 0;
      }
      if (this.fillRight === edge.fillLeft) {
        return this.endPoint.isEqualTo(edge.endPoint) ? -1 : 0;
      }
    },
    getLeftConnection: function(edge) {
      if (this.fillLeft === edge.fillLeft) {
        return this.startPoint.isEqualTo(edge.endPoint) ? 1 : 0;
      }
      if (this.fillLeft === edge.fillRight) {
        return this.startPoint.isEqualTo(edge.startPoint) ? -1 : 0;
      }
    },
  };

  function Point(x, y) {
    this.x = x;
    this.y = y;
  }
  Point.prototype = {
    toString: function() {
      return this.x + ',' + this.y;
    },
    isEqualTo: function(pt) {
      return pt.x === this.x && pt.y === this.y;
    },
  };

  function Line(startPoint, endPoint) {
    this.startPoint = startPoint;
    this.endPoint = endPoint;
  }

  function Curve(startPoint, controlPoint, endPoint) {
    this.startPoint = startPoint;
    this.controlPoint = controlPoint;
    this.endPoint = endPoint;
  }
  
  return SWFShape;

});
