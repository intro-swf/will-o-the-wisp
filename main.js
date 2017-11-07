
requirejs.config({
  waitSeconds: Infinity, // no timeout
});

require([
  'domReady!', // use domReady.js plugin to require DOM readiness
],
function(
  domReady // unused value
){
  
  'use strict';
  
  // function called on a Uint8Array containing swf data
  function init_bytes(bytes) {
    var header = new ContainerHeaderBlock(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (header.mode === 'invalid') {
      throw new Error('invalid data header');
    }
    if (header.fileSize > bytes.length) {
      throw new Error('unexpected end of data');
    }
    var body = bytes.subarray(header.usedByteLength, header.fileSize);
    if (header.mode === 'compressed') {
      throw new Error('TODO: zlib compression');
    }
    var frameRect = read_twip_rect(body, 0);
    var dv = new DataView(body.buffer, body.byteOffset, body.byteLength);
    var offset = frameRect.endOffset;
    var framesPerSecond = dv.getUint16(offset, true) / 256;
    offset += 2;
    var frameCount = dv.getUint16(offset, true);
    offset += 2;
    while (offset < body.length) {
      var shortHeader = dv.getUint16(offset, true);
      offset += 2;
      var chunkType = shortHeader >>> 6;
      var chunkLength = shortHeader & 0x3F;
      if (chunkLength === 0x3F) {
        chunkLength = dv.getUint32(offset, true);
        offset += 4;
      }
      var chunk = body.subarray(offset, offset + chunkLength);
      offset += chunkLength;
      switch (chunkType) {
        case 2:
          var chunkDV = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          var shapeID = chunkDV.getUint16(0, true);
          var bounds = read_twip_rect(chunk, 2);
          var chunkOffset = bounds.endOffset;
          var count = chunk[chunkOffset++]; // 255=extended length in Shape2+
          var fillStyles = new Array(1 + count);
          for (var i_fill = 1; i_fill < fillStyles.length; i_fill++) {
            var fillStyle = chunk[chunkOffset++];
            switch (fillStyle) {
              case 0x00:
                // RGBA in Shape3+
                var rgb = read_rgb(chunk, chunkOffset);
                chunkOffset += 3;
                fillStyles[i_fill] = rgb;
                break;
              case 0x10:
              case 0x12:
                var matrix = read_matrix(chunk, chunkOffset);
                chunkOffset = matrix.endOffset;
                var gradients = new Array(chunk[chunkOffset++]);
                for (var i = 0; i < gradients.length; i++) {
                  var gradient = gradients[i] = read_gradient(chunk, chunkOffset, false); // RGBA in Shape3+
                  chunkOffset = gradient.endOffset;
                }
                fillStyles[i_fill] = {matrix:matrix, gradients:gradients};
                break;
              case 0x40:
              case 0x41:
                var bitmapID = chunkDV.getUint16(chunkOffset, true);
                chunkOffset += 2;
                var matrix = read_matrix(chunk, chunkOffset);
                chunkOffset = matrix.endOffset;
                fillStyles[i_fill] = {matrix:matrix, bitmapID:bitmapID};
                break;
              default:
                throw new Error('unknown fill mode');
            }
          }
          var count = chunk[chunkOffset++]; // 255=extended length in Shape2+
          var strokeStyles = new Array(1 + count);
          for (var i_stroke = 1; i_stroke < strokeStyles.length; i_stroke++) {
            var stroke = strokeStyles[i_stroke] = {widthTwips: chunkDV.getUint16(chunkOffset, true)};
            chunkOffset += 2;
            stroke.color = read_rgb(chunk, chunkOffset); // RGBA in Shape3+
            chunkOffset += 3;
          }
          var path = read_path(chunk, chunkOffset);
          if (path.endOffset !== chunk.length) {
            throw new Error('unexpected data after shape path');
          }
          console.log('DefineShape', shapeID, bounds, fillStyles, strokeStyles, path);
          break;
        case 9:
          var rgb = read_rgb(chunk, 0);
          console.log('SetBackgroundColor', rgb);
          break;
        case 10:
          var chunkDV = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          var font = {id: chunkDV.getUint16(0, true)};
          font.glyphs = new Array(chunkDV.getUint16(2, true) / 2);
          for (var i_glyph = 0; i_glyph < font.glyphs.length; i_glyph++) {
            var pathOffset = 2 + chunkDV.getUint16(2 + i_glyph*2, true);
            font.glyphs[i_glyph] = read_path(chunk, pathOffset);
          }
          console.log('DefineFont', font);
          break;
        case 26:
          var chunkDV = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          var flags = chunk[0];
          var place = {depth: chunkDV.getUint16(1, true)};
          var chunkOffset = 3;
          if (flags & 1) place.move = true;
          if (flags & 2) {
            place.characterID = chunkDV.getUint16(chunkOffset, true);
            chunkOffset += 2;
          }
          if (flags & 4) {
            place.matrix = read_matrix(chunk, chunkOffset);
            chunkOffset = place.matrix.endOffset;
          }
          if (flags & 8) {
            place.colorTransform = read_color_transform(chunk, chunkOffset);
            chunkOffset = place.colorTransform.endOffset;
          }
          if (flags & 0x10) {
            place.ratio = chunkDV.getUint16(chunkOffset, true);
            chunkOffset += 2;
          }
          if (flags & 0x20) {
            var name = read_string(chunk, chunkOffset);
            place.name = name.text;
            // TODO: UTF-8 in v5+, Shift-JIS
            chunkOffset = name.length + 1;
          }
          if (flags & 0x40) {
            place.clipDepth = chunkDV.getUint16(chunkOffset, true);
            chunkOffset += 2;
          }
          if (flags & 0x80) {
            throw new Error('NYI: clip actions'); // v5+
          }
          if (chunkOffset !== chunk.length) {
            throw new Error('unexpected data after PlaceObject2');
          }
          console.log('PlaceObject2', place);
          break;
        default:
          console.log(chunkType, chunk);
      }
    }
  }
  
  // function called on a blob containing swf data
  function init_blob(blob) {
    var fr = new FileReader;
    fr.onload = function(e) {
      init_bytes(new Uint8Array(this.result));
    };
    fr.readAsArrayBuffer(blob);
  }
  
  // function called when it's time to look at the location hash
  // i.e. on page load and if/when the hash changes
  function init_hash() {
    var specifier = location.hash.match(/^#\/?([^\/]+)\/([^\/]+)$/);
    if (!specifier) {
      return;
    }
    var item = specifier[1];
    var filename = specifier[2];
    var xhr = new XMLHttpRequest;
    xhr.open('GET', '//cors.archive.org/cors/' + item + '/' + filename);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
      init_blob(this.response);
    };
    xhr.send();
  }
  
  init_hash();
  window.addEventListener('hashchange', init_hash);
  
  function ContainerHeaderBlock(buffer, byteOffset, byteLength) {
    this.bytes = new Uint8Array(buffer, byteOffset, byteLength);
    this.dv = new DataView(buffer, byteOffset, byteLength);
  }
  ContainerHeaderBlock.prototype = {
    get mode() {
      switch (String.fromCharCode(this.bytes[2], this.bytes[1], this.bytes[0])) {
        case 'SWF': return 'uncompressed';
        case 'CWF': return 'compressed';
        default: return 'invalid';
      }
    },
    get version() {
      return this.bytes[3];
    },
    get fileSize() {
      return this.dv.getUint32(4, true);
    },
    get usedByteLength() {
      return 8;
    },
  };
  
  function read_twip_rect(bytes, offset) {
    var bits = bitreader(bytes, offset);
    var coordBits = bits(5, false);
    var rect = {};
    rect.left = bits(coordBits, true);
    rect.right = bits(coordBits, true);
    rect.top = bits(coordBits, true);
    rect.bottom = bits(coordBits, true);
    rect.endOffset = bits.getOffset();
    return rect;
  }
  
  function read_rgb(bytes, offset) {
    return ('rgb('
      + bytes[offset]
      + ', ' + bytes[offset+1]
      + ', ' + bytes[offset+2]
      + ')');
  }
  
  function read_rgba(bytes, offset) {
    return ('rgba('
      + bytes[offset]
      + ', ' + bytes[offset+1]
      + ', ' + bytes[offset+2]
      + ', ' + bytes[offset+3]/255
      + ')');
  }
  
  function read_gradient(bytes, offset, use_alpha) {
    var points = new Array(bytes[offset++]);
    for (var i = 0; i < points.length; i++) {
      var entry = points[i] = {ratio: bytes[offset++]};
      if (use_alpha) {
        entry.color = read_rgba(bytes, offset);
        offset += 4;
      }
      else {
        entry.color = read_rgb(bytes, offset);
        offset += 3;
      }
    }
    points.endOffset = offset;
    return points;
  }
  
  function read_matrix(bytes, offset) {
    var bits = bitreader(bytes, offset);
    var matrix = {};
    if (bits(1, false)) {
      var scaleBits = bits(5, false);
      matrix.a = bits(scaleBits, true) / 0x10000;
      matrix.d = bits(scaleBits, true) / 0x10000;
    }
    else matrix.a = matrix.d = 1;
    if (bits(1, false)) {
      var rotSkewBits = bits(5, false);
      matrix.b = bits(rotSkewBits, true) / 0x10000;
      matrix.c = bits(rotSkewBits, true) / 0x10000;
    }
    matrix.b = matrix.c = 0;
    if (bits(1, false)) {
      var translateBits = bits(5, false);
      matrix.e = bits(translateBits, true) / 20;
      matrix.f = bits(translateBits, true) / 20;
    }
    else matrix.e = matrix.f = 0;
    matrix.endOffset = bits.getOffset();
    return matrix;
  }
  
  function read_color_transform(bytes, offset) {
    var bits = bitreader(bytes, offset);
    var transform = {};
    var withAdd = bits(1, false);
    var withMultiply = bits(1, false);
    var valueBits = bits(5, false);
    if (withMultiply) {
      var r = bits(valueBits, true) / 0x100;
      var g = bits(valueBits, true) / 0x100;
      var b = bits(valueBits, true) / 0x100;
      transform.multiply = {r:r, g:g, b:b};
    }
    if (withAdd) {
      var r = bits(valueBits, true);
      var g = bits(valueBits, true);
      var b = bits(valueBits, true);
      transform.add = {r:r, g:g, b:b};
    }
    transform.endOffset = bits.getOffset();
    return transform;
  }
  
  function read_string(bytes, offset) {
    var str = '';
    while (bytes[offset]) str += String.fromCharCode(bytes[offset++]);
    return str;
  }
  
  function read_path(bytes, offset) {
    var fillIndexBits = bytes[offset] >>> 4;
    var lineIndexBits = bytes[offset] & 0xf;
    offset++;
    var path = [];
    var bits = bitreader(bytes, offset);
    while (1) {
      if (bits(1, false)) {
        // edge record flag
        if (bits(1, false)) {
          // straight edge flag
          var coordBits = 2 + bits(4, false);
          if (bits(1, false)) {
            // general line flag
            var x = bits(coordBits, true);
            var y = bits(coordBits, true);
            path.push({type:'l', values:[x, y]});
          }
          else {
            if (bits(1, false)) {
              path.push({type:'v', values:[bits(coordBits, true)]});
            }
            else {
              path.push({type:'h', values:[bits(coordBits, true)]});
            }
          }
        }
        else {
          // curved edge
          var coordBits = 2 + bits(4, false);
          var controlX = bits(coordBits, true);
          var controlY = bits(coordBits, true);
          var anchorX = bits(coordBits, true);
          var anchorY = bits(coordBits, true);
          path.push({type:'q', values:[controlX,controlY, anchorX,anchorY]});
        }
      }
      else {
        // not edge record flag
        var flags = bits(5, false);
        if (flags === 0) break; // end of shape data;
        var newStylesFlag = flags >>> 4; // DefineShape 2+ only
        var lineStyleChangeFlag = (flags >>> 3) & 1;
        var fillStyle1ChangeFlag = (flags >>> 2) & 1;
        var fillStyle0ChangeFlag = (flags >>> 1) & 1;
        if (flags & 1) {
          // move-to flag
          var coordBitCount = bits(5, false);
          var x = bits(coordBitCount, true);
          var y = bits(coordBitCount, true);
          path.push({type:'m', values:[x, y]});
        }
        if (fillStyle0ChangeFlag) {
          path.push({type:'fill', values:[0, bits(fillIndexBits, false)]});
        }
        if (fillStyle1ChangeFlag) {
          path.push({type:'fill', values:[1, bits(fillIndexBits, false)]});
        }
        if (lineStyleChangeFlag) {
          path.push({type:'stroke', values:[bits(lineIndexBits, false)]});
        }
        if (newStylesFlag) {
          throw new Error('NYI: newStylesFlag'); // DefineShape 2+
        }
      }
    }
    path.endOffset = bits.getOffset();
    return path;
  }
  
  function bitreader(bytes, offset) {
    var bit_buf = 0, bit_count = 0;
    function bits(n, signed) {
      if (n === 0) return 0;
      while (bit_count < n) {
        bit_buf = (bit_buf << 8) | bytes[offset++];
        bit_count += 8;
      }
      var value;
      if (signed) {
        value = bit_buf << (32-bit_count) >> (32-n);
      }
      else {
        value = bit_buf << (32-bit_count) >>> (32-n);
      }
      bit_count -= n;
      return value;
    }
    bits.getOffset = function() {
      return offset;
    };
    return bits;
  }
  
});
