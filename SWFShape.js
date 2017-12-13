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
      var finished = false;
      var layers = this.layers = [];
      var next_fillLeft=0, next_fillRight=0, next_line=0;
      do {
        var fillStyles, lineStyles;
        if (this.hasStyles) {
          fillStyles = this.readFillStylesFrom(bytes);
          lineStyles = this.readLineStylesFrom(bytes);
        }
        else {
          fillStyles = [{type:'solid', fill:'none'}, {type:'solid', fill:'#000'}];
          lineStyles = [{stroke:'none', width:0}];
        }
        var indexBits = bytes.readUint8();
        var fillIndexBits = indexBits >>> 4;
        var lineIndexBits = indexBits & 0xf;
        var patches = new PatchList(fillStyles, lineStyles);
        patches.i_fillLeft = next_fillLeft;
        patches.i_fillRight = next_fillRight;
        patches.i_line = next_line;
        layers.push(patches);
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
            if (flags & 0x10) {
              if (this.hasNoStyles) {
                throw new Error('newStyles in styleless shape');
              }
              if (!(flags & 1)) pt = new Point(0, 0);
              next_fillLeft = (flags & 2) ? bytes.readTopBits(fillIndexBits, false) : 0;
              next_fillRight = (flags & 4) ? bytes.readTopBits(fillIndexBits, false) : 0;
              next_line = (flags & 8) ? bytes.readTopBits(lineIndexBits, false) : 0;
              bytes.flushBits();
              break;
            }
            if (flags & 2) {
              patches.i_fillLeft = bytes.readTopBits(fillIndexBits, false);
            }
            if (flags & 4) {
              patches.i_fillRight = bytes.readTopBits(fillIndexBits, false);
            }
            if (flags & 8) {
              patches.i_line = bytes.readTopBits(lineIndexBits, false);
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
            patches.addEdge(edge);
            pt = endPt;
          }
        }
        patches.close();
      } while (!finished);
      bytes.flushBits();
    },
    readFillStylesFrom: function(bytes) {
      var count = bytes.readUint8();
      if (count === 0xff && this.hasExtendedLength) {
        count = bytes.readUint16LE();
      }
      var fillStyles = new Array(count+1);
      fillStyles[0] = this.isMorphShape ? [{type:'solid', fill:'none'}, {type:'solid', fill:'none'}] : {type:'solid', fill:'none'};
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
            var a = {type:'solid', fill:bytes.readSWFColor(this.hasNoAlpha)};
            var b = {type:'solid', fill:bytes.readSWFColor(this.hasNoAlpha)};
            return [a, b];
          }
          return {type:'solid', fill:bytes.readSWFColor(this.hasNoAlpha)};
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
          style = {joinStyle:'round', startCapStyle:'round', endCapStyle:'round'};
        }
        style.strokeWidth = width;
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
    writeSVGTo: function(xml, baseID) {
      for (var i_layer = 0; i_layer < this.layers.length; i_layer++) {
        var layer = this.layers[i_layer];
        var edges = layer.edges;
        for (var i_fill = 1; i_fill < layer.fills.length; i_fill++) {
          var fill = layer.fills[i_fill];
          var fillStyle = fill.style;
          var patches = fill.segments;
          var pathData = [];
          for (var i_patch = 0; i_patch < patches.length; i_patch++) {
            var patch = patches[i_patch];
            if (patch[0] < 0) {
              pathData.push(edges[~patch[0]].pathStartLeft);
            }
            else {
              pathData.push(edges[patch[0]].pathStartRight);
            }
            for (var ii_edge = 0; ii_edge < patch.length; ii_edge++) {
              var i_edge = patch[ii_edge];
              if (i_edge < 0) {
                pathData.push(edges[~i_edge].pathStepLeft);
              }
              else {
                pathData.push(edges[i_edge].pathStepRight);
              }
            }
          }
          var attr = {d:pathData.join('')};
          switch (fillStyle.type) {
            case 'solid':
              if (typeof fillStyle.fill === 'string') {
                attr.fill = fillStyle.fill;
              }
              else {
                attr.fill = fillStyle.fill.solidColor;
                if (fillStyle.fill.opacity !== 1) {
                  attr['opacity'] = fillStyle.fill.opacity;
                }
              }
              break;
            case 'gradient':
              var id = 'gradient' + baseID + '_' + i_layer + '_' + i_fill;
              var gradAttr = {
                id: id,
                gradientUnits: 'userSpaceOnUse',
                gradientTransform: fillStyle.matrix.toString(),
              };
              if (fillStyle.mode === 'radial') {
                gradAttr.r = 16384;
                gradAttr.cx = 0;
                gradAttr.cy = 0;
              }
              else {
                gradAttr.x1 = -16384;
                gradAttr.x2 = 16384;
              }
              var grad = xml.open(fillStyle.mode + 'Gradient', gradAttr);
              for (var i_stop = 0; i_stop < fillStyle.stops.length; i_stop++) {
                var stop = fillStyle.stops[i_stop];
                var stopAttr = {
                  offset: stop.ratio,
                  'stop-color': stop.color.solidColor,
                };
                if (stop.color.opacity !== 1) {
                  stopAttr['stop-opacity'] = stop.color.opacity;
                }
                grad.empty('stop', stopAttr);
              }
              attr.fill = 'url(#'+id+')';
              break;
            default:
              console.warn('NYI: fill style ' + fillStyle.type);
              break;
          }
          xml.empty('path', attr);
        }
        for (var i_line = 1; i_line < layer.lines.length; i_line++) {
          var line = layer.lines[i_line];
          var pathData = [];
          for (var i_segment = 0; i_segment < line.segments.length; i_segment++) {
            var seg = line.segments[i_segment];
            pathData.push(edges[seg[0]].pathStartRight);
            for (var ii_edge = 0; ii_edge < seg.length; ii_edge++) {
              var i_edge = seg[ii_edge];
              pathData.push(edges[i_edge].pathStepRight);
            }
          }
          var attr = {
            d: pathData.join(''),
            fill: 'none',
            stroke: line.style.stroke.solidColor,
            'stroke-width': line.style.strokeWidth,
            'stroke-linejoin': line.style.joinStyle,
            'stroke-linecap': line.style.startCapStyle,
          };
          if (line.style.stroke.opacity !== 1) {
            attr['stroke-opacity'] = line.style.stroke.opacity;
          }
          if (line.style.startCapStyle !== line.style.endCapStyle) {
            throw new Error('NYI: differing cap styles');
          }
          if (line.style.joinStyle === 'miter') {
            attr['stroke-miterlimit'] = line.style.miterLimitFactor;
          }
          xml.empty('path', attr);
        }
      }
    },
    toCompactFontFormat: function() {
      var cff = [];
      var last = null;
      var x = 0, y = 0;
      for (var i_layer = 0; i_layer < this.layers.length; i_layer++) {
        var layer = this.layers[i_layer];
        var edges = layer.edges;
        var segments = layer.fills[1].segments;
        for (var i_seg = 0; i_seg < segments.length; i_seg++) {
          var i_edges = segments[i_seg];
          var firstPoint;
          if (i_edges[0] < 0) {
            firstPoint = edges[~i_edges[0]].endPoint;
          }
          else {
            firstPoint = edges[i_edges[0]].startPoint;
          }
          var dx = firstPoint.x - x;
          var dy = firstPoint.y - y;
          x += dx;
          y += dy;
          if (!dy) {
            if (dx) cff.push(['hmoveto', dx]);
          }
          else if (!dx) {
            cff.push(['vmoveto', -dy]);
          }
          else {
            cff.push(['rmoveto', dx, -dy]);
          }
          var last = null;
          for (var ii_edge = 0; ii_edge < i_edges.length; ii_edge++) {
            var i_edge = i_edges[ii_edge];
            var endPoint = null, controlPoint = null;
            if (i_edge < 0) {
              var edge = edges[~i_edge];
              endPoint = edge.startPoint;
              controlPoint = edge.controlPoint;
            }
            else {
              var edge = edges[i_edge];
              endPoint = edge.endPoint;
              controlPoint = edge.controlPoint;
            }
            if (controlPoint) {
              var cubicX1 = x + (controlPoint.x - x) * 2 / 3;
              var cubicY1 = y + (controlPoint.y - y) * 2 / 3;
              var cubicX2 = endPoint.x + (controlPoint.x - endPoint.x) * 2 / 3;
              var cubicY2 = endPoint.y + (controlPoint.y - endPoint.y) * 2 / 3;
              var dc1x = cubicX1 - x;
              var dc1y = cubicY1 - y;
              var dc2x = cubicX2 - cubicX1;
              var dc2y = cubicY2 - cubicY1;
              var dx = (x = endPoint.x) - cubicX2;
              var dy = (y = endPoint.y) - cubicY2;
              if (last && last[0] === 'rrcurveto') {
                if (last.push(dc1x,-dc1y, dc2x,-dc2y, dx,-dy) >= 49) last = null;
              }
              else {
                cff.push(last = ['rrcurveto', dc1x,-dc1y, dc2x,-dc2y, dx,-dy]);
              }
            }
            else {
              var dx = endPoint.x - x, dy = endPoint.y - y;
              x += dx; y += dy;
              if (last && last[0] === 'rlineto') {
                if (last.push(dx, -dy) >= 49) last = null;
              }
              else {
                cff.push(last = ['rlineto', dx, -dy]);
              }
            }
          }
        }
      }
      return cff;
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
      return 'url(#' + id + ')';
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
      return 'url(#' + id + ')';
    },
  };
  
  function Stroke(i_edge1, i_edge2, style) {
    this.i_edge1 = i_edge1;
    this.i_edge2 = i_edge2;
    this.style = style;
  }
  
  function PatchList(fillStyles, lineStyles) {
    this.edges = [];
    this.fills = new Array(fillStyles.length);
    for (var i = 0; i < fillStyles.length; i++) {
      this.fills[i] = new Patch(this, fillStyles[i], i);
    }
    this.lines = new Array(lineStyles.length);
    for (var i = 1; i < lineStyles.length; i++) {
      this.lines[i] = new Patch(this, lineStyles[i], i);
    }
  }
  PatchList.prototype = {
    i_fillLeft: 0, i_fillRight: 0, i_line: 0,
    addEdge: function(edge) {
      var i_edge = this.edges.push(edge) - 1;
      if (this.i_fillLeft !== this.i_fillRight) {
        this.fills[this.i_fillLeft].addEdgeByIndex(i_edge, true);
        this.fills[this.i_fillRight].addEdgeByIndex(i_edge);
      }
      if (this.i_line !== 0) {
        this.lines[this.i_line].addEdgeByIndex(i_edge);
      }
    },
    close: function() {
      for (var i = 0; i < this.fills.length; i++) {
        this.fills[i].close(true);
      }
      for (var i = 1; i < this.lines.length; i++) {
        this.lines[i].close();
      }
    },
  };

  function Patch(shape, style, i_style) {
    this.shape = shape;
    this.style = style;
    this.i_style = i_style;
    this.i_edges = [];
  }
  Patch.prototype = {
    addEdgeByIndex: function(i_edge, invert) {
      if (invert) i_edge = ~i_edge;
      this.i_edges.push(i_edge);
    },
    close: function(joinEnds) {
      const i_edges = this.i_edges;
      const segments = this.segments = [];
      const edges = this.shape.edges;
      delete this.i_edges;
      while (i_edges.length > 0) {
        var i_edge = i_edges.shift();
        var segment = [i_edge];
        segments.push(segment);
        if (!i_edges.length) break;
        var startPt, startOpposite;
        if (i_edge < 0) {
          startPt = edges[~i_edge].startPoint;
          startOpposite = edges[~i_edge].i_fillRight;
        }
        else {
          startPt = edges[i_edge].endPoint;
          startOpposite = edges[i_edge].i_fillLeft;
        }
        var pt = startPt, opposite;
        connecting: for (;;) {
          for (var i = 0; i < i_edges.length; i++) {
            i_edge = i_edges[i];
            var otherPt;
            if (i_edge < 0) {
              otherPt = edges[~i_edge].endPoint;
            }
            else {
              otherPt = edges[i_edge].startPoint;
            }
            if (pt.isEqualTo(otherPt)) {
              segment.push(i_edge);
              i_edges.splice(i, 1);
              if (i_edge < 0) {
                pt = edges[~i_edge].startPoint;
                opposite = edges[~i_edge].i_fillRight;
              }
              else {
                pt = edges[i_edge].endPoint;
                opposite = edges[i_edge].i_fillLeft;
              }
              continue connecting;
            }
          }
          // no further connections were found
          if (joinEnds && !startPt.isEqualTo(pt)) {
            if (startOpposite === opposite) {
              var finalEdge = new Line(otherPt, startPt);
              finalEdge.i_fillRight = this.i_style;
              finalEdge.i_fillLeft = opposite;
              segment.push(edges.push(finalEdge) - 1);
            }
            else {
              // we don't know what's on the other side of the fill?
              throw new Error('fill with unconnected edges');
            }
          }
          break connecting;
        }
      }
    },
  };
  
  return SWFShape;

});
