
requirejs.config({
  waitSeconds: Infinity, // no timeout
});

require([
  'domReady!', // use domReady.js plugin to require DOM readiness
  'bytecodeIO',
  'avm',
  'XMLWriter',
],
function(
  domReady // unused value
  ,bytecodeIO
  ,avm
  ,XMLWriter
){
  
  'use strict';
  
  function read_chunks(body, offset, context) {
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
          context.empty('swf:End');
          break;
        case 1:
          if (chunk.length !== 0) {
            console.warn('unexpected data: ShowFrame');
          }
          context.empty('swf:ShowFrame');
          break;
        case 2:
        case 22:
        case 32:
          var attrs = {class:'shape'};
          var chunkDV = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          attrs.id = '_' + chunkDV.getUint16(0, true);
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
          context.open('g', attrs);
          context.empty('rect', {
            class: 'bounds',
            x: bounds.left,
            y: bounds.top,
            width: bounds.right - bounds.left,
            height: bounds.bottom - bounds.top,
          });
          var styleText = [];
          styleText.push('.' + attrs.id + '_fill0 { fill: none; }');
          for (var style_i = 1; style_i < fillStyles.length; style_i++) {
            styleText.push('.' + attrs.id + '_fill' + style_i + ' {' + JSON.stringify(fillStyles[style_i]) + '}');
          }
          styleText.push('.' + attrs.id + '_stroke0 { stroke: none; }');
          for (var style_i = 1; style_i < strokeStyles.length; style_i++) {
            styleText.push('.' + attrs.id + '_stroke' + style_i + ' {' + JSON.stringify(strokeStyles[style_i]) + '}');
          }
          context.text('style', styleText.join('\n'));
          write_path(context, path, attrs.id);
          context.close();
          break;
        case 6:
          var tables = context.files['tables.jpg'];
          if (!tables) {
            throw new Error('DefineBits without JPEGTables');
          }
          var characterID = chunk[0] | (chunk[1] << 8);
          var file = new File(
            [tables.slice(0, -2), chunk.subarray(2)],
            characterID+'.jpg',
            {type:'image/jpeg'});
          context.files[file.name] = file;
          context.empty('swf:DefineBits', {
            id: '_' + characterID,
            href: file.name,
          });
          break;
        case 8:
          var file = new File(
            [chunk],
            'tables.jpg',
            {type:'image/jpeg'})
          context.files['tables.jpg'] = file;
          context.empty('swf:JPEGTables', {
            href: file.name,
          });
          break;
        case 9:
          var rgb = read_rgb(chunk, 0);
          context.empty('swf:SetBackgroundColor', {
            color: rgb,
          });
          break;
        case 10:
          var chunkDV = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          var fontID = '_' + chunkDV.getUint16(0, true)};
          context.open('g', {class:'font', id:fontID});
          for (var i_glyph = 0; i_glyph < font.glyphs.length; i_glyph++) {
            var glyphID = fontID + 'g' + i_glyph;
            var pathOffset = 2 + chunkDV.getUint16(2 + i_glyph*2, true);
            context.open('g', {id:glyphID});
            write_path(context, read_path(chunk, pathOffset), glyphID);
            context.close();
          }
          context.close();
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
              def.records.push(record);
            }
          }
          console.log('DefineText', def);
          break;
        case 12:
          var actions = read_actions(chunk);
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
        case 18:
        case 45:
          if (chunk.length < 4) throw new Error('invalid data length');
          var playback = {}, stream = {};
          if (chunk[0] >>> 4) throw new Error('reserved flags not zero');
          playback.hz = 5512.5 * (1 << ((chunk[0] >> 2) & 0x3));
          playback.bits = (chunk[0] & 2) ? 16 : 8;
          playback.channels = 1 + (chunk[0] & 1);
          switch (chunk[1] >>> 4) {
            case 0: stream.compression = 'none-native-endian'; break; // !!!
            case 1: stream.compression = 'adpcm'; break;
            case 2: stream.compression = 'mp3'; break;
            case 3: stream.compression = 'none-little-endian'; break;
            case 6: stream.compression = 'nellymoser'; break;
            default: throw new Error('unknown compression value');
          }
          stream.hz = 5512.5 * (1 << ((chunk[1] >> 2) & 0x3));
          stream.bits = (chunk[1] & 2) ? 16 : 8;
          stream.channels = 1 + (chunk[1] & 1);
          stream.soundSampleCount = chunk[2] | (chunk[3] << 8);
          if (stream.compression === 'mp3') {
            if (chunk.length < 6) {
              throw new Error('mp3 latency value not found');
            }
            stream.mp3Latency = chunk[4] | (chunk[5] << 8);
            if (chunk.length > 6) {
              console.warn('unexpected data after SoundStreamHead');
            }
          }
          else if (chunk.length > 4) {
            console.warn('unexpected data after SoundStreamHead');
          }
          context.push('<swf:SoundStreamHead>'
                       + '<swf:playback hz="' + playback.hz + '" bits="' + playback.bits + '" channels="' + playback.channels + '"/>'
                       + '<swf:stream compression="' + stream.compression
                        + '" hz="' + stream.hz
                        + '" bits="' + stream.bits
                        + '" channels="' + stream.channels
                        + '" samples-per-block="' + stream.soundSampleCount
                        + '" mp3-skip-samples="' + (stream.mp3Latency || 0)
                        + '"/>'
                       + '</swf:SoundStreamHead>');
          break;
        case 24:
          var attrs = {};
          if (chunk.length !== 0) {
            attrs['password-md5'] = read_string(chunk);
          }
          context.empty('swf:Protect', attrs);
          break;
        case 26:
          var chunkDV = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          var flags = chunk[0];
          var attrs = {'swf:depth': chunkDV.getUint16(1, true)};
          var chunkOffset = 3;
          if (flags & 1) attrs['swf:move'] = true;
          if (flags & 2) {
            attrs['xlink:href'] = '#_' + chunkDV.getUint16(chunkOffset, true);
            chunkOffset += 2;
          }
          if (flags & 4) {
            var matrix = read_matrix(chunk, chunkOffset);
            if (!matrix.isIdentity) {
              attrs.transform = matrix.toString();
            }
            chunkOffset = matrix.endOffset;
          }
          var colorTransform;
          if (flags & 8) {
            colorTransform = read_color_transform(chunk, chunkOffset);
            chunkOffset = colorTransform.endOffset;
          }
          if (flags & 0x10) {
            attrs['swf:ratio'] = chunkDV.getUint16(chunkOffset, true) + '/65535';
            chunkOffset += 2;
          }
          if (flags & 0x20) {
            var name = read_string(chunk, chunkOffset);
            attrs['swf:name'] = name.text;
            // TODO: UTF-8 in v5+, Shift-JIS
            chunkOffset = name.length + 1;
          }
          if (flags & 0x40) {
            attrs['swf:clip-depth'] = chunkDV.getUint16(chunkOffset, true);
            chunkOffset += 2;
          }
          if (flags & 0x80) {
            throw new Error('NYI: clip actions'); // v5+
          }
          if (chunkOffset !== chunk.length) {
            console.warn('unexpected data after PlaceObject2');
          }
          context.open('swf:PlaceObject', attrs);
          if (colorTransform) {
            context.open('filter');
            context.open('feComponentTransfer');
            var funcR = {}, funcG = {}, funcB = {}, funcA = {};
            if (colorTransform.multiply) {
              if (colorTransform.multiply.r !== 1) {
                funcR.slope = colorTransform.multiply.r;
              }
              if (colorTransform.multiply.g !== 1) {
                funcG.slope = colorTransform.multiply.g;
              }
              if (colorTransform.multiply.b !== 1) {
                funcB.slope = colorTransform.multiply.b;
              }
              if (colorTransform.multiply.a !== 1) {
                funcA.slope = colorTransform.multiply.a;
              }
            }
            if (colorTransform.add) {
              if (colorTransform.add.r !== 0) {
                funcR.intercept = colorTransform.add.r/255;
              }
              if (colorTransform.add.g !== 0) {
                funcG.intercept = colorTransform.add.g/255;
              }
              if (colorTransform.add.b !== 0) {
                funcB.intercept = colorTransform.add.b/255;
              }
              if (colorTransform.add.a !== 0) {
                funcA.intercept = colorTransform.add.a/255;
              }
            }
            if (funcR.slope || funcR.intercept) {
              context.empty('feFuncR', funcR);
            }
            if (funcG.slope || funcG.intercept) {
              context.empty('feFuncG', funcG);
            }
            if (funcB.slope || funcB.intercept) {
              context.empty('feFuncB', funcB);
            }
            if (funcA.slope || funcA.intercept) {
              context.empty('feFuncA', funcA);
            }
            context.close();
            context.close();
          }
          context.close();
          break;
        case 28:
          if (chunk.length < 2) {
            throw new Error('RemoveObject2: not enough data');
          }
          var depth = chunk[0] | (chunk[1] << 8);
          context.empty('swf:RemoveObject2', {
            depth: depth,
          });
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
            var actionBytes = chunk.slice(chunkOffset, nextActionOffset);
            action.response = read_action(actionBytes);
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
          read_chunks(chunk, 4, context);
          break;
        case 43:
          var frameLabel = read_string(chunk);
          context.text('swf:FrameLabel', {}, frameLabel);
          break;
        default:
          console.log(chunkType, chunk);
      }
    }
  }
  
  function write_path(context, path, id_base) {
    var x=0, y=0, startX, startY;
    var d = [];
    var fillClass = id_base + '_fill0';
    var strokeClass = id_base + '_stroke0';
    function endPathAt(n) {
      for (;;) {
        if (n >= path.length) return true;
        switch (path[n]) {
          case 'fill':
          case 'stroke':
          case 'm':
            return true;
          case 'styles':
            break;
          default:
            return false;
        }
        n++;
      }
    }
    for (var path_i = 0; path_i < path.length; path_i++) {
      var step = path[path_i];
      switch (step.type) {
        default:
          throw new Error('unknown step type');
        case 'fill':
          fillClass = id_base + '_fill' + step.values[0] + '_' + step.values[1];
          break;
        case 'stroke':
          strokeClass = id_base + '_stroke' + step.values[1];
          break;
        case 'styles':
          throw new Error('NYI');
        case 'm':
          if (d.length > 0) {
            context.empty('path', {class: fillClass+' '+strokeClass, d:d.join(' ')});
            d = [];
          }
          startX = x += step.values[0];
          startY = y += step.values[1];
          d.push('m' + step.values[0] + ',' + step.values[1]);
          while (path[path_i+1] && path[path_i+1].type === 'l') {
            step = path[++path_i];
            x += step.values[0];
            y += step.values[1];
            if (x === startX && y === startY && endPathAt(path_i + 1)) {
              d.push('z');
              break;
            }
            d.push(step.values[0] + ',' + step.values[1]);
          }
          break;
        case 'l':
          var prefix = 'l';
          for (;;) {
            step = path[path_i];
            x += step.values[0];
            y += step.values[1];
            if (x === startX && y === startY && endPathAt(path_i + 1)) {
              d.push('z');
              break;
            }
            d.push(prefix + step.values[0] + ',' + step.values[1]);
            prefix = '';
            if (path[path_i+1] && path[path_i+1].type === 'l') {
              path_i++;
              continue;
            }
            break;
          }
          break;
        case 'q':
          var prefix = 'q';
          for (;;) {
            step = path[path_i];
            x += step.values[2];
            y += step.values[3];
            d.push(prefix + step.values[0] + ',' + step.values[1] + ' ' + step.values[2] + ',' + step.values[3]);
            prefix = '';
            if (!path[path_i+1] || path[path_i+1].type !== 'q') {
              break;
            }
            path_i++;
          }
          break;
        case 'h':
          var prefix = 'h';
          for (;;) {
            step = path[path_i];
            x += step.values[0];
            if (x === startX && y === startY && endPathAt(path_i + 1)) {
              d.push('z');
              break;
            }
            d.push(prefix + step.values[0]);
            prefix = '';
            if (path[path_i+1] && path[path_i+1].type === 'v') {
              step = path[++path_i];
              y += step.values[0];
              if (x === startX && y === startY && endPathAt(path_i + 1)) {
                d.push('z');
                break;
              }
              d.push(step.values[0]);
              if (path[path_i+1] && path[path_i+1].type === 'h') {
                path_i++;
                continue;
              }
            }
            break;
          }
          break;
        case 'v':
          var prefix = 'v';
          for (;;) {
            step = path[path_i];
            y += step.values[0];
            if (x === startX && y === startY && endPathAt(path_i + 1)) {
              d.push('z');
              break;
            }
            d.push(prefix + step.values[0]);
            prefix = '';
            if (path[path_i+1] && path[path_i+1].type === 'h') {
              step = path[++path_i];
              x += step.values[0];
              if (x === startX && y === startY && endPathAt(path_i + 1)) {
                d.push('z');
                break;
              }
              d.push(step.values[0]);
              if (path[path_i+1] && path[path_i+1].type === 'v') {
                path_i++;
                continue;
              }
            }
            break;
          }
          break;
      }
    }
    if (d.length > 0) {
      context.empty('path', {class:fillClass+' '+strokeClass, d:d.join(' ')});
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
    var widthTwips = frameRect.right - frameRect.left;
    var heightTwips = frameRect.bottom - frameRect.top;
    var context = new XMLWriter();
    context.open('svg', {
      xmlns:"http://www.w3.org/2000/svg",
      'xmlns:xlink':"http://www.w3.org/1999/xlink",
      'xmlns:swf':"intro.swf",
      width: widthTwips/20,
      height: heightTwips/20,
      viewBox: [frameRect.left, frameRect.top, frameRect.right, frameRect.bottom].join(' '),
      'swf:version': header.version,
      'swf:frames-per-second': framesPerSecond,
    });
    context.files = {};
    read_chunks(body, offset, context);
    context.close();
    var file = context.toFile('movie.svg', 'image/svg+xml');
    context.files[file.name] = file;
    console.log(context.toString());
    console.log(context.files);
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
    var endOffset = points.length * (use_alpha?5:4);
    if (endOffset > bytes.length) {
      throw new Error('unexpected end of data');
    }
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
  
  function Matrix() {
  }
  Matrix.prototype = {
    a: 1, b: 0, c:0, d:1, e:0, f:0,
    toString: function() {
      if (this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1) {
        return 'translate(' + this.e + ', ' + this.f + ')';
      }
      if (this.b === 0 && this.c === 0 && this.e === 0 && this.f === 0) {
        if (this.a === this.d) {
          return 'scale(' + this.a + ')';
        }
        else {
          return 'scale(' + this.a + ', ' + this.d + ')';
        }
      }
      return 'matrix(' + [this.a, this.b, this.c, this.d, this.e, this.f].join(', ') + ')';
    },
    get isIdentity() {
      return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
    },
  }
  
  function read_matrix(bytes, offset) {
    var bits = bitreader(bytes, offset);
    var matrix = new Matrix;
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
      else {
        transform.multiply.a = 0x100;
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
      else {
        transform.add.a = 0;
      }
    }
    transform.endOffset = bits.getOffset();
    return transform;
  }
  
  function read_string(bytes, offset) {
    var str = '';
    offset = offset || 0;
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
        if (flags === 0) break; // end of shape data
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
  
  function read_actions(bytes) {
    var bin = new bytecodeIO.BinaryReader(bytes);
    bin.littleEndian = true;
    var parts = avm.readBinary(bin);
    var sout = new bytecodeIO.SymbolWriter();
    parts.forEach(function(part) {
      part.writeSymbols(sout);
    });
    return sout.toString();
    var offset = 0;
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
      switch (b) {
        case 0x81:
          if (data.length !== 2) throw new Error('ActionGotoFrame: invalid data');
          actions.push({
            action: 'GotoFrame',
            frame: data[0] | (data[1] << 8),
          });
          break;
        case 0x83:
          var url = read_string(data, 0);
          var target = read_string(data, url.length + 1);
          actions.push({
            action: 'GetURL',
            url: url,
            target: target,
          });
          break;
        case 0x04:
          actions.push({action:'NextFrame'});
          break;
        case 0x05:
          actions.push({action:'PreviousFrame'});
          break;
        case 0x06:
          actions.push({action:'Play'});
          break;
        case 0x07:
          actions.push({action:'Stop'});
          break;
        case 0x08:
          actions.push({action:'ToggleQuality'});
          break;
        case 0x09:
          actions.push({action:'StopSounds'});
          break;
        case 0x8A:
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
        case 0x8B:
          var target = read_string(data);
          actions.push({
            action: 'SetTarget',
            target: target,
          });
          break;
        case 0x8C:
          var label = read_string(data);
          actions.push({
            action: 'GoToLabel',
            label: label,
          });
          break;
        case 0x96:
          switch (data[0]) {
            case 0:
              actions.push({
                action: 'push',
                value: read_string(data, 1),
              });
              break;
            case 1:
              actions.push({
                action: 'push',
                value: new DataView(data.buffer, data.byteOffset + 1, 4).getFloat32(0, true),
              });
              break;
          }
          break;
        case 0x17: actions.push({action:'pop'}); break;
        case 0x0A: actions.push({action:'add'}); break;
        case 0x0B: actions.push({action:'subtract'}); break;
        case 0x0C: actions.push({action:'multiply'}); break;
        case 0x0D: actions.push({action:'divide'}); break;
        case 0x0E: actions.push({action:'equals'}); break;
        case 0x0F: actions.push({action:'less'}); break;
        case 0x10: actions.push({action:'and'}); break;
        case 0x11: actions.push({action:'or'}); break;
        case 0x12: actions.push({action:'not'}); break;
        case 0x13: actions.push({action:'string-equals'}); break;
        case 0x14: actions.push({action:'string-length'}); break;
        case 0x21: actions.push({action:'string-concat'}); break;
        case 0x15: actions.push({action:'string-extract'}); break;          
        case 0x29: actions.push({action:'string-less'}); break;
        case 0x31: actions.push({action:'mb-string-length'}); break;
        case 0x35: actions.push({action:'mb-string-extract'}); break;
        case 0x18: actions.push({action:'to-integer'}); break;
        case 0x32: actions.push({action:'char-to-ascii'}); break;
        case 0x33: actions.push({action:'ascii-to-char'}); break;
        case 0x36: actions.push({action:'mb-char-to-ascii'}); break;
        case 0x37: actions.push({action:'mb-ascii-to-char'}); break;
        case 0x99:
        case 0x9D:
          var jumpOffset = new DataView(data.buffer, data.byteOffset, 2).getInt16(0, true);
          actions.push({action:b === 0x99 ? 'jump' : 'if', offset:jumpOffset});
          break;
        case 0x9E: actions.push({action:'call'}); break;
        case 0x1C: actions.push({action:'get-variable'}); break;
        case 0x1D: actions.push({action:'set-variable'}); break;
        case 0x9A:
          var formSubmission;
          switch (data[0]) {
            case 0: formSubmission = 'none'; break;
            case 1: formSubmission = 'url-parameters'; break;
            case 2: formSubmission = 'post-data'; break;
            default: throw new Error('unknown ActionGetURL2 mode');
          }
          actions.push({action:'get-url-stack', formSubmission:formSubmission});
          break;
        case 0x9F:
          actions.push({action:'goto-frame-stack', andPlay:!!data[0]});
          break;
        case 0x20: actions.push({action:'set-frame-stack'}); break;
        case 0x22: actions.push({action:'movie-get-property'}); break;
        case 0x23: actions.push({action:'movie-set-property'}); break;
        case 0x24: actions.push({action:'clone-sprite'}); break;
        case 0x25: actions.push({action:'remove-sprite'}); break;
        case 0x27: actions.push({action:'start-drag'}); break;
        case 0x28: actions.push({action:'end-drag'}); break;
        case 0x8D: actions.push({action:'wait-for-frame-2', skipCount: data[0]}); break;
        case 0x26: actions.push({action:'trace'}); break;
        case 0x34: actions.push({action:'get-time'}); break;
        case 0x30: actions.push({action:'random-number'}); break;
        case 0x3D: actions.push({action:'call-function'}); break;
        case 0x52: actions.push({action:'call-method'}); break;
        case 0x88: actions.push({action:'constant-pool', pool: read_string(data)}); break;
        case 0x9B:
          var name = read_string(data);
          var offset = name.length + 1;
          var paramNames = new Array(data[offset] | (data[offset+1] << 8));
          offset += 2;
          for (var i = 0; i < paramNames.length; i++) {
            paramNames[i] = read_string(data, offset);
            offset += paramNames[i].length + 1;
          }
          var codeSize = data[offset] | (data[offset+1] << 8);
          actions.push({action:'define-function', name:name, paramNames:paramNames, codeSize:codeSize});
          break;
        case 0x3C: actions.push({action:'define-local'}); break;
        case 0x41: actions.push({action:'declare-local'}); break; // no initial value
        case 0x3A: actions.push({action:'delete-named-property'}); break;
        case 0x3B: actions.push({action:'delete-variable'}); break;
        case 0x46: actions.push({action:'enumerate'}); break;
        case 0x49: actions.push({action:'typed-equals'}); break;
        case 0x4E: actions.push({action:'get-member'}); break;
        case 0x42: actions.push({action:'init-array'}); break;
        case 0x43: actions.push({action:'init-object'}); break;
        case 0x53: actions.push({action:'new-method'}); break;
        case 0x40: actions.push({action:'new-object'}); break;
        case 0x4F: actions.push({action:'set-member'}); break;
        case 0x45: actions.push({action:'target-path'}); break;
        case 0x94:
          actions.push({
            action: 'with',
            size: data[0] | (data[1] << 8),
            block: read_string(data, 2),
          });
          break;
        case 0x4A: actions.push({action:'to-number'}); break;
        case 0x4B: actions.push({action:'to-string'}); break;
        case 0x44: actions.push({action:'typeof'}); break;
        case 0x47: actions.push({action:'ecma-add'}); break;
        case 0x48: actions.push({action:'ecma-less'}); break;
        case 0x3F: actions.push({action:'modulo'}); break;
        case 0x60: actions.push({action:'bit-and'}); break;
        case 0x63: actions.push({action:'bit-lshift'}); break;
        case 0x61: actions.push({action:'bit-or'}); break;
        case 0x64: actions.push({action:'bit-arshift'}); break;
        case 0x65: actions.push({action:'bit-rshift'}); break;
        case 0x62: actions.push({action:'bit-xor'}); break;
        case 0x51: actions.push({action:'decrement'}); break;
        case 0x50: actions.push({action:'increment'}); break;
        case 0x4C: actions.push({action:'duplicate'}); break;
        case 0x3E: actions.push({action:'return'}); break;
        case 0x4D: actions.push({action:'stack-swap'}); break;
        case 0x87: actions.push({action:'store-register', register:data[0]}); break;
        case 0x54: actions.push({action:'instance-of'}); break;
        case 0x55: actions.push({action:'enumerate-object'}); break;
        case 0x66: actions.push({action:'strict-equals'}); break;
        case 0x67: actions.push({action:'greater'}); break;
        case 0x68: actions.push({action:'string-greater'}); break;
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
