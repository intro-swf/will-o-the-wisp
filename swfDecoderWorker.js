
importScripts('require.js');

require([
  'dataExtensions'
  ,'ChunkReader'
  ,'MakeshiftXML'
  ,'SWFShape'
  ,'OTFTable'
  ,'bitmapTools'
  ,'z'
],
function(
  dataExtensions
  ,ChunkReader
  ,MakeshiftXML
  ,SWFShape
  ,OTFTable
  ,bitmapTools
  ,zlib
) {
  
  'use strict';
  
  const SWFRect = SWFShape.Rect;
  
  const TAG_END = 0
    ,TAG_SHOW_FRAME = 1
    ,TAG_DEFINE_SHAPE = 2
      ,TAG_DEFINE_SHAPE_2 = 22
      ,TAG_DEFINE_SHAPE_3 = 32
      ,TAG_DEFINE_SHAPE_4 = 83
    ,TAG_PLACE_OBJECT = 4
      ,TAG_PLACE_OBJECT_2 = 26
    ,TAG_REMOVE_OBJECT = 5
      ,TAG_REMOVE_OBJECT_2 = 28
    // DEFINE_BITS tags always use long length?
    ,TAG_DEFINE_BITS = 6
      ,TAG_DEFINE_BITS_2 = 21
      ,TAG_DEFINE_BITS_3 = 35
      ,TAG_DEFINE_BITS_4 = 90
      ,TAG_DEFINE_BITS_LOSSLESS = 20
      ,TAG_DEFINE_BITS_LOSSLESS_2 = 36
    ,TAG_DEFINE_BUTTON = 7
      ,TAG_DEFINE_BUTTON_2 = 34
    ,TAG_JPEG_TABLES = 8
    ,TAG_SET_BACKGROUND_COLOR = 9
    ,TAG_DEFINE_FONT = 10
      ,TAG_DEFINE_FONT_2 = 48
      ,TAG_DEFINE_FONT_INFO = 13
      ,TAG_DEFINE_FONT_INFO_2 = 62
      ,TAG_DEFINE_FONT_NAME = 88
    ,TAG_DEFINE_TEXT = 11
      ,TAG_DEFINE_TEXT_2 = 33
    ,TAG_DO_ACTION = 12
    ,TAG_DEFINE_SOUND = 14
    ,TAG_PLAY_SOUND = 15
    ,TAG_DEFINE_BUTTON_SOUND = 17
    ,TAG_SOUND_STREAM_HEAD = 18
      ,TAG_SOUND_STREAM_HEAD_2 = 45
    ,TAG_SOUND_STREAM_BLOCK = 19
    ,TAG_PROTECT = 24
      ,TAG_ENABLE_DEBUGGER = 58
      ,TAG_ENABLE_DEBUGGER_2 = 64
    ,TAG_DEFINE_EDIT_TEXT = 37
    ,TAG_DEFINE_SPRITE = 39
    ,TAG_FRAME_LABEL = 43
    ,TAG_DEFINE_MORPH_SHAPE = 46
    ,TAG_FILE_ATTRIBUTES = 69
    ,TAG_DEFINE_SCALING_GRID = 78
    ,TAG_EXPORT = 56
    ,TAG_DEBUG_ID = 63
  ;
  
  const EVT_ONLOAD = 1
    ,EVT_ENTER_FRAME = 2
    ,EVT_UNLOAD = 4
    ,EVT_MOUSE_MOVE = 8
    ,EVT_MOUSE_DOWN = 0x10
    ,EVT_MOUSE_UP = 0x20
    ,EVT_KEY_DOWN = 0x40
    ,EVT_KEY_UP = 0x80
    ,EVT_DATA = 0x100
    ,EVT_INITIALIZE = 0x200
    ,EVT_PRESS = 0x400
    ,EVT_RELEASE = 0x800
    ,EVT_RELEASE_OUTSIDE = 0x1000
    ,EVT_ROLL_OVER = 0x2000
    ,EVT_ROLL_OUT = 0x4000
    ,EVT_DRAG_OVER = 0x8000
    ,EVT_DRAG_OUT = 0x10000
    ,EVT_KEY_PRESS = 0x20000
    ,EVT_CONSTRUCT = 0x40000
  ;
  
  function readSWF(input) {
    var frameCount;
    var swfVersion;
    var displayObjects = {};
    var sounds = {};
    var nextUpdates = [];
    var fonts = {};
    var bitmaps = {};
    var clipAtDepth = {};
    var jpegTables;
    var nextFrame = new FrameInfo;
    function showFrame() {
      frameCount--;
      while (input.peekUint16LE() === 0x0040) {
        input.skipBytes(2);
        nextFrame.count++;
        frameCount--;
      }
      nextUpdates.push(nextFrame);
      self.postMessage(JSON.stringify(nextUpdates));
      nextFrame = new FrameInfo;
      nextUpdates.length = 0;
    }
    function readChunkHeader() {
      return input.gotUint16LE().then(function(b) {
        var typeCode = b >>> 6;
        var len = b & 0x3F;
        if (len < 0x3F) {
          if (len === 0) {
            return processChunk(typeCode);
          }
          return input.gotUint8Array(len).then(function(data) {
            return processChunk(typeCode, data);
          });
        }
        return input.gotUint32LE().then(function(len) {
          return input.gotUint8Array(len);
        })
        .then(function(data) {
          return processChunk(typeCode, data);
        });
      });
    }
    function processChunk(typeCode, data) {
      switch (typeCode) {
        case TAG_END:
          if (frameCount > 0) {
            if (frameCount === 1) {
              showFrame();
            }
            else {
              throw new Error('missing ' + frameCount + ' frames');
            }
          }
          return;
        case TAG_JPEG_TABLES:
          var info = data.readJPEGInfo();
          data.warnIfMore();
          if (!info.hasHuffmanTables) {
            throw new Error('no huffman tables found');
          }
          jpegTables = info.data;
          break;
        case TAG_DEFINE_BITS:
          var characterID = data.readUint16LE();
          var info = data.readJPEGInfo();
          data.warnIfMore();
          var jpeg = bitmapTools.jpegJoin(jpegTables, info.data);
          var url = URL.createObjectURL(jpeg);
          var imageID = 'bitmap' + characterID;
          var imageSVG = new MakeshiftXML('image', {id:imageID, href:url, width:info.width, height:info.height});
          bitmaps[characterID] = {id:imageID, width:info.width, height:info.height};
          nextUpdates.push(['def', imageSVG.toString()]);
          break;
        case TAG_DEFINE_BITS_2:
        case TAG_DEFINE_BITS_3:
          var characterID = data.readUint16LE();
          var jpegData = (typeCode < TAG_DEFINE_BITS_3)
            ? data.subarray(data.offset)
            : data.readSubarray(data.readUint32LE());
          var jpegFile, info;
          if (jpegData[0] === 0xff && jpegData[1] === 0xd9) {
            jpegData.offset = 4;
            info = jpegData.readJPEGInfo();
            jpegData.warnIfMore();
            jpegFile = new Blob([info.data], {type:'image/jpeg'});
          }
          else {
            info = jpegData.readJPEGInfo();
            if (jpegData.offset < jpegData.length) {
              var tempTables = info;
              info = jpegData.readJPEGInfo();
              jpegData.warnIfMore();
              jpegFile = bitmapTools.jpegJoin(tempTables.data, info.data);
            }
            else {
              jpegFile = new Blob([info.data], {type:'image/jpeg'});
            }
          }
          var maskID;
          if (typeCode >= TAG_DEFINE_BITS_3) {
            maskID = 'mask' + characterID;
            var uncompressedSize = info.width * info.height;
            var compressed = data.subarray(data.offset);
            var uncompressed = zlib.inflate(compressed, uncompressedSize);
            if (uncompressed.length !== uncompressedSize) {
              throw new Error('not enough mask data');
            }
            var rows = [];
            for (var i = 0; i < info.height; i++) {
              rows[i] = uncompressed.subarray(info.width*i, info.width*(i+1));
            }
            var pal32 = new Uint32Array(256);
            var pal8 = new Uint8Array(pal32.buffer);
            for (var i = 0; i < 256; i++) {
              pal32[i] = 0xffffffff;
              pal8[i*4 + 3] = i;
            }
            var maskURL = URL.createObjectURL(bitmapTools.makeBitmapBlob({rows:rows, palette:pal32, bpp:8}));
            var maskSVG = new MakeshiftXML('mask', {
              id: maskID,
              maskUnits: 'userSpaceOnUse',
              maskContentUnits: 'userSpaceOnUse',
              x: 0,
              y: 0,
              width: info.width,
              height: info.height,
            });
            maskSVG.empty('image', {href:maskURL, width:info.width, height:info.height});
            nextUpdates.push(['def', maskSVG.toString()]);
          }
          var url = URL.createObjectURL(jpegFile);
          var imageID = 'bitmap' + characterID;
          var imageAttr = {id:imageID, href:url, width:info.width, height:info.height};
          if (maskID) imageAttr.mask = 'url(#' + maskID + ')';
          var imageSVG = new MakeshiftXML('image', imageAttr);
          bitmaps[characterID] = {id:imageID, width:info.width, height:info.height};
          nextUpdates.push(['def', imageSVG.toString()]);
          break;
        case TAG_DEFINE_BITS_LOSSLESS:
          var characterID = data.readUint16LE();
          var format = data.readUint8();
          var width = data.readUint16LE();
          var height = data.readUint16LE();
          var paletteSize = (format === 3) ? data.readUint8() + 1 : 0;
          var compressed = data.subarray(data.offset);
          var uncompressedLength;
          var rowBytes;
          switch (format) {
            case 3:
              rowBytes = (width + 3) & ~3;
              uncompressedLength = paletteSize * 3 + rowBytes * height;
              break;
            case 4:
              rowBytes = (width*2 + 3) & ~3;
              uncompressedLength = rowBytes * height;
              break;
            case 5:
              rowBytes = width*4;
              uncompressedLength = rowBytes * height;
              break;
            default:
              throw new Error('unknown bitmap format');
          }
          var uncompressed = zlib.inflate(compressed, uncompressedLength);
          var bitmapFile;
          switch (format) {
            case 3:
              var palette = new Uint8Array(paletteSize * 4);
              for (var i = 0; i < paletteSize; i++) {
                palette[i*4] = uncompressed[i*3];
                palette[i*4 + 1] = uncompressed[i*3 + 1];
                palette[i*4 + 2] = uncompressed[i*3 + 2];
                palette[i*4 + 3] = 0xff;
              }
              palette = new Uint32Array(palette.buffer, palette.byteOffset, paletteSize);
              var rows = new Array(height);
              var pixels = uncompressed.subarray(paletteSize * 3);
              for (var i = 0; i < height; i++) {
                rows[i] = pixels.subarray(rowBytes*i, rowBytes*i + width);
              }
              bitmapFile = bitmapTools.makeBitmapBlob({
                bpp: 8,
                rows: rows,
                palette: palette,
              });
              break;
            case 5:
              var rows = new Array(height);
              for (var i = 0; i < height; i++) {
                var row = uncompressed.subarray(rowBytes*i, rowBytes*(i+1));
                for (var j = 0; j < width; j++) {
                  row[j*3] = row[j*4+1];
                  row[j*3+1] = row[j*4+2];
                  row[j*3+2] = row[j*4+3];
                }
                rows[i] = row.subarray(0, width*3);
              }
              bitmapFile = bitmapTools.makeBitmapBlob({
                bpp: 24,
                rows: rows,
              });
              break;
            default:
              throw new Error('NYI: lossless mode ' + format);
          }
          var url = URL.createObjectURL(bitmapFile);
          var imageID = 'bitmap' + characterID;
          var imageSVG = new MakeshiftXML('image', {id:imageID, href:url, width:width, height:height});
          bitmaps[characterID] = {id:imageID, width:width, height:height};
          nextUpdates.push(['def', imageSVG.toString()]);
          break;
        case TAG_DEFINE_BITS_LOSSLESS_2:
          var characterID = data.readUint16LE();
          var format = data.readUint8();
          var width = data.readUint16LE();
          var height = data.readUint16LE();
          var paletteSize = (format === 3) ? data.readUint8() + 1 : 0;
          var compressed = data.subarray(data.offset);
          var uncompressedLength;
          var rowBytes;
          switch (format) {
            case 3:
              rowBytes = (width + 3) & ~3;
              uncompressedLength = paletteSize * 4 + rowBytes * height;
              break;
            case 5:
              rowBytes = width*4;
              uncompressedLength = rowBytes * height;
              break;
            default:
              throw new Error('unknown bitmap format');
          }
          var uncompressed = zlib.inflate(compressed, uncompressedLength);
          var bitmapFile;
          switch (format) {
            case 3:
              var palette = new Uint32Array(uncompressed.buffer, uncompressed.byteOffset, paletteSize);
              var rows = new Array(height);
              var pixels = uncompressed.subarray(paletteSize * 4);
              for (var i = 0; i < height; i++) {
                rows[i] = pixels.subarray(rowBytes*i, rowBytes*i + width);
              }
              bitmapFile = bitmapTools.makeBitmapBlob({
                bpp: 8,
                rows: rows,
                palette: palette,
              });
              break;
            case 5:
              var rows = new Array(height);
              for (var i = 0; i < height; i++) {
                rows[i] = uncompressed.subarray(rowBytes*i, rowBytes*(i+1));
              }
              bitmapFile = bitmapTools.makeBitmapBlob({
                bpp: 32,
                rows: rows,
              });
              break;
            default:
              throw new Error('NYI: lossless mode ' + format);
          }
          var url = URL.createObjectURL(bitmapFile);
          var imageID = 'bitmap' + characterID;
          var imageSVG = new MakeshiftXML('image', {id:imageID, href:url, width:width, height:height});
          bitmaps[characterID] = {id:imageID, width:width, height:height};
          nextUpdates.push(['def', imageSVG.toString()]);
          break;
        case TAG_DEFINE_SHAPE:
        case TAG_DEFINE_SHAPE_2:
        case TAG_DEFINE_SHAPE_3:
          var id = data.readUint16LE();
          var bounds = data.readSWFRect();
          var shape = new SWFShape;
          shape.hasStyles = true;
          shape.bitmaps = bitmaps;
          if (typeCode >= TAG_DEFINE_SHAPE_2) shape.hasExtendedLength = true;
          if (typeCode < TAG_DEFINE_SHAPE_3) shape.hasNoAlpha = true;
          shape.readFrom(data);
          var defs = shape.makeSVGStyleDefs(id);
          for (var i = 0; i < defs.length; i++) {
            nextUpdates.push(['def', defs[i].toString()]);
          }
          var shapeSVG = shape.makeSVG(id);
          shapeSVG.name = 'svg';
          shapeSVG.attr({
            viewBox: bounds.toString(),
            width: bounds.width,
            height: bounds.height,
          });
          nextUpdates.push(['def', shapeSVG.toString()]);
          displayObjects[id] = '#shape'+id;
          break;
        case TAG_DEFINE_FONT:
          var id = data.readUint16LE();
          var dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
          var font = {};
          var glyphs = font.glyphs = new Array(dv.getUint16(2, true) / 2);
          for (var i_glyph = 0; i_glyph < glyphs.length; i_glyph++) {
            data.offset = 2 + dv.getUint16(2 + i_glyph*2, true);
            var shape = new SWFShape;
            shape.readFrom(data);
            glyphs[i_glyph] = {shape: shape};
          }
          fonts[id] = font;
          break;
        case TAG_DEFINE_FONT_INFO:
        case TAG_DEFINE_FONT_INFO_2:
          var id = data.readUint16LE();
          var font = fonts[id];
          var nameLen = data.readUint8();
          font.name = data.readByteString(nameLen);
          var flags = data.readUint8();
          var has16BitChars = !!(flags & 1);
          font.bold = !!(flags & 2);
          font.italic = !!(flags & 4);
          font.ansi = !!(flags & 8);
          font.shiftJIS = !!(flags & 0x10);
          if (typeCode >= TAG_DEFINE_FONT_INFO_2) {
            font.languageCode = data.readUint8();
          }
          var i_glyph = 0;
          if (has16BitChars) {
            while (data.offset < data.length) {
              font.glyphs[i_glyph++].char = data.readUTF16LE(1);
            }
          }
          else {
            while (data.offset < data.length) {
              font.glyphs[i_glyph++].char = data.readByteString(1);
            }
          }
          break;
        case TAG_DEFINE_FONT_2:
          var id = data.readUint16LE();
          var font = {};
          var flags = data.readUint8();
          font.bold = !!(flags & 1);
          font.italic = !!(flags & 2);
          var has16BitChars = !!(flags & 4);
          var has32BitOffsets = !!(flags & 8);
          font.ansi = !!(flags & 0x10);
          font.shiftJIS = !!(flags & 0x40);
          var hasLayout = !!(flags & 0x80);
          font.languageCode = data.readUint8(); // SWF5+
          var nameLen = data.readUint8();
          font.name = data.readByteString(nameLen);
          var glyphs = font.glyphs = new Array(data.readUint16LE());
          var offsetBase = data.offset;
          var mapOffset;
          if (has32BitOffsets) {
            for (var i = 0; i < glyphs.length; i++) {
              glyphs[i] = offsetBase + data.readUint32LE();
            }
            mapOffset = offsetBase + data.readUint32LE();
          }
          else {
            for (var i = 0; i < glyphs.length; i++) {
              glyphs[i] = offsetBase + data.readUint16LE();
            }
            mapOffset = offsetBase + data.readUint16LE();
          }
          for (var i = 0; i < glyphs.length; i++) {
            if (data.offset !== glyphs[i]) {
              throw new Error('unexpected data');
            }
            var shape = new SWFShape;
            shape.readFrom(data);
            glyphs[i] = {shape: shape};
          }
          if (data.offset !== mapOffset) {
            throw new Error('unexpected data');
          }
          if (has16BitChars) {
            for (var i = 0; i < glyphs.length; i++) {
              glyphs[i].char = data.readUTF16LE(1);
            }
          }
          else {
            for (var i = 0; i < glyphs.length; i++) {
              glyphs[i].char = data.readByteString(1);
            }
          }
          if (hasLayout) {
            font.ascent = data.readInt16LE();
            font.descent = data.readInt16LE();
            font.leadingHeight = data.readInt16LE();
            var advance = data.readSubarray(glyphs.length * 2);
            for (var i = 0; i < glyphs.length; i++) {
              glyphs[i].advance = advance.readInt16LE();
              glyphs[i].bounds = data.readSWFRect();
            }
            var kerning = font.kerning = new Array(data.readUint16LE());
            if (has16BitChars) {
              for (var i_kerning = 0; i_kerning < kerning.length; i_kerning++) {
                var chars = data.readUTF16LE(2);
                var adjust = data.readInt16LE();
                kerning[i_kerning] = {chars:chars, adjust:adjust};
              }
            }
            else {
              for (var i_kerning = 0; i_kerning < kerning.length; i_kerning++) {
                var chars = data.readByteString(2);
                var adjust = data.readInt16LE();
                kerning[i_kerning] = {chars:chars, adjust:adjust};
              }
            }
          }
          data.warnIfMore();
          fonts[id] = font;
          break;
        case TAG_DEFINE_FONT_NAME:
          var id = data.readUint16LE();
          fonts[id].displayName = data.readByteString('\0');
          fonts[id].copyrightMessage = data.readByteString('\0');
          break;
        case TAG_DEFINE_TEXT:
        case TAG_DEFINE_TEXT_2:
          var id = data.readUint16LE();
          var bounds = data.readSWFRect();
          var matrix = data.readSWFMatrix();
          var baseX = matrix.e, baseY = matrix.f;
          var glyphBits = data.readUint8();
          var advanceBits = data.readUint8();
          if (glyphBits > 32 || advanceBits > 32) {
            throw new Error('glyph/advance data out of 32-bit range');
          }
          var containerSVG = new MakeshiftXML('svg', {
            viewBox: bounds.toString(),
            width: bounds.width,
            height: bounds.height,
            id: 'text'+id,
          });
          var textSVG = containerSVG.open('text');
          var NO_ALPHA = (typeCode < TAG_DEFINE_TEXT_2);
          var b;
          var attr = {'xml:space':'preserve', fill:'#000', y:baseY};
          var nextX = baseX;
          while (b = data.readUint8()) {
            if (b & 0x80) {
              var hasX = b & 1;
              var hasY = b & 2;
              var hasColor = b & 4;
              if (b & 8) {
                var font = fonts[data.readUint16LE()];
                if (!font.definedFamily) {
                  font.file = buildFont(font);
                  nextUpdates.push(['font', 'font'+id, URL.createObjectURL(font.file)]);
                  font.definedFamily = 'font'+id;
                }
                attr['font-family'] = '"' + font.definedFamily + '"';
              }
              if (b & 4) {
                var color = data.readSWFColor(NO_ALPHA);
                attr.fill = color.solidColor;
                if (color.opacity === 1) {
                  delete attr.opacity;
                }
                else {
                  attr.opacity = color.opacity;
                }
              }
              if (b & 1) {
                nextX = baseX + data.readInt16LE();
              }
              if (b & 2) {
                attr.y = baseY + data.readInt16LE();
              }
              if (b & 8) {
                attr['font-size'] = data.readUint16LE();
              }
              continue;
            }
            var xList = [], chars = [];
            for (var i_glyph = 0; i_glyph < b; i_glyph++) {
              chars.push(font.glyphs[data.readTopBits(glyphBits, false)].char);
              xList.push(nextX);
              nextX += data.readTopBits(advanceBits, true);
            }
            data.flushBits();
            attr.x = xList.join(' ');
            textSVG.open('tspan', Object.assign({}, attr)).text(chars.join(''));
          }
          nextUpdates.push(['def', containerSVG.toString()]);
          displayObjects[id] = '#text' + id;
          break;
        case TAG_DEFINE_BUTTON:
          var id = data.readUint16LE();
          var def = ['btn', 'button' + id];
          for (;;) {
            var flags = data.readUint8();
            if (flags === 0) break;
            var characterID = data.readUint16LE();
            var depth = data.readUint16LE();
            var matrix = data.readSWFMatrix();
            // no color transform until DefineButton2
            var insertion = ['i', depth + characterID/65536, displayObjects[characterID]];
            if (!matrix.isIdentity) insertion.push(['transform', matrix.toString()]);
            var classes = [];
            if (flags & 1) classes.push('up');
            if (flags & 2) classes.push('over');
            if (flags & 4) classes.push('down');
            if (flags & 8) classes.push('hit-test');
            insertion.push(['class', classes.join(' ')]);
            def.push(insertion);
          }
          def.push(['on', ['t', 'overdown', 'overup'], data.readSWFActions()]);
          nextUpdates.push(def);
          displayObjects[id] = '#button' + id;
          break;
        case TAG_DEFINE_BUTTON_2:
          var id = data.readUint16LE();
          var def = ['btn', 'button' + id];
          if (data.readUint8() & 1) {
            def.push(['mode', 'menu']);
          }
          var membersLength = data.readUint16LE();
          if (membersLength !== 0) {
            var membersData = data.readSubarray(membersLength - 2);
            for (;;) {
              var flags = membersData.readUint8();
              if (flags === 0) break;
              var characterID = membersData.readUint16LE();
              var depth = membersData.readUint16LE();
              var matrix = membersData.readSWFMatrix();
              var colorTransform = membersData.readSWFColorTransform();
              var insertion = ['i', depth + characterID/65536, displayObjects[characterID]];
              if (!matrix.isIdentity) insertion.push(['transform', matrix.toString()]);
              if (!colorTransform.isIdentity) insertion.push(['colorTransform', colorTransform.toString()]);
              var classes = [];
              if (flags & 1) classes.push('up');
              if (flags & 2) classes.push('over');
              if (flags & 4) classes.push('down');
              if (flags & 8) classes.push('hit-test');
              insertion.push(['class', classes.join(' ')]);
              def.push(insertion);
            }
          }
          for (;;) {
            var actionLen = data.readUint16LE();
            if (actionLen === 0) break;
            var actsrc = data.readSubarray(actionLen - 2);
            var key = actsrc.readTopBits(7);
            switch (key) {
              // KeyboardEvent.key values
              case 0: break;
              case 1: key = 'ArrowLeft'; break;
              case 2: key = 'ArrowRight'; break;
              case 3: key = 'Home'; break;
              case 4: key = 'End'; break;
              case 5: key = 'Insert'; break;
              case 6: key = 'Delete'; break;
              case 8: key = 'Backspace'; break;
              case 13: key = 'Enter'; break;
              case 14: key = 'ArrowUp'; break;
              case 15: key = 'ArrowDown'; break;
              case 16: key = 'PageUp'; break;
              case 17: key = 'PageDown'; break;
              case 18: key = 'Tab'; break;
              case 19: key = 'Escape'; break;
              default: key = String.fromCharCode(key); break;
            }
            var on = ['on'];
            if (key) on.push(['key', key]);
            if (actsrc.readTopBits(1)) on.push(['t', 'overdown', 'idle']);
            if (actsrc.readTopBits(1)) on.push(['t', 'idle', 'overdown']);
            if (actsrc.readTopBits(1)) on.push(['t', 'outdown', 'idle']);
            if (actsrc.readTopBits(1)) on.push(['t', 'outdown', 'overdown']);
            if (actsrc.readTopBits(1)) on.push(['t', 'overdown', 'outdown']);
            if (actsrc.readTopBits(1)) on.push(['t', 'overdown', 'overup']);
            if (actsrc.readTopBits(1)) on.push(['t', 'overup', 'overdown']);
            if (actsrc.readTopBits(1)) on.push(['t', 'overup', 'idle']);
            if (actsrc.readTopBits(1)) on.push(['t', 'idle', 'overup']);
            on.push(actsrc.readSWFActions());
            def.push(on);
          }
          nextUpdates.push(def);
          displayObjects[id] = '#button' + id;
          break;
        case TAG_PLACE_OBJECT:
          var characterID = data.readUint16LE();
          var depth = data.readUint16LE() + characterID/65536;
          var matrix = data.readSWFMatrix();
          var colorTransform = (data.offset === data.length) ? null : data.readSWFColorTransform(true);
          var insertion = ['i', depth, displayObjects[characterID]];
          if (matrix && !matrix.isIdentity) insertion.push(["transform", matrix.toString()]);
          if (colorTransform && !colorTransform.isIdentity) insertion.push(["colorMatrix", colorTransform.toString()]);
          nextFrame.updates.push(insertion);
          for (var i = nextFrame.updates.length-2; i >= 0; i--) {
            if (nextFrame.updates[i][0] === 'd' && nextFrame.updates[i][1] === depth) {
              nextFrame.updates.pop();
              insertion.splice(0, 3, 'm', depth);
              if (!colorTransform || colorTransform.isIdentity) {
                insertion.push(["colorMatrix", "1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"]);
              }
              nextFrame.updates[i] = insertion;
              break;
            }
          }
          break;
        case TAG_PLACE_OBJECT_2:
          var flags = data.readUint8();
          var depth = data.readUint16LE();
          var update = [flags & 1 ? (flags & 2 ? 'r' : 'm') : (flags & 2 ? 'i' : 'd'), depth];
          
          if (flags & 2) {
            update.push(displayObjects[data.readUint16LE()]);
          }
          if (flags & 4) {
            update.push(['transform', data.readSWFMatrix().toString()]);
          }
          if (flags & 8) {
            update.push(['colorTransform', data.readSWFColorTransform().toString()]);
          }
          if (flags & 0x10) {
            var v = data.readUint16LE();
            update.push(['morphRatio', v / 0xffff]);
            update.push(['spriteReplaceCheck', v]);
          }
          if (flags & 0x20) {
            update.push(['name', data.readByteString('\0')]);
          }
          if (flags & 0x40) {
            var clipDepth = data.readUint16LE();
            if (depth in clipAtDepth && clipAtDepth[depth][2] !== clipDepth) {
              nextFrame.updates.push(['d', clipAtDepth[depth]]);
            }
            update[1] = clipAtDepth[depth] = ['clip', depth+1, clipDepth];
          }
          else if (depth in clipAtDepth) {
            update[1] = clipAtDepth[depth];
            if (update[0] === 'd') {
              delete clipAtDepth[depth];
            }
          }
          if (flags & 0x80) {
            data.readUint16LE(); // reserved
            var readEventFlags = (swfVersion >= 6) ? data.readUint32LE.bind(data) : data.readUint16LE.bind(data);
            readEventFlags(); // usedEventFlags
            var eventFlags;
            while (eventFlags = readEventFlags()) {
              var handler = ['on'];
              if (eventFlags & EVT_CONSTRUCT) handler.push('construct');
              if (eventFlags & EVT_KEY_PRESS) handler.push('key_press');
              if (eventFlags & EVT_DRAG_OUT) handler.push('drag_out');
              if (eventFlags & EVT_KEY_PRESS) {
                var key = data.readUint8();
                switch (key) {
                  // KeyboardEvent.key values
                  case 1: key = 'ArrowLeft'; break;
                  case 2: key = 'ArrowRight'; break;
                  case 3: key = 'Home'; break;
                  case 4: key = 'End'; break;
                  case 5: key = 'Insert'; break;
                  case 6: key = 'Delete'; break;
                  case 8: key = 'Backspace'; break;
                  case 13: key = 'Enter'; break;
                  case 14: key = 'ArrowUp'; break;
                  case 15: key = 'ArrowDown'; break;
                  case 16: key = 'PageUp'; break;
                  case 17: key = 'PageDown'; break;
                  case 18: key = 'Tab'; break;
                  case 19: key = 'Escape'; break;
                  default: key = String.fromCharCode(key); break;
                }
                handler.push(['key', key]);
              }
              if (eventFlags & EVT_DRAG_OVER) handler.push('drag_over');
              if (eventFlags & EVT_ROLL_OUT) handler.push('roll_out');
              if (eventFlags & EVT_ROLL_OVER) handler.push('roll_out');
              if (eventFlags & EVT_RELEASE_OUTSIDE) handler.push('release_outside');
              if (eventFlags & EVT_RELEASE) handler.push('release');
              if (eventFlags & EVT_PRESS) handler.push('press');
              if (eventFlags & EVT_INITIALIZE) handler.push('initialize');
              if (eventFlags & EVT_DATA) handler.push('data');
              if (eventFlags & EVT_KEY_UP) handler.push('key_up');
              if (eventFlags & EVT_KEY_DOWN) handler.push('key_down');
              if (eventFlags & EVT_MOUSE_UP) handler.push('mouse_up');
              if (eventFlags & EVT_MOUSE_DOWN) handler.push('mouse_down');
              if (eventFlags & EVT_MOUSE_MOVE) handler.push('mouse_move');
              if (eventFlags & EVT_UNLOAD) handler.push('unload');
              if (eventFlags & EVT_ENTER_FRAME) handler.push('enter_frame');
              if (eventFlags & EVT_ONLOAD) handler.push('onload');
              var actionData = data.readSubarray(data.readUint32LE());
              handler.push(actionData.readSWFActions());
              actionData.warnIfMore();
              update.push(handler);
            }
          }
          data.warnIfMore();
          nextFrame.updates.push(update);
          break;
        case TAG_REMOVE_OBJECT:
          var characterID = data.readUint16LE();
          var depth = data.readUint16LE() + characterID/65536;
          nextFrame.updates.push(['d', depth]);
          break;
        case TAG_REMOVE_OBJECT_2:
          var depth = data.readUint16LE();
          if (depth in clipAtDepth) {
            nextFrame.updates.push(['d', clipAtDepth[depth]]);
            delete clipAtDepth[depth];
          }
          else {
            nextFrame.updates.push(['d', depth]);
          }
          break;
        case TAG_DO_ACTION:
          nextFrame.updates.push(data.readSWFActions());
          break;
        case TAG_SHOW_FRAME:
          showFrame();
          break;
        case TAG_DEFINE_SOUND:
          var id = data.readUint16LE();
          var sound = data.readSWFAudioFormat();
          sound.sampleCount = data.readUint32LE();
          data = data.subarray(data.offset);
          switch (sound.encoding) {
            case 'adpcm':
              sound.url = URL.createObjectURL(data.readADPCMForSWF(sound.sampleCount, sound.hz, sound.channels));
              break;
            case 'mp3':
              sound.sampleSeek = data.readUint16LE();
              sound.url = URL.createObjectURL(new Blob([data.subarray(data.offset)], {type:'audio/mpeg'}));
              break;
            case 'pcm':
              if (sound.bits !== 8) throw new Error('NYI: ' + sound.bits + '-bit PCM for DefineSound');
              var wavBuffer = new ArrayBuffer(4 + 4 + 16);
              var dataSizeSlot = new DataView(wavBuffer, 0, 4);
              var totalSizeSlot = new DataView(wavBuffer, 4, 4);
              var fmt = new DataView(wavBuffer, 8);
              dataSizeSlot.setUint32(0, data.length, true);
              totalSizeSlot.setUint32(0, 36 + data.length, true);
              fmt.setUint16(0, 1, true);
              fmt.setUint16(2, sound.channels, true);
              fmt.setUint32(4, sound.hz, true);
              fmt.setUint32(8, sound.hz * sound.channels * sound.bits/8, true);
              fmt.setUint16(12, sound.channels * sound.bits/8, true);
              fmt.setUint16(14, sound.bits, true);
              var parts = [
                'RIFF', totalSizeSlot, 'WAVE',
                'fmt ', String.fromCharCode(16,0,0,0), fmt,
                'data', dataSizeSlot, data,
              ];
              sound.url = URL.createObjectURL(new Blob(parts, {type:'audio/x-wav'}));
              break;
            default:
              throw new Error('NYI: DefineSound ' + sound.encoding);
          }
          sounds[id] = sound;
          break;
        case TAG_PLAY_SOUND:
          var id = data.readUint16LE();
          var action = data.readSWFAudioAction(sounds[id]);
          data.warnIfMore();
          nextFrame.updates.push(action);
          break;
        case TAG_SET_BACKGROUND_COLOR:
          nextFrame.updates.push(['m', -1, ['background', data.readSWFColor(true)]]);
          break;
        case TAG_DEFINE_SPRITE:
          var id = data.readUint16LE();
          var spriteFrameCount = data.readUint16LE();
          var spriteClipAtDepth = {};
          var def = ['sprite', 'sprite'+id];
          var nextSpriteFrame = new FrameInfo;
          var spriteData = data;
          spriteLoop: while (spriteData.offset < spriteData.length) {
            var tagAndLen = spriteData.readUint16LE();
            var tag = tagAndLen >>> 6;
            var len = tagAndLen & 0x3f;
            if (len === 0x3f) {
              len = spriteData.readUint32LE();
            }
            var data = (len === 0) ? null : spriteData.readSubarray(len);
            switch (tag) {
              case TAG_END: break spriteLoop;
              case TAG_PLACE_OBJECT:
                var characterID = data.readUint16LE();
                var depth = data.readUint16LE() + characterID/65536;
                var matrix = data.readSWFMatrix();
                var colorTransform = (data.offset === data.length) ? null : data.readSWFColorTransform(true);
                var insertion = ['i', depth, displayObjects[characterID]];
                if (matrix && !matrix.isIdentity) insertion.push(["transform", matrix.toString()]);
                if (colorTransform && !colorTransform.isIdentity) insertion.push(["colorMatrix", colorTransform.toString()]);
                nextSpriteFrame.updates.push(insertion);
                for (var i = nextSpriteFrame.updates.length-2; i >= 0; i--) {
                  if (nextSpriteFrame.updates[i][0] === 'd' && nextSpriteFrame.updates[i][1] === depth) {
                    nextSpriteFrame.updates.pop();
                    insertion.splice(0, 3, 'm', depth);
                    if (!colorTransform || colorTransform.isIdentity) {
                      insertion.push(["colorMatrix", "1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"]);
                    }
                    nextSpriteFrame.updates[i] = insertion;
                    break;
                  }
                }
                continue spriteLoop;
              case TAG_PLACE_OBJECT_2:
                var flags = data.readUint8();
                var depth = data.readUint16LE();
                var update = [flags & 1 ? (flags & 2 ? 'r' : 'm') : (flags & 2 ? 'i' : 'd'), depth];
                if (flags & 2) {
                  update.push(displayObjects[data.readUint16LE()]);
                }
                if (flags & 4) {
                  update.push(['transform', data.readSWFMatrix().toString()]);
                }
                if (flags & 8) {
                  update.push(['colorTransform', data.readSWFColorTransform().toString()]);
                }
                if (flags & 0x10) {
                  var v = data.readUint16LE();
                  update.push(['morphRatio', v / 0xffff]);
                  update.push(['spriteReplaceCheck', v]);
                }
                if (flags & 0x20) {
                  update.push(['name', data.readByteString('\0')]);
                }
                if (flags & 0x40) {
                  var clipDepth = data.readUint16LE();
                  if (depth in spriteClipAtDepth && spriteClipAtDepth[depth][2] !== clipDepth) {
                    nextFrame.updates.push(['d', spriteClipAtDepth[depth]]);
                  }
                  update[1] = spriteClipAtDepth[depth] = ['clip', depth+1, clipDepth];
                }
                else if (depth in spriteClipAtDepth) {
                  update[1] = spriteClipAtDepth[depth];
                  if (update[0] === 'd') {
                    delete spriteClipAtDepth[depth];
                  }
                }
                if (flags & 0x80) {
                  data.readUint16LE(); // reserved
                  var readEventFlags = (swfVersion >= 6) ? data.readUint32LE.bind(data) : data.readUint16LE.bind(data);
                  readEventFlags(); // usedEventFlags
                  var eventFlags;
                  while (eventFlags = readEventFlags()) {
                    var handler = ['on'];
                    if (eventFlags & EVT_CONSTRUCT) handler.push('construct');
                    if (eventFlags & EVT_KEY_PRESS) handler.push('key_press');
                    if (eventFlags & EVT_DRAG_OUT) handler.push('drag_out');
                    if (eventFlags & EVT_KEY_PRESS) {
                      var key = data.readUint8();
                      switch (key) {
                        // KeyboardEvent.key values
                        case 1: key = 'ArrowLeft'; break;
                        case 2: key = 'ArrowRight'; break;
                        case 3: key = 'Home'; break;
                        case 4: key = 'End'; break;
                        case 5: key = 'Insert'; break;
                        case 6: key = 'Delete'; break;
                        case 8: key = 'Backspace'; break;
                        case 13: key = 'Enter'; break;
                        case 14: key = 'ArrowUp'; break;
                        case 15: key = 'ArrowDown'; break;
                        case 16: key = 'PageUp'; break;
                        case 17: key = 'PageDown'; break;
                        case 18: key = 'Tab'; break;
                        case 19: key = 'Escape'; break;
                        default: key = String.fromCharCode(key); break;
                      }
                      handler.push(['key', key]);
                    }
                    if (eventFlags & EVT_DRAG_OVER) handler.push('drag_over');
                    if (eventFlags & EVT_ROLL_OUT) handler.push('roll_out');
                    if (eventFlags & EVT_ROLL_OVER) handler.push('roll_out');
                    if (eventFlags & EVT_RELEASE_OUTSIDE) handler.push('release_outside');
                    if (eventFlags & EVT_RELEASE) handler.push('release');
                    if (eventFlags & EVT_PRESS) handler.push('press');
                    if (eventFlags & EVT_INITIALIZE) handler.push('initialize');
                    if (eventFlags & EVT_DATA) handler.push('data');
                    if (eventFlags & EVT_KEY_UP) handler.push('key_up');
                    if (eventFlags & EVT_KEY_DOWN) handler.push('key_down');
                    if (eventFlags & EVT_MOUSE_UP) handler.push('mouse_up');
                    if (eventFlags & EVT_MOUSE_DOWN) handler.push('mouse_down');
                    if (eventFlags & EVT_MOUSE_MOVE) handler.push('mouse_move');
                    if (eventFlags & EVT_UNLOAD) handler.push('unload');
                    if (eventFlags & EVT_ENTER_FRAME) handler.push('enter_frame');
                    if (eventFlags & EVT_ONLOAD) handler.push('onload');
                    var actionData = data.readSubarray(data.readUint32LE());
                    handler.push(actionData.readSWFActions());
                    actionData.warnIfMore();
                    update.push(handler);
                  }
                }
                data.warnIfMore();
                nextSpriteFrame.updates.push(update);
                continue spriteLoop;
              case TAG_REMOVE_OBJECT:
                var characterID = data.readUint16LE();
                var depth = data.readUint16LE() + characterID/65536;
                nextSpriteFrame.updates.push(['d', depth]);
                continue spriteLoop;
              case TAG_REMOVE_OBJECT_2:
                var depth = data.readUint16LE();
                nextSpriteFrame.updates.push(['d', depth]);
                continue spriteLoop;
              case TAG_SHOW_FRAME:
                def.push(nextSpriteFrame);
                spriteFrameCount--;
                nextSpriteFrame = new FrameInfo;
                continue spriteLoop;
            }
          }
          if (spriteFrameCount === 1) {
            def.push(nextSpriteFrame);
          }
          else if (spriteFrameCount > 0) {
            throw new Error('not enough sprite frames');
          }
          nextUpdates.push(def);
          displayObjects[id] = '#sprite' + id;
          break;
        default:
          //console.log('unhandled tag: ' + typeCode, data);
          break;
      }
      return readChunkHeader();
    }
    input.gotUint8Array(8).then(function(bytes) {
      switch (String.fromCharCode(bytes[0], bytes[1], bytes[2])) {
        case 'CWS': input = input.makeInflateReader(); break;
        case 'FWS': break;
        default: throw new Error('invalid header');
      }
      swfVersion = bytes[3];
      var uncompressedFileSize = new DataView(bytes.buffer, bytes.byteOffset+4, 4).getUint32(0, true);
      var frameBounds, framesPerSecond;
      return input.gotSWFRect().then(function(rect) {
        frameBounds = rect;
        return input.gotUint16LE();
      })
      .then(function(fps) {
        framesPerSecond = fps / 0x100;
        return input.gotUint16LE();
      })
      .then(function(count) {
        frameCount = count;
        self.postMessage(JSON.stringify([['init', {
          v: swfVersion,
          bounds: frameBounds.toString(),
          count: frameCount,
          rate: framesPerSecond,
        }]]));
        return readChunkHeader();
      });
    });
  }

  self.onmessage = function onmessage(e) {
    var message, messages = JSON.parse(e.data);
    for (var i_msg = 0; i_msg < messages.length; i_msg++) {
      switch ((message = messages[i_msg])[0]) {
        case 'open':
          var chunkReader = new ChunkReader;
          chunkReader.fromURL(message[1]);
          readSWF(chunkReader);
          break;
        // case 'import':
        default:
          throw new Error('unknown message: ' + message);
      }
    }
  };

  Object.assign(ChunkReader.prototype, {
    gotSWFRect: function() {
      const reader = this, rect = new SWFRect;
      var coordBits;
      return this.gotTopBits(5).then(function(b) {
        coordBits = b;
        return reader.gotTopBits(coordBits, true);
      })
      .then(function(b) {
        rect.left = b;
        return reader.gotTopBits(coordBits, true);
      })
      .then(function(b) {
        rect.right = b;
        return reader.gotTopBits(coordBits, true);
      })
      .then(function(b) {
        rect.top = b;
        return reader.gotTopBits(coordBits, true);
      })
      .then(function(b) {
        rect.bottom = b;
        reader.flushBits();
        return rect;
      });
    },
  });
  
  Object.assign(Uint8Array.prototype, {
    readSWFMatrix: function() {
      var matrix = new SWFMatrix;
      if (this.readTopBits(1, false)) {
        var scaleBits = this.readTopBits(5, false);
        matrix.a = this.readTopBits(scaleBits, true) / 0x10000;
        matrix.d = this.readTopBits(scaleBits, true) / 0x10000;
      }
      if (this.readTopBits(1, false)) {
        var rotSkewBits = this.readTopBits(5, false);
        matrix.b = this.readTopBits(rotSkewBits, true) / 0x10000;
        matrix.c = this.readTopBits(rotSkewBits, true) / 0x10000;
      }
      var translateBits = this.readTopBits(5, false);
      if (translateBits) {
        matrix.e = this.readTopBits(translateBits, true);
        matrix.f = this.readTopBits(translateBits, true);
      }
      this.flushBits();
      return matrix;
    },
    readSWFRect: function() {
      var coordBits = this.readTopBits(5, false);
      var rect = new SWFRect;
      rect.left = this.readTopBits(coordBits, true);
      rect.right = this.readTopBits(coordBits, true);
      rect.top = this.readTopBits(coordBits, true);
      rect.bottom = this.readTopBits(coordBits, true);
      this.flushBits();
      return rect;
    },
    readSWFColor: function(NO_ALPHA) {
      var o = this.offset;
      var r = this[o], g = this[o+1], b = this[o+2];
      if (NO_ALPHA) {
        this.offset = o+3;
        return new SWFColor(r,g,b,255);
      }
      var a = this[o+3];
      this.offset = o+4;
      return new SWFColor(r,g,b,a);
    },
    readSWFColorTransform: function(NO_ALPHA) {
      var transform = new SWFColorTransform;
      var withAdd = this.readTopBits(1);
      var withMultiply = this.readTopBits(1);
      var valueBits = this.readTopBits(4);
      if (withMultiply) {
        var r = this.readTopBits(valueBits, true) / 0x100;
        var g = this.readTopBits(valueBits, true) / 0x100;
        var b = this.readTopBits(valueBits, true) / 0x100;
        var a = NO_ALPHA ? 1 : this.readTopBits(valueBits, true) / 0x100;
        transform.multiply(r, g, b, a);
      }
      if (withAdd) {
        var r = this.readTopBits(valueBits, true);
        var g = this.readTopBits(valueBits, true);
        var b = this.readTopBits(valueBits, true);
        var a = NO_ALPHA ? 0 : this.readTopBits(valueBits, true);
        transform.add(r, g, b, a);
      }
      this.flushBits();
      return transform;
    },
    readSWFAction: function() {
      var code = this.readUint8();
      var data = code & 0x80 ? this.readSubarray(this.readUint16LE()) : null;
      switch (code) {
        case 0x00: return 'End';
        case 0x81: return ['GotoFrame', data.readUint16LE()];
        case 0x83:
          var url = data.readByteString('\0');
          var target = data.readByteString('\0');
          return ['GetURL', url, target];
        case 0x04: return 'NextFrame'; break;
        case 0x05: return 'PreviousFrame'; break;
        case 0x06: return 'Play'; break;
        case 0x07: return 'Stop'; break;
        case 0x08: return 'ToggleQuality'; break;
        case 0x09: return 'StopSounds'; break;
        case 0x8A:
          var ifFrameNotReady = data.readUint16LE();
          var thenSkipActions = data.readUint8();
          var action = ['WaitForFrame', ifFrameNotReady];
          while (thenSkipActions-- > 0) {
            action.push(this.readSWFAction());
          }
          return action;
        case 0x8B: return ['SetTarget', data.readByteString('\0')];
        case 0x8C: return ['GotoLabel', data.readByteString('\0')];
        case 0x0A: return 'Add';
        case 0x0B: return 'Subtract';
        case 0x0C: return 'Multiply';
        case 0x0D: return 'Divide';
        case 0x8D:
          var thenSkipActions = data.readUint8();
          var action = ['WaitForFrame2'];
          while (thenSkipActions-- > 0) {
            action.push(this.readSWFAction());
          }
          return action;
        case 0x0E: return 'Equals';
        case 0x0F: return 'Less';
        case 0x10: return 'And';
        case 0x11: return 'Or';
        case 0x12: return 'Not';
        case 0x13: return 'StringEquals';
        case 0x14: return 'StringLength';
        case 0x15: return 'StringExtract';
        case 0x96:
          if (data.readUint8() === 0) {
            return ['Push', data.readByteString('\0')];
          }
          return ['Push', data.readFloat32LE()];
        case 0x17: return 'Pop';
        case 0x18: return 'ToInteger';
        case 0x1C: return 'GetVariable';
        case 0x1D: return 'SetVariable';
        case 0x20: return 'SetTarget2';
        case 0x21: return 'StringAdd';
        case 0x22: return 'GetProperty';
        case 0x23: return 'SetProperty';
        case 0x24: return 'CloneSprite';
        case 0x25: return 'RemoveSprite';
        case 0x26: return 'Trace';
        case 0x27: return 'StartDrag';
        case 0x28: return 'EndDrag';
        case 0x29: return 'StringLess';
        case 0x30: return 'RandomNumber';
        case 0x31: return 'MBStringLength';
        case 0x32: return 'CharToAscii';
        case 0x33: return 'AsciiToChar';
        case 0x34: return 'GetTime';
        case 0x35: return 'MBStringExtract';
        case 0x36: return 'MBCharToAscii';
        case 0x37: return 'MBAsciiToChar';
        case 0x99: return ['Jump', data.readInt16LE()];
        case 0x9A:
          switch (data[0]) {
            case 0: return ['GetURL2'];
            case 1: return ['GetURL2', 'send_vars=url_params'];
            case 2: return ['GetURL2', 'send_vars=post_data'];
            default:
              console.warn('unknown GetURL2 mode: ' + data[0]);
              return ['GetURL2'];
          }
        case 0x9D: return ['If', data.readInt16LE()];
        case 0x9E: return ['Call'];
        case 0x9F:
          if (data.readUint8()) {
            return ['GotoFrame2', 'and_play=true'];
          }
          else {
            return ['GotoFrame2'];
          }
          break;
      }
    },
    readSWFActions: function() {
      var actions = ['do'];
      var action;
      while ((action = this.readSWFAction()) !== 'End') {
        actions.push(action);
      }
      return actions;
    },
    readSWFAudioFormat: function() {
      var format = {};
      var formatCode = this.readTopBits(4);
      format.hz = 5512.5 * (1 << this.readTopBits(2));
      format.bits = this.readTopBits(1) ? 16 : 8;
      format.channels = this.readTopBits(1) ? 2 : 1;
      switch (formatCode) {
        case 0:
          format.encoding = 'pcm';
          if (format.bits !== 8) {
            format.endianness = 'native';
          }
          break;
        case 1: format.encoding = 'adpcm'; break;
        case 2: format.encoding = 'mp3'; break;
        case 3:
          format.encoding = 'pcm';
          if (format.bits !== 8) {
            format.endianness = 'little';
          }
          break;
        case 6: format.encoding = 'asao'; break;
        default: throw new Error('unknown sound format');
      }
      return format;
    },
    readSWFAudioAction: function(sound) {
      var flags = this.readUint8();
      var action = [flags & 0x20 ? 'stop' : flags & 0x10 ? 'play-exclusive' : 'play', sound.url];
      if (flags & 1) {
        action.push(['from', this.readUint32LE() / sound.hz]);
      }
      if (flags & 2) {
        action.push(['to', this.readUint32LE() / sound.hz]);
      }
      if (flags & 4) {
        action.push(['loop', this.readUint16LE()]);
      }
      if (flags & 8) {
        var envelope = ['envelope'];
        var count = this.readUint8();
        while (count-- > 0) {
          var at = this.readUint32LE() / 44100;
          var leftVolume = this.readUint16LE() / 32768;
          var rightVolume = this.readUint16LE() / 32768;
          envelope.push(['at', at, leftVolume, rightVolume]);
        }
        action.push(envelope);
      }
      return action;
    },
  });
  
  const ADPCM_INDEX_TABLES = [
    null, null,
    new Int8Array([-1,2, -1,2]),
    new Int8Array([-1,-1,2,4, -1,-1,2,4]),
    new Int8Array([
      -1,-1,-1,-1, 2,4,6,8,
      -1,-1,-1,-1, 2,4,6,8,
    ]),
    new Int8Array([
      -1,-1,-1,-1,-1,-1,-1,-1, 1,2,4,6,8,10,13,16,
      -1,-1,-1,-1,-1,-1,-1,-1, 1,2,4,6,8,10,13,16,
    ]),
  ];
  const ADPCM_STEP_SIZE = new Uint16Array([
    7, 8, 9, 10, 11, 12, 13, 14, 16, 17,
    19, 21, 23, 25, 28, 31, 34, 37, 41, 45,
    50, 55, 60, 66, 73, 80, 88, 97, 107, 118,
    130, 143, 157, 173, 190, 209, 230, 253, 279, 307,
    337, 371, 408, 449, 494, 544, 598, 658, 724, 796,
    876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066,
    2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358,
    5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
    15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767,
  ]);
  
  Uint8Array.prototype.readADPCMForSWF = function(sampleCount, sampleRate, channels) {
    var wavBuffer = new ArrayBuffer(4 + 4 + 16 + sampleCount*channels*2);
    var dataSizeSlot = new DataView(wavBuffer, 0, 4);
    var totalSizeSlot = new DataView(wavBuffer, 4, 4);
    var fmt = new DataView(wavBuffer, 8, 16);
    var data = new DataView(wavBuffer, 24);
    dataSizeSlot.setUint32(0, sampleCount*channels*2, true);
    totalSizeSlot.setUint32(0, 36 + sampleCount*channels*2, true);
    fmt.setUint16(0, 1, true);
    fmt.setUint16(2, channels, true);
    fmt.setUint32(4, sampleRate, true);
    fmt.setUint32(8, sampleRate * channels * 2, true);
    fmt.setUint16(12, channels * 2, true);
    fmt.setUint16(14, 16, true);
    var parts = [
      'RIFF', totalSizeSlot, 'WAVE',
      'fmt ', String.fromCharCode(16,0,0,0), fmt,
      'data', dataSizeSlot, data,
    ];
    var wpos = 0;
    while (sampleCount > 0) {
      const codeSize = 2 + this.readTopBits(2);
      const indexTable = ADPCM_INDEX_TABLES[codeSize];
      if (channels === 2) {
        var leftSample = this.readTopBits(16, true);
        var leftStepIndex = this.readTopBits(6);
        var rightSample = this.readTopBits(16, true);
        var rightStepIndex = this.readTopBits(6);
        data.setInt16(wpos, leftSample, true);
        data.setInt16(wpos + 2, rightSample, true);
        wpos += 4;
        var stepIndex = this.readTopBits(6);
        var step = ADPCM_STEP_SIZE[stepIndex];
        const stopAt = Math.max(0, sampleCount - 4097);
        while (--sampleCount > stopAt) {
          var leftDelta = this.readTopBits(codeSize);
          var rightDelta = this.readTopBits(codeSize);
          var leftStep = ADPCM_STEP_SIZE[leftStepIndex];
          var rightStep = ADPCM_STEP_SIZE[rightStepIndex];
          var leftDiff = leftStep >> (codeSize-1);
          for (var c_i = codeSize-2; c_i >= 0; c_i--) {
            if (leftDelta & (1 << c_i)) leftDiff += step >> (codeSize-c_i-2);
          }
          if (leftDelta & (1 << (codeSize-1))) leftDiff = -leftDiff;
          var rightDiff = step >> (codeSize-1);
          for (var c_i = codeSize-2; c_i >= 0; c_i--) {
            if (rightDelta & (1 << c_i)) rightDiff += step >> (codeSize-c_i-2);
          }
          if (rightDelta & (1 << (codeSize-1))) rightDiff = -rightDiff;
          leftSample = Math.min(0x7fff, Math.max(-0x8000, leftSample + leftDiff));
          rightSample = Math.min(0x7fff, Math.max(-0x8000, rightSample + rightDiff));
          data.setInt16(wpos, leftSample, true);
          data.setInt16(wpos + 2, rightSample, true);
          wpos += 4;
          leftStepIndex = Math.min(88, Math.max(0, leftStepIndex + indexTable[leftDelta]));
          rightStepIndex = Math.min(88, Math.max(0, rightStepIndex + indexTable[rightDelta]));
        }
      }
      else {
        var sample = this.readTopBits(16, true);
        data.setInt16(wpos, sample, true);
        wpos += 2;
        var stepIndex = this.readTopBits(6);
        var step = ADPCM_STEP_SIZE[stepIndex];
        const stopAt = Math.max(0, sampleCount - 4097);
        while (--sampleCount > stopAt) {
          var delta = this.readTopBits(codeSize);
          stepIndex = Math.min(88, Math.max(0, stepIndex + indexTable[delta]));
          var diff = step >> (codeSize-1);
          for (var c_i = codeSize-2; c_i >= 0; c_i--) {
            if (delta & (1 << c_i)) diff += step >> (codeSize-c_i-2);
          }
          if (delta & (1 << (codeSize-1))) diff = -diff;
          sample = Math.min(0x7fff, Math.max(-0x8000, sample + diff));
          data.setInt16(wpos, sample, true);
          wpos += 2;
          step = ADPCM_STEP_SIZE[stepIndex];
        }
      }
    }
    return new Blob(parts, {type:'audio/x-wav'});
  };
  
  function SWFMatrix() {
  }
  SWFMatrix.prototype = {
    a:1, b: 0, c:0, d:1, e:0, f:0,
    toString: function() {
      if (this.b === 0 && this.c === 0) {
        // no rotation/skew
        var scale;
        if (this.a === this.d) {
          if (this.a !== 1) scale = 'scale(' + this.a + ')';
        }
        else {
          scale = 'scale(' + this.a + ', ' + this.d + ')';
        }
        if (this.e === 0 && this.f === 0) {
          if (scale) return scale;
        }
        var translate = 'translate(' + this.e + 'px, ' + this.f + 'px)';
        return scale ? translate+' '+scale : translate;
      }
      return 'matrix(' + [
        this.a, this.b,
        this.c, this.d,
        this.e, this.f].join(', ') + ')';
    },
    get isIdentity() {
      return this.a === 1 && this.b === 0 && this.c === 0
          && this.d === 1 && this.e === 0 && this.f === 0;
    },
    isEqualTo: function(m) {
      if (this === m) return true;
      return this.a === m.a && this.b === m.b && this.c === m.c
          && this.d === m.d && this.e === m.e && this.f === m.f;
    },
  };
  
  function SWFColor(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  SWFColor.prototype = {
    r: 0,
    g: 0,
    b: 0,
    a: 255,
    type: 'color',
    toString: function() {
      return this.cssColor;
    },
    toJSON: function() {
      return this.cssColor;
    },
    get solidColor() {
      var r = this.r, g = this.g, b = this.b;
      if ((r>>4)==(r&15)&&(g>>4)==(g&15)&&(b>>4)==(b&15)) {
        return '#'
          + (r&15).toString(16)
          + (g&15).toString(16)
          + (b&15).toString(16);
      }
      var rgb = (r << 16) | (g << 8) | b;
      return '#' + ('0000000' + rgb.toString(16)).slice(-6);
    },
    get opacity() {
      return this.a/255;
    },
    get cssColor() {
      if (this.a !== 255) {
        if (this.a === 0 && this.r === 0 && this.g === 0 && this.b === 0) {
          return 'transparent';
        }
        return ('rgba('
          + this.r + ',' + this.g + ',' + this.b
          + ', ' + percentFromByte(this.a)
          + ')');
      }
      return this.solidColor;
    },
    isEqualTo: function(c) {
      if (this === c) return true;
      return this.r === c.r && this.g === c.g && this.b === c.b && this.a === c.a;
    },
  };
  
  function SWFColorTransform() {
  }
  SWFColorTransform.prototype = {
    mulR: 1, mulG: 1, mulB: 1, mulA: 1,
    addR: 0, addG: 0, addB: 0, addA: 0,
    multiply: function(r, g, b, a) {
      this.mulR = r;
      this.mulG = g;
      this.mulB = b;
      this.mulA = a;
    },
    add: function(r, g, b, a) {
      this.addR = r;
      this.addG = g;
      this.addB = b;
      this.addA = a;
    },
    get isIdentity() {
      return !(this.addR || this.addG || this.addB || this.addA)
        && this.mulR === 1
        && this.mulG === 1
        && this.mulB === 1
        && this.mulA === 1;
    },
    toString: function() {
      // feColorMatrix format
      return [
          this.mulR, 0, 0, 0, this.addR / 255,
          0, this.mulG, 0, 0, this.addG / 255,
          0, 0, this.mulB, 0, this.addB / 255,
          0, 0, 0, this.mulA, this.addA / 255,
        ].join(' ');
    },
    isEqualTo: function(ct) {
      if (ct === this) return true;
      return this.addR === ct.addR && this.addG === ct.addG && this.addB === ct.addB && this.addA === ct.addA
          && this.mulR === ct.mulR && this.mulG === ct.mulG && this.mulB === ct.mulB && this.mulA === ct.mulA;
    },
  };
  
  function FrameInfo() {
    this.updates = [];
  }
  FrameInfo.prototype = {
    count: 1,
    toJSON: function() {
      var json = ['f'];
      if (this.count !== 1) {
        json.push(this.count);
      }
      return json.concat(this.updates);
    },
  };
  
  function buildFont(font) {
    var strings = [];
    strings.push({platformId:0, encodingId:0, languageId:0, nameId:1, text:'Anon'});
    if (font.bold) {
      if (font.italic) {
        strings.push({platformId:0, encodingId:0, languageId:0, nameId:2, text:'Bold Italic'});
      }
      else {
        strings.push({platformId:0, encodingId:0, languageId:0, nameId:2, text:'Bold'});
      }
    }
    else if (font.italic) {
      strings.push({platformId:0, encodingId:0, languageId:0, nameId:2, text:'Italic'});
    }
    else {
      strings.push({platformId:0, encodingId:0, languageId:0, nameId:2, text:'Regular'});
    }
    var info = {
      flags: (
        1 /* y value of 0 specifies baseline */
        // | 8 /* integer math */
      ),
      unitsPerEm: 1024,
      xMin: 0, yMin: 0,
      xMax: 1024, yMax: 1024,
      macStyle: (font.bold?1:0) | (font.italic?2:0),
      smallestReadablePixelSize: 1, // not sure
      longOffsets: false,

      ascender: 1024,
      descender: 0,
      lineGap: 0,
      advanceWidthMax: 1024,
      minLeftSideBearing: 0,
      minRightSideBearing: 0,
      xMaxExtent: 1024,
      caretSlopeRise: 1,
      caretSlopeRun: 0,
      caretOffset: 0,

      glyphs: new Array(font.glyphs.length),

      strings: strings,

      xAvgCharWidth: 1024,
      usWeightClass: font.bold ? 700 : 500,
      usWidthClass: 5,
      fsType: 0,
      ySubscriptXSize: 512,
      ySubscriptYSize: 512,
      ySubscriptXOffset: 0,
      ySubscriptYOffset: 0,
      ySuperscriptXSize: 512,
      ySuperscriptYSize: 512,
      ySuperscriptXOffset: 0,
      ySuperscriptYOffset: 512,
      yStrikeoutSize: 64,
      yStrikeoutPosition: 256,
      sFamilyClass: 0,
      // all PANOSE set to 0
      ulUnicodeRange1: 3, // 0x00-0xFF
      ulUnicodeRange2: 0,
      ulUnicodeRange3: 0,
      ulUnicodeRange4: 0,
      vendor4CC: 'wotw',
      fsSelection: (font.italic?1:0) | (font.bold?1<<5:0),
      usFirstCharIndex: 0x20,
      usLastCharIndex: 0xFFFF,
      sTypoAscender: 1024,
      sTypoDescender: 0,
      sTypoLineGap: 0,
      usWinAscent: 1024,
      usWinDescent: 0,
      ulCodePageRange1: 1, // Latin-1
      ulCodePageRange2: 0,
      sxHeight: 0,
      sCapHeight: 0,
      usDefaultChar: 0,
      usBreakChar: 0x20,
      usMaxContext: 1,
      usLowerOpticalPointSize: 1,
      usUpperOpticalPointSize: 0xFFFF,

      underlinePosition: 0,
      underlineThickness: 16,
      isMonospace: 1,
    };
    for (var i_glyph = 0; i_glyph < font.glyphs.length; i_glyph++) {
      var glyph = font.glyphs[i_glyph];
      glyph.char = glyph.char || String.fromCodePoint(33 + i_glyph);
      info.glyphs[i_glyph] = {
        char: glyph.char,
        charString: glyph.shape.toCompactFontFormat(),
        advanceWidth: 1024,
        leftSideBearing: 0,
      };
    }
    info.glyphs.splice(0, 0, {
      char: '\0',
      charString: [],
      advanceWidth: 1024,
      leftSideBearing: 0,
    });
    return OTFTable.joinToFile([
      new OTFTable.CharacterGlyphMap(info),
      new OTFTable.FontHeader(info),
      new OTFTable.HorizontalHeader(info),
      new OTFTable.HorizontalMetrics(info),
      new OTFTable.MaximumProfile(info),
      new OTFTable.Naming(info),
      new OTFTable.MetricsForOS2(info),
      new OTFTable.PostScript(info),
      new OTFTable.CompactFontFormat(info),
    ], 'font.otf');
  }
  
  self.postMessage('[["ready"]]');
  
});
