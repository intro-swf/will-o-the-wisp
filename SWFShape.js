define(function() {

  'use strict';
  
  function percentFromByte(v) {
    // reversible (remember to use Math.round) to get 0-255 back
    return +(v*100/255).toFixed(1) + '%';
  }
  
  function SWFShape() {
  }
  SWFShape.prototype = {
    isMorphShape: false,
    hasStyles: false,
    hasExtendedLength: false,
    hasNoAlpha: false,
    hasExtendedLineStyle: false,
    readFrom: function(bytes) {
      var pt = new Point(0, 0);
      var i_fillLeft = 0, i_fillRight = 0, i_line = 0;
      var finished = false;
      var layers = this.layers = [];
      do {
        var fillStyles, lineStyles;
        if (this.hasStyles) {
          fillStyles = this.readFillStylesFrom(bytes);
          lineStyles = this.readLineStylesFrom(bytes);
        }
        else {
          fillStyles = ['none', '#000'];
          lineStyles = [{stroke:'none', width:0}];
        }
        var indexBits = bytes.readUint8();
        var fillIndexBits = indexBits >>> 4;
        var lineIndexBits = indexBits & 0xf;
        var layer = {fillStyles:fillStyles, lineStyles:lineStyles};
        var edges = layer.edges = [];
        layers.push(layer);
        for (;;) {
          if (bytes.readTopBits(1, false) === 0) {
            // setup
            var flags = bytes.readTopBits(5, false);
            if (flags === 0) {
              // end of shape
              finished = true;
              break;
            }
            if (flags & 1) {
              // move-to
              var coordBitCount = bytes.readTopBits(5, false);
              var x = bytes.readTopBits(coordBitCount, true);
              var y = bytes.readTopBits(coordBitCount, true);
              pt = new Point(x, y);
            }
            if (flags & 2) {
              i_fillLeft = bytes.readTopBits(fillIndexBits, false);
            }
            if (flags & 4) {
              i_fillRight = bytes.readTopBits(fillIndexBits, false);
            }
            if (flags & 8) {
              i_line = bytes.readTopBits(lineIndexBits, false);
            }
            if (flags & 0x10) {
              if (this.hasNoStyles) {
                throw new Error('newStyles in styleless shape');
              }
              bytes.flushBits();
              if (!(flags & 1)) {
                pt = new Point(0, 0);
              }
              break;
            }
          }
          else {
            // edge
            var endPt, edge;
            if (bytes.readTopBits(1, false)) {
              // straight edge flag
              var coordBits = 2 + bytes.readTopBits(4, false);
              if (bytes.readTopBits(1, false)) {
                // general line flag
                var x = bytes.readTopBits(coordBits, true);
                var y = bytes.readTopBits(coordBits, true);
                endPt = new Point(pt.x + x, pt.y + y);
              }
              else if (bytes.readTopBits(1, false)) {
                // vertical
                endPt = new Point(pt.x, pt.y + bytes.readTopBits(coordBits, true));
              }
              else {
                // horizontal
                endPt = new Point(pt.x + bytes.readTopBits(coordBits, true), pt.y);
              }
              edge = new Line(pt, endPt);
            }
            else {
              // curved edge
              var coordBits = 2 + bytes.readTopBits(4, false);
              var controlX = bytes.readTopBits(coordBits, true);
              var controlY = bytes.readTopBits(coordBits, true);
              var endX = bytes.readTopBits(coordBits, true);
              var endY = bytes.readTopBits(coordBits, true);
              var controlPt = new Point(pt.x + controlX, pt.y + controlY);
              endPt = new Point(controlPt.x + endX, controlPt.y + endY);
              edge = new Curve(pt, controlPt, endPt);
            }
            edge.i_fillLeft = i_fillLeft;
            edge.i_fillRight = i_fillRight;
            edge.i_line = i_line;
            edges.push(edge);
            pt = endPt;
          }
        }
        for (var i_fillStyle = 0; i_fillStyle < fillStyles.length; i_fillStyle++) {
          fillStyles[i_fillStyle].i_edges = [];
        }
        for (var i_lineStyle = 0; i_lineStyle < lineStyles.length; i_lineStyle++) {
          lineStyles[i_lineStyle].i_edges = [];
        }
        for (var i_edge = 0; i_edge < this.edges.length; i_edge++) {
          var edge = this.edges[i_edge];
          if ('i_fillLeft' in edge) {
            var i_fill = edge.i_fillLeft;
            var i_edges = fillStyles[i_fill].i_edges;
            i_edges.push(~i_edge);
            var pt = edge.startPoint;
            for (var j_edge = i_edge + 1; j_edge < this.edges.length; j_edge++) {
              var otherEdge = this.edges[j_edge];
              if (otherEdge.i_fillLeft === i_fill && pt.isEqualTo(otherEdge.endPoint)) {
                i_edges.push(~j_edge);
                pt = otherEdge.startPoint;
                delete otherEdge.i_fillLeft;
              }
              else if (otherEdge.i_fillRight === i_fill && pt.isEqualTo(otherEdge.startPoint)) {
                i_edges.push(j_edge);
                pt = otherEdge.endPoint;
                delete otherEdge.i_fillRight;
              }
            }
          }
          if ('i_fillRight' in edge) {
            var i_fill = edge.i_fillRight;
            var i_edges = fillStyles[i_fill].i_edges;
            i_edges.push(i_edge);
            var pt = edge.endPoint;
            for (var j_edge = i_edge + 1; j_edge < this.edges.length; j_edge++) {
              var otherEdge = this.edges[j_edge];
              if (otherEdge.i_fillLeft === i_fill && pt.isEqualTo(otherEdge.endPoint)) {
                i_edges.push(~j_edge);
                pt = otherEdge.startPoint;
                delete otherEdge.i_fillLeft;
              }
              else if (otherEdge.i_fillRight === i_fill && pt.isEqualTo(otherEdge.startPoint)) {
                i_edges.push(j_edge);
                pt = otherEdge.endPoint;
                delete otherEdge.i_fillRight;
              }
            }
          }
          if ('i_line' in edge) {
            var i_line = edge.i_line;
            var i_edges = lineStyles[i_line].i_edges;
            i_edges.push(i_edge);
            var pt = edge.endPoint;
            for (var j_edge = i_edge + 1; j_edge < this.edges.length; j_edge++) {
              var otherEdge = this.edges[j_edge];
              if (otherEdge.i_line === i_line && pt.isEqualTo(otherEdge.startPoint)) {
                i_edges.push(j_edge);
                pt = otherEdge.endPoint;
                delete otherEdge.i_line;
              }
            }
          }
        }
      } while (!finished);
      bytes.flushBits();
    },
    readFillStylesFrom: function(bytes) {
      var count = bytes.readUint8();
      if (count === 0xff && this.hasExtendedLength) {
        count = bytes.readUint16LE();
      }
      var fillStyles = new Array(count+1);
      fillStyles[0] = this.isMorphShape ? ['none', 'none'] : 'none';
      for (var i = 1; i < fillStyles.length; i++) {
        fillStyles[i] = this.readFillStyleFrom(bytes);
      }
      return fillStyles;
    },
    readFillStyleFrom: function(bytes) {
      var fillStyle = bytes.readUint8();
      switch (fillStyle) {
        case 0x00:
          if (this.isMorphShape) {
            var a = bytes.readSWFColor(this.hasNoAlpha);
            var b = bytes.readSWFColor(this.hasNoAlpha);
            return [a, b];
          }
          return bytes.readSWFColor(this.hasNoAlpha);
        case 0x10:
        case 0x12:
        case 0x13:
          var mode = (fillStyle === 0x10) ? 'linear' : 'radial';
          var hasFocalPoint = (fillStyle === 0x13);
          if (this.isMorphShape) {
            var a = {type:'gradient', mode:mode, stops:[]};
            var b = {type:'gradient', mode:mode, stops:[]};
            a.matrix = bytes.readSWFMatrix();
            b.matrix = bytes.readSWFMatrix();
            var stops = this.readGradientStopsFrom(bytes);
            a.spreadMode = b.spreadMode = stops.spreadMode;
            a.interpolationMode = b.interpolationMode = stops.interpolationMode;
            if (hasFocalPoint) {
              a.focalPoint = b.focalPoint = bytes.readInt16LE() / 0x100;
            }
            while (stops.length > 0) {
              a.stops.push(stops.shift());
              b.stops.push(stops.shift());
            }
            return [a, b];
          }
          else {
            var matrix = bytes.readSWFMatrix();
            var stops = this.readGradientStopsFrom(bytes);
            var style = {
              type: 'gradient',
              mode: mode,
              matrix: matrix,
              stops: stops,
              spreadMode: stops.spreadMode,
              interpolationMode: stops.interpolationMode,
            };
            delete stops.spreadMode;
            delete stops.interpolationMode;
            if (hasFocalPoint) {
              style.focalPoint = bytes.readInt16LE() / 0x100;
            }
            return style;
          }
          break;
        case 0x40:
        case 0x41:
        case 0x42:
        case 0x43:
          var bitmapID = bytes.readUint16LE();
          var mode = (fillStyle & 1) ? 'clipped' : 'tiled';
          var hardEdges = !!(fillStyle & 2);
          if (this.isMorphShape) {
            var a = {
              type: 'bitmap',
              mode: mode,
              matrix: bytes.readSWFMatrix(),
              bitmapID: bitmapID,
              hardEdges: hardEdges,
            };
            var b = {
              type: 'bitmap',
              mode: mode,
              matrix: bytes.readSWFMatrix(),
              bitmapID: bitmapID,
              hardEdges: hardEdges,
            };
            return [a, b];
          }
          else {
            return {
              type: 'bitmap',
              mode: mode,
              matrix: bytes.readSWFMatrix(),
              bitmapID: bitmapID,
              hardEdges: hardEdges,
            };
          }
          break;
        default:
          throw new Error('unknown fill mode');
      }
    },
    readGradientStopsFrom: function(bytes) {
      var flags = bytes.readUint8();
      var count = flags & 0xf;
      // max count is only enforced before DefineShape4
      if (count === 0 /* || count > 8 */) {
        throw new Error('illegal number of gradient points');
      }
      if (this.isMorphShape) count *= 2;
      var points = new Array(count);
      for (var i = 0; i < points.length; i++) {
        var stop = points[i] = {ratio: percentFromByte(bytes.readUint8())};
        stop.color = bytes.readSWFColor(this.hasNoAlpha);
      }
      points.spreadMode = ['pad', 'reflect', 'repeat'][flags >>> 6];
      points.interpolationMode = ['normal', 'linear'][(flags >>> 4) & 3];
      return points;
    },
    readLineStylesFrom: function(bytes) {
      var count = bytes.readUint8();
      if (count === 255 && this.hasExtendedLength) {
        count = bytes.readUint16LE();
      }
      var lineStyles = new Array(1 + count);
      lineStyles[0] = {stroke:'none', strokeWidth:0};
      if (this.isMorphShape) {
        lineStyles[0] = [lineStyles[0], lineStyles[0]];
        for (var i = 1; i < lineStyles.length; i++) {
          var a = {}, b = {};
          a.width = bytes.readUint16LE();
          b.width = bytes.readUint16LE();
          a.color = bytes.readSWFColor(this.hasNoAlpha);
          b.color = bytes.readSWFColor(this.hasNoAlpha);
          lineStyles[i] = [a, b];
        }
      }
      else for (var i = 1; i < lineStyles.length; i++) {
        var width = bytes.readUint16LE();
        var style;
        if (this.hasExtendedLineStyle) {
          style = this.readExtendedLineStyleFrom(bytes);
        }
        else {
          style = {};
        }
        style.width = width;
        style.stroke = bytes.readSWFColor(this.hasNoAlpha);
        lineStyles[i] = style;
      }
      return lineStyles;
    },
    readExtendedLineStyleFrom: function(bytes) {
      var style = {};
      var flags = bytes.readUint8();
      if (flags & 1) style.pixelHinting = true;
      if (flags & 2) style.noYScale = true;
      if (flags & 4) style.noXScale = true;
      var hasFill = flags & 8;
      style.joinStyle = ['round', 'bevel', 'miter'][(flags >>> 4) & 3];
      style.startCapStyle = ['none', 'round', 'square'][flags >>> 6];
      flags = bytes.readUint8();
      style.endCapStyle = ['none', 'round', 'square'][flags & 3];
      if (flags & 4) style.noClose = true;
      if (style.joinStyle == 'miter') {
        style.miterLimitFactor = bytes.readUint16LE() / 0x100;
      }
      if (hasFill) {
        style.strokeFill = this.readFillStyleFrom(bytes);
      }
      return style;
    },
    writeSVGTo: function(xml) {
      /*
      for (var i_region = 0; i_region < this.regions.length; i_region++) {
        var region = this.regions[i_region];
        var pathData = [];
        if (region.i_edges[0] < 0) {
          pathData.push(this.edges[~region.i_edges[0]].pathStartLeft);
        }
        else {
          pathData.push(this.edges[region.i_edges[0]].pathStartRight);
        }
        for (var i_segment = 0; i_segment < region.i_edges.length; i_segment += 2) {
          var i_edge1 = region.i_edges[i_segment],
              i_edge2 = region.i_edges[i_segment+1];
          if (i_edge1 < 0) {
            i_edge1 = ~i_edge1;
            i_edge2 = ~i_edge2;
            for (var i_edge = i_edge1; i_edge >= i_edge2; i_edge--) {
              var edge = this.edges[i_edge];
              pathData.push(edge.pathStepLeft);
            }
          }
          else {
            for (var i_edge = i_edge1; i_edge <= i_edge2; i_edge++) {
              var edge = this.edges[i_edge];
              pathData.push(edge.pathStepRight);
            }
          }
        }
        xml.empty('path', {d:pathData.join(''), fill:region.fill.toString()});
      }
      for (var i_line = 0; i_line < this.lines.length; i_line++) {
        var line = this.lines[i_line];
        var pathData = [];
        var attrs = {fill:'none', 'stroke-width':line.style.width, stroke:line.style.stroke};
        pathData.push(this.edges[line.i_edge1].pathStartRight);
        for (var i_edge = line.i_edge1; i_edge <= line.i_edge2; i_edge++) {
          pathData.push(this.edges[i_edge].pathStepRight);
        }
        attrs.d = pathData.join('');
        xml.empty('path', attrs);
      }
      */
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
  Line.prototype = {
    get pathStartRight() {
      var pt = this.startPoint;
      return 'M' + pt.x + ' ' + pt.y;
    },
    get pathStartLeft() {
      var pt = this.endPoint;
      return 'M' + pt.x + ' ' + pt.y;
    },
    get pathStepRight() {
      const pt1 = this.startPoint, pt2 = this.endPoint;
      var dx = pt2.x - pt1.x;
      var dy = pt2.y - pt1.y;
      if (dy === 0) return 'h' + dx;
      if (dx === 0) return 'v' + dy;
      return 'l'+dx+' '+dy;
    },
    get pathStepLeft() {
      const pt1 = this.endPoint, pt2 = this.startPoint;
      var dx = pt2.x - pt1.x;
      var dy = pt2.y - pt1.y;
      if (dy === 0) return 'h' + dx;
      if (dx === 0) return 'v' + dy;
      return 'l'+dx+' '+dy;
    },
  };

  function Curve(startPoint, controlPoint, endPoint) {
    this.startPoint = startPoint;
    this.controlPoint = controlPoint;
    this.endPoint = endPoint;
  }
  Curve.prototype = {
    get pathStartRight() {
      var pt = this.startPoint;
      return 'M' + pt.x + ' ' + pt.y;
    },
    get pathStartLeft() {
      var pt = this.endPoint;
      return 'M' + pt.x + ' ' + pt.y;
    },
    get pathStepRight() {
      const pt1 = this.startPoint, pt2 = this.controlPoint, pt3 = this.endPoint;
      return 'q' + (pt2.x - pt1.x) + ' ' + (pt2.y - pt1.y) + ' ' + (pt3.x - pt1.x) + ' ' + (pt3.y - pt1.y);
    },
    get pathStepLeft() {
      const pt1 = this.endPoint, pt2 = this.controlPoint, pt3 = this.startPoint;
      return 'q' + (pt2.x - pt1.x) + ' ' + (pt2.y - pt1.y) + ' ' + (pt3.x - pt1.x) + ' ' + (pt3.y - pt1.y);
    },
  };
  
  function FillRegion(fill) {
    this.fill = fill;
    this.i_edges = [];
    this.touchingLeft = [];
    this.touchingRight = [];
  }
  FillRegion.prototype = {
    addLeft: function(i, j) {
      this.i_edges.push(~j, ~i);
    },
    addRight: function(i, j) {
      this.i_edges.push(i, j);
    },
    touchLeft: function(region) {
      if (this.touchingLeft.indexOf(region) === -1) {
        this.touchingLeft.push(region);
      }
    },
    touchRight: function(region) {
      if (this.touchingRight.indexOf(region) === -1) {
        this.touchingRight.push(region);
      }
    },
  };
  
  function LinearGradient() {
    this.stops = [];
  }
  LinearGradient.prototype = {
    writeTo: function(xml) {
      var id = '_' + (xml.nextID = (xml.nextID || 0) + 1);
      var gradient = xml.open('linearGradient', {id:id, gradientUnits:'userSpaceOnUse', x1:-16384, x2:16384});
      if (this.matrix && !this.matrix.isIdentity) gradient.attr('transform', this.matrix.toString());
      for (var i = 0; i < this.stops.length; i++) {
        var stop = this.stops[i];
        var stopEl = gradient.open('stop', {offset:stop.offset, 'stop-color':stop.solidColor});
        if (stop.opacity !== 1) {
          stopEl.attr('stop-opacity', stop.opacity);
        }
      }
      return 'url("#' + id + '")';
    },
  };
  
  function RadialGradient() {
    this.stops = [];
  }
  RadialGradient.prototype = {
    writeTo: function(xml) {
      var id = '_' + (xml.nextID = (xml.nextID || 0) + 1);
      var gradient = xml.open('radialGradient', {id:id, gradientUnits:'userSpaceOnUse', r:16384, cx:0, cy:0});
      if (this.matrix && !this.matrix.isIdentity) gradient.attr('transform', this.matrix.toString());
      for (var i = 0; i < this.stops.length; i++) {
        var stop = this.stops[i];
        var stopEl = gradient.open('stop', {offset:stop.offset, 'stop-color':stop.solidColor});
        if (stop.opacity !== 1) {
          stopEl.attr('stop-opacity', stop.opacity);
        }
      }
      return 'url("#' + id + '")';
    },
  };
  
  function Stroke(i_edge1, i_edge2, style) {
    this.i_edge1 = i_edge1;
    this.i_edge2 = i_edge2;
    this.style = style;
  }
  
  return SWFShape;

});
