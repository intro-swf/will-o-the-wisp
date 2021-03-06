define(['MakeshiftXML'], function(MakeshiftXML) {

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
      if (this.isMorphShape) {
        var targetShape = new SWFShape;
        targetShape.readFrom(bytes);
        var targetEdges = Array.prototype.concat.apply([], targetShape.layers.map(function(layer) {
          return layer.edges;
        }));
        for (var i_layer = 0; i_layer < this.layers.length; i_layer++) {
          var layer = this.layers[i_layer];
          if (layer.edges.length > targetEdges.length) {
            throw new Error('morph shape: not enough edges');
          }
          layer.edges.morphTo = targetEdges.splice(0, layer.edges.length);
          for (var i_edge = 0; i_edge < layer.edges.length; i_edge++) {
            var fromEdge = layer.edges[i_edge], toEdge = layer.edges.morphTo[i_edge];
            if (fromEdge.controlPoint && !toEdge.controlPoint) {
              toEdge.controlPoint = new Point(
                (toEdge.startPoint.x + toEdge.endPoint.x)/2
                ,(toEdge.startPoint.y + toEdge.endPoint.y)/2
              );
            }
            else if (toEdge.controlPoint && !fromEdge.controlPoint) {
              fromEdge.controlPoint = new Point(
                (fromEdge.startPoint.x + fromEdge.endPoint.x)/2
                ,(fromEdge.startPoint.y + fromEdge.endPoint.y)/2
              );
            }
          }
          for (var i_edge = 0; i_edge < layer.edges.length; i_edge++) {
            var fromEdge = layer.edges[i_edge], toEdge = layer.edges.morphTo[i_edge];
            if (!fromEdge.startPoint.isEqualTo(toEdge.startPoint)) break;
            if (!fromEdge.endPoint.isEqualTo(toEdge.endPoint)) break;
            if (fromEdge.controlPoint && !fromEdge.controlPoint.isEqualTo(toEdge.controlPoint)) break;
          }
          if (i_edge === layer.edges.length) {
            delete layer.edges.morphTo;
          }
        }
        if (targetEdges.length !== 0) {
          throw new Error('morph shape: too many edges');
        }
      }
    },
    readFillStylesFrom: function(bytes) {
      var count = bytes.readUint8();
      if (count === 0xff && this.hasExtendedLength) {
        count = bytes.readUint16LE();
      }
      var fillStyles = new Array(count+1);
      fillStyles[0] = {type:'solid', fill:'none'};
      for (var i = 1; i < fillStyles.length; i++) {
        fillStyles[i] = this.readFillStyleFrom(bytes);
      }
      return fillStyles;
    },
    readFillStyleFrom: function(bytes) {
      var fillStyle = bytes.readUint8();
      switch (fillStyle) {
        case 0x00:
          var obj = {type:'solid', fill:bytes.readSWFColor(this.hasNoAlpha)};
          if (this.isMorphShape) {
            obj.morphTo = {type:'solid', fill:bytes.readSWFColor(this.hasNoAlpha)};
            if (obj.morphTo.fill === obj.fill) delete obj.morphTo;
          }
          return obj;
        case 0x10:
        case 0x12:
        case 0x13:
          var mode = (fillStyle === 0x10) ? 'linear' : 'radial';
          var hasFocalPoint = (fillStyle === 0x13);
          var obj = {type:'gradient', mode:mode, matrix:bytes.readSWFMatrix()};
          if (this.isMorphShape) {
            var morphMatrix = bytes.readSWFMatrix();
            if (!morphMatrix.isEqualTo(obj.matrix)) {
              obj.matrix.morphTo = morphMatrix;
            }
          }
          var stops = obj.stops = this.readGradientStopsFrom(bytes);
          obj.spreadMode = stops.spreadMode;
          obj.interpolationMode = stops.interpolationMode;
          delete stops.spreadMode;
          delete stops.interpolationMode;
          if (hasFocalPoint) {
            obj.focalPoint = bytes.readInt16LE() / 0x100;
          }
          return obj;
        case 0x40:
        case 0x41:
        case 0x42:
        case 0x43:
          var bitmapID = bytes.readUint16LE();
          var mode = (fillStyle & 1) ? 'clipped' : 'tiled';
          var hardEdges = !!(fillStyle & 2);
          var obj = {
            type: 'bitmap',
            mode: mode,
            matrix: bytes.readSWFMatrix(),
            bitmapID: bitmapID,
            hardEdges: hardEdges,
          };
          if (this.isMorphShape) {
            var morphMatrix = bytes.readSWFMatrix();
            if (!morphMatrix.isEqualTo(obj.matrix)) {
              obj.matrix.morphTo = morphMatrix;
            }
          }
          return obj;
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
      if (this.isMorphShape) {
        for (var i = 0; i < points.length; i++) {
          points[i].morphTo = points.splice(i+1, 1)[0];
          if (points[i].morphTo.ratio === points[i].ratio && points[i].morphTo.color === points[i].color) {
            delete points[i].morphTo;
          }
        }
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
        if (this.hasExtendedLineStyle) throw new Error('NYI: morph with extended line style');
        for (var i = 1; i < lineStyles.length; i++) {
          var obj = {joinStyle:'round', startCapStyle:'round', endCapStyle:'round'};
          obj.morphTo = {joinStyle:'round', startCapStyle:'round', endCapStyle:'round'};
          obj.strokeWidth = bytes.readUint16LE();
          obj.morphTo.strokeWidth = bytes.readUint16LE();
          obj.stroke = bytes.readSWFColor(this.hasNoAlpha);
          obj.morphTo.stroke = bytes.readSWFColor(this.hasNoAlpha);
          if (obj.morphTo.strokeWidth === obj.strokeWidth && obj.morphTo.stroke === obj.stroke) {
            delete obj.morphTo;
          }
          lineStyles[i] = obj;
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
    getFillProps: function(xml, id, fillStyle) {
      switch (fillStyle.type) {
        case 'solid':
          var props = {fill: fillStyle.fill.solidColor};
          if (fillStyle.fill.opacity !== 1 || (fillStyle.morphTo && fillStyle.morphTo.opacity !== 1)) {
            props.opacity = fillStyle.fill.opacity;
          }
          if (fillStyle.morphTo) {
            if (fillStyle.morphTo.fill.solidColor !== fillStyle.fill.solidColor) {
              props.morphTo = {fill: fillStyle.morphTo.fill.solidColor};
            }
            if (fillStyle.morphTo.fill.opacity !== fillStyle.fill.opacity) {
              props.morphTo = props.morphTo || {};
              props.morphTo.opacity = fillStyle.morphTo.fill.opacity;
            }
          }
          return props;
        case 'gradient':
          var grad = xml.open(fillStyle.mode + 'Gradient', {
            id: id,
            gradientUnits: 'userSpaceOnUse',
            gradientTransform: fillStyle.matrix.toString(),
          });
          if (fillStyle.mode === 'radial') {
            grad.attr('r', 16384);
            grad.attr('cx', 0);
            grad.attr('cy', 0);
          }
          else {
            grad.attr('x1', -16384);
            grad.attr('x2', 16384);
          }
          if (fillStyle.matrix.morphTo) {
            grad.empty('animate', {
              attributeName: 'gradientTransform',
              to: fillStyle.matrix.morphTo.toString(),
            });
          }
          for (var i_stop = 0; i_stop < fillStyle.stops.length; i_stop++) {
            var stop = fillStyle.stops[i_stop];
            var stopEl = grad.open('stop', {
              offset: stop.ratio,
              'stop-color': stop.color.solidColor,
            });
            if (stop.color.opacity !== 1 || stop.morphTo && stop.morphTo.color.opacity !== 1) {
              stopEl.attr('stop-opacity', stop.color.opacity);
            }
            if (stop.morphTo) {
              if (stop.morphTo.ratio !== stop.ratio) {
                stopEl.empty('animate', {
                  attributeName: 'offset',
                  to: stop.morphTo.ratio
                });
              }
              if (stop.morphTo.color.solidColor !== stop.color.solidColor) {
                stopEl.empty('animate', {
                  attributeName: 'stop-color',
                  to: stop.morphTo.color.solidColor,
                });
              }
              if (stop.morphTo.color.opacity !== stop.color.opacity) {
                stopEl.empty('animate', {
                  attributeName: 'stop-opacity',
                  to: stop.morphTo.color.opacity,
                });
              }
            }
          }
          return {fill:'url("#'+id+'")'};
        case 'bitmap':
          if (fillStyle.bitmapID === 0xffff) {
            return {fill:'none'}; // TODO: what's the deal with this?
          }
          var bitmap = this.bitmaps[fillStyle.bitmapID];
          var maskID;
          if (bitmap.maskURL) {
            maskID = id + '_mask';
            var maskEl = xml.open('mask', {
              id: maskID,
              maskUnits: 'userSpaceOnUse',
              maskContentUnits: 'userSpaceOnUse',
              x: 0,
              y: 0,
              width: bitmap.width,
              height: bitmap.height,
            });
            maskEl.empty('image', {
              href: bitmap.maskURL,
              width: bitmap.width,
              height: bitmap.height
            });
          }
          var pattern = xml.open('pattern', {
            id: id,
            width: bitmap.width,
            height: bitmap.height,
            patternUnits: 'userSpaceOnUse',
          });
          if (!fillStyle.matrix.isIdentity || (fillStyle.matrix.morphTo && !fillStyle.matrix.isIdentity)) {
            pattern.attr('patternTransform', fillStyle.matrix.toString());
          }
          if (fillStyle.matrix.morphTo) {
            pattern.empty('animate', {
              attributeName: 'patternTransform',
              to: fillStyle.matrix.morphTo.toString(),
            });
          }
          var imageEl = pattern.open('image', {href: bitmap.url, image: bitmap.width, height: bitmap.height});
          if (fillStyle.hardEdges) imageEl.attr('class', 'hard-edges');
          return {fill:'url("#'+id+'")'};
        default:
          throw new Error('unexpected fill type');
      }
    },
    makeSVG: function(baseID) {
      var xml = new MakeshiftXML('g', {id:'shape'+baseID});
      for (var i_layer = 0; i_layer < this.layers.length; i_layer++) {
        var layer = this.layers[i_layer];
        var edges = layer.edges;
        var morphEdges = edges.morphTo;
        var layerID = this.layers.length === 1 ? '' : 'L' + i_layer;
        for (var i_fill = 1; i_fill < layer.fills.length; i_fill++) {
          var fill = layer.fills[i_fill];
          if (fill.segments.length === 0) continue;
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
                var edge = edges[~i_edge];
                pathData.push(edge.pathStepLeft);
              }
              else {
                var edge = edges[i_edge];
                pathData.push(edge.pathStepRight);
              }
            }
          }
          
          var rect = morphEdges ? null : fill.toRect();
          
          if (rect
              && fillStyle.type === 'bitmap'
              && fillStyle.matrix.b === 0
              && fillStyle.matrix.c === 0
              && !fillStyle.matrix.morphTo) {
            var bitmap = this.bitmaps[fillStyle.bitmapID];
            if (bitmap.width * fillStyle.matrix.a === rect.width
                && bitmap.height * fillStyle.matrix.d === rect.height) {
              var imageEl = xml.empty('image', {
                href: bitmap.url,
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
              });
              if (fillStyle.hardEdges) {
                imageEl.attr('class', 'hard-edges');
              }
              continue;
            }
          }
          
          var fillProps = this.getFillProps(xml, layerID + 'F' + i_fill, fillStyle);
          
          var shapeEl;
          if (rect) {
            shapeEl = xml.open('rect', {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            });
          }
          else {
            shapeEl = xml.open('path', {d: pathData.join('')});
              if (morphEdges) {
              var morphPathData = [];
              for (var i_patch = 0; i_patch < patches.length; i_patch++) {
                var patch = patches[i_patch];
                if (patch[0] < 0) {
                  morphPathData.push(morphEdges[~patch[0]].pathStartLeft);
                }
                else {
                  morphPathData.push(morphEdges[patch[0]].pathStartRight);
                }
                for (var ii_edge = 0; ii_edge < patch.length; ii_edge++) {
                  var i_edge = patch[ii_edge];
                  if (i_edge < 0) {
                    var edge = morphEdges[~i_edge];
                    morphPathData.push(edge.pathStepLeft);
                  }
                  else {
                    var edge = morphEdges[i_edge];
                    morphPathData.push(edge.pathStepRight);
                  }
                }
              }
              morphPathData = morphPathData.join('');
              if (morphPathData !== shapeEl.attrValues.d) {
                shapeEl.empty('animate', {'attributeName':'d', 'to':morphPathData});
              }
            }
          }
          shapeEl.attr('fill', fillProps.fill);
          if ('opacity' in fillProps) {
            shapeEl.attr('opacity', fillProps.opacity);
          }
          if ('morphTo' in fillProps) {
            if ('fill' in fillProps.morphTo) {
              shapeEl.empty('animate', {attributeName:'fill', to:fillProps.morphTo.fill});
            }
            if ('opacity' in fillProps.morphTo) {
              shapeEl.empty('animate', {attributeName:'opacity', to:fillProps.morphTo.fill});
            }
          }
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
          var pathEl = xml.open('path', attr);
          if (line.style.morphTo) {
            var morphStyle = line.style.morphTo;
            if (morphStyle.stroke.solidColor !== line.style.stroke.solidColor) {
              pathEl.empty('animate', {attributeName:'stroke', to:morphStyle.stroke.solidColor});
            }
            if (morphStyle.stroke.opacity !== line.style.stroke.opacity) {
              pathEl.empty('animate', {attributeName:'stroke-opacity', to:morphStyle.stroke.opacity});
            }
            if (morphStyle.strokeWidth !== line.style.strokeWidth) {
              pathEl.empty('animate', {attributeName:'stroke-width', to:morphStyle.strokeWidth});
            }
          }
          if (morphEdges) {
            var morphPathData = [];
            for (var i_segment = 0; i_segment < line.segments.length; i_segment++) {
              var seg = line.segments[i_segment];
              morphPathData.push(morphEdges[seg[0]].pathStartRight);
              for (var ii_edge = 0; ii_edge < seg.length; ii_edge++) {
                var i_edge = seg[ii_edge];
                morphPathData.push(morphEdges[i_edge].pathStepRight);
              }
            }
            morphPathData = morphPathData.join('');
            if (morphPathData !== attr.d) {
              pathEl.empty('animate', {'attributeName':'d', 'to':morphPathData});
            }
          }
        }
      }
      return xml;
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
              var cubicX1 = Math.round(x + (controlPoint.x - x) * 2 / 3);
              var cubicY1 = Math.round(y + (controlPoint.y - y) * 2 / 3);
              var cubicX2 = Math.round(endPoint.x + (controlPoint.x - endPoint.x) * 2 / 3);
              var cubicY2 = Math.round(endPoint.y + (controlPoint.y - endPoint.y) * 2 / 3);
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
        edge.i_fillLeft = this.i_fillLeft;
        edge.i_fillRight = this.i_fillRight;
        this.fills[this.i_fillLeft].addEdgeByIndex(i_edge, true);
        this.fills[this.i_fillRight].addEdgeByIndex(i_edge);
      }
      if (this.i_line !== 0) {
        this.lines[this.i_line].addEdgeByIndex(i_edge);
      }
    },
    close: function() {
      for (var i = 0; i < this.fills.length; i++) {
        this.fills[i].close();
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
    toRect: function() {
      if (this.segments.length !== 1) return null;
      const segment = this.segments[0];
      if (segment.length !== 4) return null;
      const edges = this.shape.edges;
      const startPoint = segment[0] < 0
        ? edges[~segment[0]].endPoint
        : edges[segment[0]].startPoint;
      var changes = [];
      for (var i = 0; i < 4; i++) {
        var i_edge = segment[i];
        var edge, dx, dy;
        if (i_edge < 0) {
          edge = edges[~i_edge];
          changes.push({
            dx: edge.startPoint.x - edge.endPoint.x,
            dy: edge.startPoint.y - edge.endPoint.y,
          });
        }
        else {
          edge = edges[i_edge];
          changes.push({
            dx: edge.endPoint.x - edge.startPoint.x,
            dy: edge.endPoint.y - edge.startPoint.y,
          });
        }
        if ('controlPoint' in edge) return null;
      }
      if (changes[0].dy === 0) {
        if (changes[0].dx === 0) return null;
        if (changes[1].dx !== 0) return null;
        if (changes[2].dx !== -changes[0].dx) return null;
        if (changes[3].dx !== 0) return null;
        if (changes[1].dy === 0) return null;
        if (changes[2].dy !== 0) return null;
        if (changes[3].dy !== -changes[1].dy) return null;
        var r = new SWFRect;
        r.left = startPoint.x;
        r.top = startPoint.y;
        r.width = changes[0].dx;
        r.height = changes[1].dy;
        return r;
      }
      else if (changes[0].dx === 0) {
        if (changes[0].dy === 0) return null;
        if (changes[1].dy !== 0) return null;
        if (changes[2].dy !== -changes[0].dy) return null;
        if (changes[3].dy !== 0) return null;
        if (changes[1].dx === 0) return null;
        if (changes[2].dx !== 0) return null;
        if (changes[3].dx !== -changes[1].dx) return null;
        var r = new SWFRect;
        r.left = startPoint.x;
        r.top = startPoint.y;
        r.width = changes[1].dx;
        r.height = changes[0].dy;
        return r;
      }
      else return null;
    },
    addEdgeByIndex: function(i_edge, invert) {
      if (invert) i_edge = ~i_edge;
      this.i_edges.push(i_edge);
    },
    close: function() {
      const i_edges = this.i_edges;
      const segments = this.segments = [];
      const edges = this.shape.edges;
      delete this.i_edges;
      while (i_edges.length > 0) {
        var i_edge = i_edges.shift();
        var segment = [i_edge];
        segments.push(segment);
        if (!i_edges.length) break;
        var startPt;
        if (i_edge < 0) {
          startPt = edges[~i_edge].startPoint;
        }
        else {
          startPt = edges[i_edge].endPoint;
        }
        var pt = startPt;
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
              }
              else {
                pt = edges[i_edge].endPoint;
              }
              continue connecting;
            }
          }
          // no further connections were found
          break connecting;
        }
      }
    },
  };
  
  function SWFRect() {
  }
  SWFRect.prototype = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    get width() { return this.right - this.left; },
    set width(n) {
      if (n < 0) {
        this.right = this.left;
        this.left += n;
      }
      else {
        this.right = this.left + n;
      }
    },
    get height() { return this.bottom - this.top; },
    set height(n) {
      if (n < 0) {
        this.bottom = this.top;
        this.top += n;
      }
      else {
        this.bottom = this.top + n;
      }
    },
    isEqualTo: function(r) {
      if (this === r) return true;
      return this.left === r.left && this.top === r.top
          && this.right === r.right && this.bottom === r.bottom;
    },
    toString: function() {
      return [this.left, this.top, this.width, this.height].join(' ');
    },
    union: function(otherRect) {
      var inflated = new SWFRect;
      inflated.left = Math.min(this.left, otherRect.left);
      inflated.top = Math.min(this.top, otherRect.top);
      inflated.right = Math.max(this.right, otherRect.right);
      inflated.bottom = Math.max(this.bottom, otherRect.bottom);
      return inflated;
    },
  };
  
  SWFShape.Rect = SWFRect;
  
  return SWFShape;

});
