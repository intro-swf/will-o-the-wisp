
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
  
  function read_chunks(body, offset) {
    var dv = new DataView(body.buffer, body.byteOffset, body.byteLength);
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
        case 0:
          if (chunk.length !== 0) {
            console.warn('unexpected data: End');
          }
          console.log('End');
          break;
        case 1:
          if (chunk.length !== 0) {
            console.warn('unexpected data: ShowFrame');
          }
          console.log('ShowFrame');
          break;
        case 2:
        case 22:
          var chunkDV = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          var shapeID = chunkDV.getUint16(0, true);
          var bounds = read_twip_rect(chunk, 2);
          var chunkOffset = bounds.endOffset;
          var supportExtendedLength = chunkType !== 2;
          var withAlpha = chunkType !== 2 && chunkType !== 22;
          var fillStyles = read_fill_styles(chunk, bounds.endOffset, supportExtendedLength, withAlpha);
          var strokeStyles = read_stroke_styles(chunk, fillStyles.endOffset, supportExtendedLength, withAlpha);
          chunkOffset = strokeStyles.endOffset;
          var path = read_path(chunk, chunkOffset, supportExtendedLength, withAlpha);
          if (path.endOffset !== chunk.length) {
            console.warn('unexpected data after shape path');
          }
          console.log(
            chunkType === 22 ? 'DefineShape2'
            : 'DefineShape',
            shapeID, bounds, fillStyles, strokeStyles, path);
          break;
        case 6:
          var characterID = chunk[0] | (chunk[1] << 8);
          var jpegData = chunk.subarray(2);
          console.log('DefineBits', {characterID:characterID, jpegData:jpegData});
          break;
        case 8:
          console.log('JPEGTables', chunk);
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
        case 11:
          var chunkDV = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          var def = {characterID: chunkDV.getUint16(0, true)};
          def.bounds = read_twip_rect(chunk, 2);
          def.matrix = read_matrix(chunk, def.bounds.endOffset);
          var chunkOffset = def.matrix.endOffset;
          var glyphBits = chunk[chunkOffset++];
          var advanceBits = chunk[chunkOffset++];
          def.records = [];
          while (1) {
            var b = chunk[chunkOffset++];
            if (b & 0x80) {
              // text style record
              var record = {type:'style'};
              var hasX = b & 1;
              var hasY = b & 2;
              var hasColor = b & 4;
              var hasFont = b & 8;
              if (hasFont) {
                record.fontID = chunkDV.getUint16(chunkOffset, true);
                chunkOffset += 2;
              }
              if (hasColor) {
                record.color = read_rgb(chunk, chunkOffset);
                chunkOffset += 3;
              }
              if (hasX) {
                record.xOffset = chunkDV.getInt16(chunkOffset, true);
                chunkOffset += 2;
              }
              if (hasY) {
                record.xOffset = chunkDV.getInt16(chunkOffset, true);
                chunkOffset += 2;
              }
              if (hasFont) {
                record.textHeight = chunkDV.getUint16(chunkOffset, true);
                chunkOffset += 2;
              }
              def.records.push(record);
            }
            else if (b === 0) break;
            else {
              // glyph record
              var record = {type:'glyph'};
              var count = b & 0x7F;
              var readBits = bitreader(chunk, chunkOffset);
              record.glyphs = new Array(count);
              for (var i_glyph = 0; i_glyph < count; i_glyph++) {
                var index = readBits(glyphBits, false);
                var advance = readBits(advanceBits, true);
                record.glyphs[i_glyph] = {index:index, advance:advance};
              }
              chunkOffset = readBits.getOffset();
            }
          }
          console.log('DefineText', def);
          break;
        case 12:
          var actions = read_actions(chunk, 0);
          if (actions.endOffset !== chunk.length) {
            console.warn('unexpected data after DoAction');
          }
          console.log('DoAction', actions);
          break;
        case 13:
          var chunkDV = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          var fontInfo = {id: chunkDV.getUint16(0, true)};
          fontInfo.nameRaw = chunk.subarray(3, 3 + chunk[2]);
          var flags = chunk[3 + chunk[2]];
          var codeTable = chunk.subarray(3 + chunk[2] + 1);
          fontInfo.wideChar = flags & 1;
          fontInfo.bold = flags & 2;
          fontInfo.italic = flags & 4;
          fontInfo.ansi = flags & 8;
          fontInfo.shiftJIS = flags & 0x10;
          if (fontInfo.wideChar) {
            var codeTableDV = new DataView(
              codeTable.buffer,
              codeTable.byteOffset,
              codeTable.byteLength);
            codeTable = new Uint16Array(codeTable.length/2);
            for (var i_code = 0; i_code < codeTable.length; i_code++) {
              codeTable[i_code] = codeTableDV.getUint16(i_code * 2, true);
            }
            fontInfo.codeTable = codeTable;
          }
          else fontInfo.codeTable = codeTable;
          console.log('DefineFontInfo', fontInfo);
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
            console.warn('unexpected data after PlaceObject2');
          }
          console.log('PlaceObject2', place);
          break;
        case 28:
          if (chunk.length < 2) {
            throw new Error('RemoveObject2: not enough data');
          }
          var depth = chunk[0] | (chunk[1] << 8);
          console.log('RemoveObject2', depth);
          break;
        case 34:
          var chunkDV = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          var def = {characterID: chunkDV.getUint16(0, true)};
          def.isMenuButton = !!(chunk[2] & 1);
          var actionOffset = 3 + chunkDV.getUint16(3, true);
          var chunkOffset = 5;
          def.records = [];
          while (chunkOffset < actionOffset) {
            var flags = chunk[chunkOffset++];
            if (flags === 0) break;
            var record = {
              up: !!(flags & 1),
              over: !!(flags & 2),
              down: !!(flags & 4),
              hitTest: !!(flags & 8),
              characterID: chunkDV.getUint16(chunkOffset, true),
              depth: chunkDV.getUint16(chunkOffset+2, true),
            };
            record.matrix = read_matrix(chunk, chunkOffset + 4);
            chunkOffset = record.matrix.endOffset;
            if (true /* only for DefineButton2 */) {
              record.colorTransform = read_color_transform(chunk, chunkOffset, true);
              chunkOffset = record.colorTransform.endOffset;
            }
            def.records.push(record);
          }
          if (chunkOffset < actionOffset) {
            throw new Error('unexpected data');
          }
          def.actions = [];
          while (chunkOffset < chunk.length) {
            var nextActionOffset = chunkOffset + chunkDV.getUint16(chunkOffset, true);
            if (nextActionOffset === chunkOffset) {
              chunkOffset += 2;
              break;
            }
            var flags = chunk[chunkOffset += 2];
            var action = {
              keyCode: flags >>> 1,
              overDownToIdle: !!(flags & 1),
            };
            flags = chunk[chunkOffset++];
            action.idleToOverUp = !!(flags & 1);
            action.overUpToIdle = !!(flags & 2);
            action.overUpToOverDown = !!(flags & 4);
            action.overDownToOverUp = !!(flags & 8);
            action.overDownToOutDown = !!(flags & 0x10);
            action.outDownToOverDown = !!(flags & 0x20);
            action.outDownToIdle = !!(flags & 0x40);
            action.idleToOverDown = !!(flags & 0x80);
            action.response = read_action(chunk, chunkOffset);
            if (action.response.endOffset !== nextActionOffset) {
              console.warn('unexpected data after button action record');
            }
            def.actions.push(action);
            chunkOffset = nextActionOffset;
          }
          if (chunkOffset !== chunk.length) {
            console.warn('unexpected data after DefineButton2');
          }
          console.log('DefineButton2', def);
          break;
        case 39:
          var chunkDV = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          var def = {characterID: chunkDV.getUint16(0, true)};
          def.frameCount = chunkDV.getUint16(2, true);
          console.log('DefineSprite', def);
          read_chunks(chunk, 4);
          break;
        default:
          console.log(chunkType, chunk);
      }
    }
  }
  
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
    read_chunks(body, offset);
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
    var translateBits = bits(5, false);
    if (translateBits) {
      // in twips
      matrix.e = bits(translateBits, true);
      matrix.f = bits(translateBits, true);
    }
    else matrix.e = matrix.f = 0;
    matrix.endOffset = bits.getOffset();
    return matrix;
  }
  
  function read_color_transform(bytes, offset, withAlpha) {
    var bits = bitreader(bytes, offset);
    var transform = {};
    var withAdd = bits(1, false);
    var withMultiply = bits(1, false);
    var valueBits = bits(4, false);
    if (withMultiply) {
      var r = bits(valueBits, true) / 0x100;
      var g = bits(valueBits, true) / 0x100;
      var b = bits(valueBits, true) / 0x100;
      transform.multiply = {r:r, g:g, b:b};
      if (withAlpha) {
        transform.multiply.a = bits(valueBits, true) / 0x100;
      }
    }
    if (withAdd) {
      var r = bits(valueBits, true);
      var g = bits(valueBits, true);
      var b = bits(valueBits, true);
      transform.add = {r:r, g:g, b:b};
      if (withAlpha) {
        transform.add.a = bits(valueBits, true) / 0x100;
      }
    }
    transform.endOffset = bits.getOffset();
    return transform;
  }
  
  function read_string(bytes, offset) {
    var str = '';
    while (bytes[offset]) str += String.fromCharCode(bytes[offset++]);
    return str;
  }
  
  function read_path(bytes, offset, allowExtendedLength, withAlpha) {
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
        if (flags & 1) {
          // move-to flag
          var coordBitCount = bits(5, false);
          var x = bits(coordBitCount, true);
          var y = bits(coordBitCount, true);
          path.push({type:'m', values:[x, y]});
        }
        if (flags & 2) {
          // fillStyle0ChangeFlag
          path.push({type:'fill', values:[0, bits(fillIndexBits, false)]});
        }
        if (flags & 4) {
          // fillStyle1ChangeFlag
          path.push({type:'fill', values:[1, bits(fillIndexBits, false)]});
        }
        if (flags & 8) {
          // lineStyleChangeFlag
          path.push({type:'stroke', values:[bits(lineIndexBits, false)]});
        }
        if (flags & 0x10) {
          // newStylesFlag
          var fillStyles = read_fill_styles(bytes, bits.getOffset(), allowExtendedLength, withAlpha);
          var strokeStyles = read_stroke_styles(bytes, fillStyles.endOffset, allowExtendedLength, withAlpha);
          offset = strokeStyles.endOffset;
          fillIndexBits = bytes[offset] >>> 4;
          lineIndexBits = bytes[offset] & 0xf;
          offset++;
          bits = bitreader(bytes, offset);
          path.push({type:'styles', fill:fillStyles, stroke:strokeStyles});
        }
      }
    }
    path.endOffset = bits.getOffset();
    return path;
  }
  
  function read_actions(bytes, offset) {
    var actions = [];
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    while (offset < bytes.length) {
      var b = bytes[offset++];
      if (b === 0) break;
      var data = '';
      if (b & 0x80) {
        var len = dv.getUint16(offset, true);
        offset += 2;
        data = bytes.subarray(offset, offset + len);
        offset += len;
      }
      b &= 0x7F;
      switch (b) {
        case 1:
          if (data.length !== 2) throw new Error('ActionGotoFrame: invalid data');
          actions.push({
            action: 'GotoFrame',
            frame: data[0] | (data[1] << 8),
          });
          break;
        case 3:
          var url = read_string(data, 0);
          var target = read_string(data, url.length + 1);
          actions.push({
            action: 'GetURL',
            url: url,
            target: target,
          });
          break;
        case 4:
          actions.push({action:'NextFrame'});
          break;
        case 5:
          actions.push({action:'PreviousFrame'});
          break;
        case 6:
          actions.push({action:'Play'});
          break;
        case 7:
          actions.push({action:'Stop'});
          break;
        case 8:
          actions.push({action:'ToggleQuality'});
          break;
        case 9:
          actions.push({action:'StopSounds'});
          break;
        case 10:
          if (data.length !== 3) {
            throw new Error('WaitForFrame: invalid data');
          }
          var frame = data[0] | (data[1] << 8);
          var skipCount = data[2];
          actions.push({
            action: 'WaitForFrame',
            frame: frame,
            skipCount: skipCount,
          });
          break;
        case 11:
          var target = read_string(data);
          actions.push({
            action: 'SetTarget',
            target: target,
          });
          break;
        case 12:
          var label = read_string(data);
          actions.push({
            action: 'GoToLabel',
            label: label,
          });
          break;
        default:
          console.warn('unknown action code: ' + b);
          actions.push({
            action: 'unknown',
            code: b,
            data: data,
          });
          break;
      }
    }
    actions.endOffset = offset;
    return actions;
  }
  
  function read_fill_styles(bytes, offset, allowExtendedLength, withAlpha) {
    var count = bytes[offset++];
    if (count === 255 && allowExtendedLength) {
      count = bytes[offset] | (bytes[offset+1] << 8);
      offset += 2;
    }
    var fillStyles = new Array(1 + count);
    for (var i_fill = 1; i_fill < fillStyles.length; i_fill++) {
      var fillStyle = bytes[offset++];
      switch (fillStyle) {
        case 0x00:
          if (withAlpha) {
            var rgba = read_rgba(bytes, offset);
            offset += 4;
            fillStyles[i_fill] = rgba;
          }
          else {
            var rgb = read_rgb(bytes, offset);
            offset += 3;
            fillStyles[i_fill] = rgb;
          }
          break;
        case 0x10:
        case 0x12:
          var matrix = read_matrix(bytes, offset);
          offset = matrix.endOffset;
          var gradients = new Array(bytes[offset++]);
          for (var i = 0; i < gradients.length; i++) {
            var gradient = gradients[i] = read_gradient(bytes, offset, withAlpha);
            offset = gradient.endOffset;
          }
          fillStyles[i_fill] = {matrix:matrix, gradients:gradients};
          break;
        case 0x40:
        case 0x41:
          var bitmapID = bytes[offset] | (bytes[offset+1] << 8);
          var matrix = read_matrix(bytes, offset + 2);
          offset = matrix.endOffset;
          fillStyles[i_fill] = {matrix:matrix, bitmapID:bitmapID};
          break;
        default:
          throw new Error('unknown fill mode');
      }
    }
    fillStyles.endOffset = offset;
    return fillStyles;
  }
  
  function read_stroke_styles(bytes, offset, allowExtendedLength, withAlpha) {
    var count = bytes[offset++];
    if (count === 255 && allowExtendedLength) {
      count = bytes[offset] | (bytes[offset+1] << 8);
      offset += 2;
    }
    var strokeStyles = new Array(1 + count);
    for (var i_stroke = 1; i_stroke < strokeStyles.length; i_stroke++) {
      var widthTwips = bytes[offset] | (bytes[offset+1] << 8);
      offset += 2;
      var style;
      if (withAlpha) {
        style = read_rgba(bytes, offset);
        offset += 4;
      }
      else {
        style = read_rgb(bytes, offset);
        offset += 3;
      }
      strokeStyles[i_stroke] = {widthTwips:widthTwips, style:style};
      offset += 2;
    }
    strokeStyles.endOffset = offset;
    return strokeStyles;
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
