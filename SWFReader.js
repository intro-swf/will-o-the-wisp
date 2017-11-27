define(['dataExtensions!', 'z!'], function(dataExtensions, zlib) {

  'use strict';
  
  const NULLFUNC = function(){};
  
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
  
  function SWFReader(init) {
    if (init) Object.assign(this, init);
  }
  SWFReader.prototype = {
    // .version <int>
    // .compressed <boolean>
    // .frameBounds <SWFRect>
    // .framesPerSecond <float>
    // .frameCount <int>
    // .uncompressedFileSize <int>
    onopenmovie: NULLFUNC,
    
    // .useNetwork <bool>
    // .useSWFRelativeURLs <bool>
    // .suppressCrossDomainCaching <bool>
    // .allowABC <bool>
    // .hasMetadata <bool>
    onfileattributes: NULLFUNC,
    
    // return value is Promise result
    onclosemovie: NULLFUNC,
    
    // .frameNumber <int>
    onopenframe: NULLFUNC,
    oncloseframe: NULLFUNC,
    
    // .stream
    // .playback
    onopenstream: NULLFUNC,
    onclosestream: NULLFUNC,
    
    // .spriteID <int>
    // .spriteFrameCount <int>
    onopensprite: NULLFUNC,
    onclosesprite: NULLFUNC,
    
    // .spriteFrameNumber <int>
    onopenspriteframe: NULLFUNC,
    onclosespriteframe: NULLFUNC,
    
    // .spriteStream
    // .spritePlayback
    onopenspritestream: NULLFUNC,
    onclosespritestream: NULLFUNC,
    
    // ondefine(id <int>, type <string>, def <Object>)
    ondefine: NULLFUNC,
    // onupdate(id <int>, def <Object>)
    onupdate: NULLFUNC,
    
    // ondisplaylistaction(depth <int>, 'insert', settings <Object>)
    // ondisplaylistaction(depth <int>, 'update', settings <Object>)
    // ondisplaylistaction(depth <int>, 'replace', settings <Object>)
    // ondisplaylistaction(depth <int>, 'remove')
    ondisplaylistaction: NULLFUNC,
    
    // onjpegtables(file <Blob:image/jpeg; encoding-tables=only>)
    onjpegtables: NULLFUNC,
    // onbackgroundcolor(color)
    onbackgroundcolor: NULLFUNC,
    // onaction(bytecode <Uint8Array>)
    onaction: NULLFUNC,
    // onaudioaction(soundaction <Object>)
    onaudioaction: NULLFUNC,
    // onstream(data <Uint8Array [, extra <Object>] )
    onstream: NULLFUNC,
    // .passwordMD5 <string> [optional]
    onprotect: NULLFUNC,
    // onframelabel(label <string>)
    onframelabel: NULLFUNC,
    
    // onunhandledtag(tag <int>, data <Uint8Array>)
    onunhandledtag: NULLFUNC,
    
    // onexport(id <int>, name <string>)
    onexport: NULLFUNC,
    
    // .debugID <Uint8Array>
    ondebugid: NULLFUNC,
    
    read: function(source) {
      // TODO: support Blob/URL sources?
      if (!(source instanceof Uint8Array)) {
        throw new TypeError('source must be byte array');
      }
      try {
        this.onrawfilesignature(source);
        if (this.isCompressed) {
          var uncompressedLength = this.uncompressedFileSize - source.offset;
          source = zlib.inflate(
            source.subarray(source.offset),
            uncompressedLength);
          if (source.length !== uncompressedLength) {
            throw new Error('decompression size mismatch');
          }
        }
        this.onrawfileheader(source);
        this.onopenmovie();
        for (var i = 0; i < this.frameCount; i++) {
          this.frameNumber = i;
          this.onopenframe();
          var chunkType;
          frameLoop: for (;;) switch (chunkType = this.onrawtag(source)) {
            case TAG_END:
              throw new Error('not enough frames (expected '+this.frameCount+', found '+i+')');
            case TAG_SHOW_FRAME:
              this.onrawchunk(chunkType, source.readSubarray(this.chunkLength));
              break frameLoop;
            case TAG_SOUND_STREAM_HEAD:
            case TAG_SOUND_STREAM_HEAD_2:
              if (this.stream) this.onclosestream();
              var streamSource = source.readSubarray(this.chunkLength);
              this.stream = streamSource.readSWFStreamHead();
              streamSource.warnIfMore();
              this.onopenstream();
              continue frameLoop;
            case TAG_SOUND_STREAM_BLOCK:
              this.onrawstreamchunk(source.readSubarray(this.chunkLength), this.stream);
              continue frameLoop;
            default:
              this.onrawchunk(chunkType, source.readSubarray(this.chunkLength));
              continue frameLoop;
          }
          this.oncloseframe();
        }
        endLoop: for (;;) switch (this.onrawtag(source)) {
          case TAG_END:
            this.onrawchunk(TAG_END, source.readSubarray(this.chunkLength));
            break endLoop;
          default:
            throw new Error('unexpected data after final frame');
        }
        if (this.stream) {
          this.onclosestream();
        }
        var result = this.onclosemovie();
        return Promise.resolve(result);
      }
      catch (e) {
        return Promise.reject(e.message);
      }
    },
    
    onrawfilesignature: function(source) {
      switch (source.readByteString(3)) {
        case 'FWS': this.isCompressed = false; break;
        case 'CWS': this.isCompressed = true; break;
        default: throw new Error('invalid file header');
      }
      this.version = source.readUint8();
      this.uncompressedFileSize = source.readUint32LE();
    },
    onrawfileheader: function(source) {
      this.frameBounds = source.readSWFRect();
      this.framesPerSecond = source.readUint16LE() / 0x100;
      this.frameCount = source.readUint16LE();
    },
    onrawtag: function(source) {
      var shortHeader = source.readUint16LE();
      var chunkType = shortHeader >>> 6;
      var chunkLength = shortHeader & 0x3F;
      if (chunkLength === 0x3F) {
        chunkLength = source.readUint32LE();
      }
      this.chunkType = chunkType;
      this.chunkLength = chunkLength;
      return chunkType;
    },
    onrawchunk: function(chunkType, source) {
      switch (chunkType) {
        case TAG_SHOW_FRAME:
        case TAG_END:
          source.warnIfMore();
          break;
        case TAG_FILE_ATTRIBUTES:
          var byte = source.readUint8();
          if (byte & 1) this.useNetwork = true;
          if (byte & 2) this.useSWFRelativeURLs = true;
          if (byte & 4) this.suppressCrossDomainCaching = true;
          if (byte & 8) this.allowABC = true;
          if (byte & 0x10) this.hasMetadata = true;
          this.onfileattributes();
          break;
        case TAG_DEFINE_SHAPE:
        case TAG_DEFINE_SHAPE_2:
        case TAG_DEFINE_SHAPE_3:
        case TAG_DEFINE_SHAPE_4:
          var id = source.readUint16LE();
          var shape = {};
          shape.bounds = source.readSWFRect();
          var EXTENDED_LENGTH = chunkType >= TAG_DEFINE_SHAPE_2;
          var NO_ALPHA = chunkType < TAG_DEFINE_SHAPE_3;
          var EXTENDED_STROKE = chunkType >= TAG_DEFINE_SHAPE_4;
          if (EXTENDED_STROKE) {
            shape.fillBounds = source.readSWFRect();
            var flags = source.readUint8();
            if (flags & 1) shape.hasNonScalingStrokes = true;
            if (flags & 2) shape.hasScalingStrokes = true;
            if (flags & 4) shape.useFillWindingRule = true;
          }
          var fillStyles = source.readSWFFillStyles(EXTENDED_LENGTH, NO_ALPHA);
          var strokeStyles = source.readSWFStrokeStyles(EXTENDED_LENGTH, NO_ALPHA, false, EXTENDED_STROKE);
          shape.path = source.readSWFPath(EXTENDED_LENGTH, NO_ALPHA, EXTENDED_STROKE);
          shape.path.initialStyles(fillStyles, strokeStyles);
          source.warnIfMore();
          this.ondefine(id, 'shape', shape);
          break;
        case TAG_DEFINE_MORPH_SHAPE:
          var id = source.readUint16LE();
          var fromShape = {};
          var toShape = {};
          fromShape.bounds = source.readSWFRect();
          toShape.bounds = source.readSWFRect();
          var endPathOffset = source.offset + source.readUint32LE();
          if (endPathOffset === source.offset) {
            endPathOffset = source.length;
          }
          var fillStylePairs = source.readSWFFillStyles(true, false, true);
          var fromFillStyles = [], toFillStyles = [];
          for (var i = 0; i < fillStylePairs.length; i++) {
            fromFillStyles.push(fillStylePairs[i][0]);
            toFillStyles.push(fillStylePairs[i][1]);
          }
          var strokeStylePairs = source.readSWFStrokeStyles(true, false, true);
          var fromStrokeStyles = [], toStrokeStyles = [];
          for (var i = 0; i < strokeStylePairs.length; i++) {
            fromStrokeStyles.push(strokeStylePairs[i][0]);
            toStrokeStyles.push(strokeStylePairs[i][1]);
          }
          fromShape.path = source.readSWFPath(true, false);
          fromShape.path.initialStyles(fromFillStyles, fromStrokeStyles);
          toShape.path = source.readSWFPath(true, false);
          toShape.path.initialStyles(toFillStyles, toStrokeStyles);
          this.ondefine(id, 'morph', fromShape, toShape);
          break;
        case TAG_DEFINE_BITS:
          var id = source.readUint16LE();
          var file = new Blob([source.subarray(source.offset)], {type:'image/jpeg; encoding-tables=no'});
          this.ondefine(id, 'bitmap', file);
          break;
        case TAG_DEFINE_BITS_2:
        case TAG_DEFINE_BITS_3:
        case TAG_DEFINE_BITS_4:
          var id = source.readUint16LE();
          var preAlphaLength = (chunkType >= TAG_DEFINE_BITS_3) ? source.readUint32LE() : -1;
          var deblockingFilterParameter = (chunkType >= TAG_DEFINE_BITS_4) ? source.readUint16LE() / 0x100 : null;
          if (preAlphaLength === -1) preAlphaLength = source.length - source.offset;
          var preAlpha = source.readSubarray(preAlphaLength);
          var pos = 0, parts;
          while (pos < preAlpha.length) {
            if (preAlpha[pos] === 0xFF && preAlpha[pos+1] === 0xD9
                && preAlpha[pos+2] === 0xFF && preAlpha[pos+3] === 0xD8) {
              parts = [preAlpha.subarray(0, pos), preAlpha.subarray(pos + 4)];
              break;
            }
            pos++;
          }
          parts = parts || [preAlpha];
          var file = new Blob(parts, {type:'image/jpeg'});
          if (source.offset !== source.length) {
            // TODO: get width and height from the data, create a PNG for the mask
            file.alphaMask = zlib.inflate(source.subarray(source.offset));
          }
          this.ondefine(id, 'bitmap', file);
          break;
        case TAG_DEFINE_BITS_LOSSLESS:
          var id = source.readUint16LE();
          var format = source.readUint8();
          var width = source.readUint16LE();
          var height = source.readUint16LE();
          var paletteSize = (format === 3) ? source.readUint8() + 1 : 0;
          var compressed = source.subarray(source.offset);
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
              bitmapFile = makeImageBlob(8, rows, palette);
              break;
            default:
              throw new Error('NYI: lossless mode ' + format);
          }
          this.ondefine(id, 'bitmap', bitmapFile);
          break;
        case TAG_DEFINE_BITS_LOSSLESS_2:
          var id = source.readUint16LE();
          var format = source.readUint8();
          var width = source.readUint16LE();
          var height = source.readUint16LE();
          var paletteSize = (format === 3) ? source.readUint8() + 1 : 0;
          var compressed = source.subarray(source.offset);
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
              bitmapFile = makeAlphaBitmapBlob(8, rows, palette);
              break;
            default:
              throw new Error('NYI: lossless mode ' + format);
          }
          this.ondefine(id, 'bitmap', bitmapFile);
          break;
        case TAG_JPEG_TABLES:
          var file = new Blob([source], {type:'image/jpeg; encoding-tables=only'});
          this.onjpegtables(file);
          break;
        case TAG_SET_BACKGROUND_COLOR:
          var color = source.readSWFColor(true);
          source.warnIfMore();
          this.onbackgroundcolor(color);
          break;
        case TAG_DEFINE_FONT:
          var id = source.readUint16LE();
          var dv = new DataView(source.buffer, source.byteOffset, source.byteLength);
          var glyphs = new Array(dv.getUint16(2, true) / 2);
          for (var i_glyph = 0; i_glyph < glyphs.length; i_glyph++) {
            source.offset = 2 + dv.getUint16(2 + i_glyph*2, true);
            glyphs[i_glyph] = {path: source.readSWFPath()};
          }
          this.ondefine(id, 'font', {glyphs:glyphs});
          break;
        case TAG_DEFINE_FONT_INFO:
        case TAG_DEFINE_FONT_INFO_2:
          var id = source.readUint16LE();
          var font = {};
          var nameLen = source.readUint8();
          font.name = source.readByteString(nameLen);
          var flags = source.readUint8();
          var has16BitChars = !!(flags & 1);
          font.bold = !!(flags & 2);
          font.italic = !!(flags & 4);
          font.ansi = !!(flags & 8);
          font.shiftJIS = !!(flags & 0x10);
          if (chunkType >= TAG_DEFINE_FONT_INFO_2) {
            font.languageCode = source.readUint8();
          }
          var glyphs = font.glyphs = [];
          if (has16BitChars) {
            while (source.offset < source.length) {
              glyphs.push({char:source.readUTF16LE(1)});
            }
          }
          else {
            while (source.offset < source.length) {
              glyphs.push({char:source.readByteString(1)});
            }
          }
          this.onupdate(id, font);
          break;
        case TAG_DEFINE_FONT_2:
          var id = source.readUint16LE();
          var font = {};
          var flags = source.readUint8();
          font.bold = !!(flags & 1);
          font.italic = !!(flags & 2);
          var has16BitChars = !!(flags & 4);
          var has32BitOffsets = !!(flags & 8);
          font.ansi = !!(flags & 0x10);
          font.shiftJIS = !!(flags & 0x40);
          var hasLayout = !!(flags & 0x80);
          font.langCode = source.readUint8(); // SWF5+
          var nameLen = source.readUint8();
          font.name = source.readByteString(nameLen);
          var glyphs = font.glyphs = new Array(source.readUint16LE());
          var offsetBase = source.offset;
          var mapOffset;
          if (has32BitOffsets) {
            for (var i = 0; i < glyphs.length; i++) {
              glyphs[i] = offsetBase + source.readUint32LE();
            }
            mapOffset = offsetBase + source.readUint32LE();
          }
          else {
            for (var i = 0; i < glyphs.length; i++) {
              glyphs[i] = offsetBase + source.readUint16LE();
            }
            mapOffset = offsetBase + source.readUint16LE();
          }
          for (var i = 0; i < glyphs.length; i++) {
            if (source.offset !== glyphs[i]) {
              throw new Error('unexpected data');
            }
            glyphs[i] = {path:source.readSWFPath(true, true)};
          }
          if (source.offset !== mapOffset) {
            throw new Error('unexpected data');
          }
          if (has16BitChars) {
            for (var i = 0; i < glyphs.length; i++) {
              glyphs[i].char = source.readUTF16LE(1);
            }
          }
          else {
            for (var i = 0; i < glyphs.length; i++) {
              glyphs[i].char = source.readByteString(1);
            }
          }
          if (hasLayout) {
            font.ascent = source.readInt16LE();
            font.descent = source.readInt16LE();
            font.leadingHeight = source.readInt16LE();
            var advance = source.readSubarray(glyphs.length * 2);
            for (var i = 0; i < glyphs.length; i++) {
              glyphs[i].advance = advance.readInt16LE();
              glyphs[i].bounds = source.readSWFRect();
            }
            var kerning = font.kerning = new Array(source.readUint16LE());
            if (has16BitChars) {
              for (var i_kerning = 0; i_kerning < kerning.length; i_kerning++) {
                var chars = source.readUTF16LE(2);
                var adjust = source.readInt16LE();
                kerning[i_kerning] = {chars:chars, adjust:adjust};
              }
            }
            else {
              for (var i_kerning = 0; i_kerning < kerning.length; i_kerning++) {
                var chars = source.readByteString(2);
                var adjust = source.readInt16LE();
                kerning[i_kerning] = {chars:chars, adjust:adjust};
              }
            }
          }
          source.warnIfMore();
          this.ondefine(id, 'font', font);
          break;
        case TAG_DEFINE_FONT_NAME:
          var id = source.readUint16LE();
          var displayName = source.readByteString('\0');
          var copyrightMessage = source.readByteString('\0');
          this.onupdate(id, {displayName:displayName, copyrightMessage:copyrightMessage});
          break;
        case TAG_DEFINE_TEXT:
        case TAG_DEFINE_TEXT_2:
          var id = source.readUint16LE();
          var text = {bounds: source.readSWFRect()};
          text.matrix = source.readSWFMatrix();
          var glyphBits = source.readUint8();
          var advanceBits = source.readUint8();
          if (glyphBits > 32 || advanceBits > 32) {
            throw new Error('glyph/advance data out of 32-bit range');
          }
          var segments = text.segments = [];
          var segment;
          var NO_ALPHA = (chunkType < TAG_DEFINE_TEXT_2);
          for (;;) {
            var b = source.readUint8();
            if (b & 0x80) {
              var hasX = b & 1;
              var hasY = b & 2;
              var hasColor = b & 4;
              var hasFont = b & 8;
              segments.push(segment = {});
              if (hasFont) {
                segment.fontID = source.readUint16LE();
              }
              if (hasColor) {
                segment.color = source.readSWFColor(NO_ALPHA);
              }
              if (hasX) {
                segment.dx = source.readInt16LE();
              }
              if (hasY) {
                segment.dy = source.readInt16LE();
              }
              if (hasFont) {
                segment.fontHeight = source.readUint16LE();
              }
            }
            else if (b === 0) break;
            else {
              // glyph record
              var count = b & 0x7F;
              var glyphs = segment.glyphs = new Uint32Array(count);
              var advance = segment.advance = new Int32Array(count);
              for (var i_glyph = 0; i_glyph < count; i_glyph++) {
                glyphs[i_glyph] = source.readSWFBits(glyphBits, false);
                advance[i_glyph] = source.readSWFBits(advanceBits, true);
              }
              source.flushSWFBits();
            }
          }
          this.ondefine(id, 'text', text);
          break;
        case TAG_DEFINE_EDIT_TEXT:
          var id = source.readUint16LE();
          var edit = {bounds: source.readSWFRect()};
          var flags1 = source.readUint8();
          var hasFont = !!(flags1 & 0x1);
          var hasMaxLength = !!(flags1 & 0x2);
          var hasTextColor = !!(flags1 & 0x4);
          if (flags1 & 0x8) edit.readOnly = true;
          if (flags1 & 0x10) edit.password = true;
          if (flags1 & 0x20) edit.multiLine = true;
          if (flags1 & 0x40) edit.wordWrap = true;
          var hasText = !!(flags1 & 0x80);
          var flags2 = source.readUint8();
          var useGlyphFont = !!(flags2 & 1);
          if (flags2 & 2) edit.html = true;
          if (flags2 & 8) edit.border = true;
          if (flags2 & 0x10) edit.unselectable = true;
          var hasLayout = !!(flags2 & 0x20);
          if (flags2 & 0x40) edit.resizeToContent = true;
          if (hasFont) {
            edit.fontID = source.readUint16LE();
            edit.fontHeight = source.readUint16LE();
          }
          if (hasTextColor) {
            edit.color = source.readSWFColor();
          }
          if (hasMaxLength) {
            edit.maxLength = source.readUint16LE();
          }
          if (hasLayout) {
            switch (source.readUint8()) {
              case 0: edit.align = 'left'; break;
              case 1: edit.align = 'right'; break;
              case 2: edit.align = 'center'; break;
              case 3: edit.align = 'justify'; break;
              default: throw new Error('unknown align');
            }
            edit.marginLeft = source.readUint16LE();
            edit.marginRight = source.readUint16LE();
            edit.indent = source.readUint16LE();
            edit.leading = source.readUint16LE();
          }
          edit.valueVarName = source.readByteString('\0');
          if (hasText) {
            edit.text = source.readByteString('\0');
          }
          source.warnIfMore();
          break;
        case TAG_DO_ACTION:
          this.onaction(source);
          break;
        case TAG_DEFINE_SOUND:
          var id = source.readUint16LE();
          var sound = source.readSWFAudioFormat();
          sound.sampleCount = source.readUint32LE();
          var data = source.subarray(source.offset);
          if (sound.format === 'mp3') {
            sound.seekSamples = source.readUint16LE();
            sound.file = new File([data], id + '.mp3', {type:'audio/mpeg'});
          }
          else if (sound.format === 'adpcm') {
            sound.file = source.readSWFSoundADPCM(sound.hz, sound.channels);
          }
          else {
            console.log('unsupported sound format');
            sound.file = new File([data], id + '.dat');
          }
          this.ondefine(id, 'sound', sound);
          break;
        case TAG_PLAY_SOUND:
          var id = source.readUint16LE();
          var action = source.readSWFAudioAction();
          source.warnIfMore();
          this.onaudioaction(id, action);
          break;
        case TAG_DEFINE_BUTTON_2:
          var id = source.readUint16LE();
          var button = {};
          if (source.readUint8() & 1) {
            button.isMenuButton = true;
          }
          var members = button.members = [];
          var membersLength = source.readUint16LE();
          if (membersLength !== 0) {
            var memsrc = source.readSubarray(membersLength - 2);
            var flags, member;
            while (flags = memsrc.readUint8()) {
              members.push(member = {});
              if (flags & 1) member.up = true;
              if (flags & 2) member.over = true;
              if (flags & 4) member.down = true;
              if (flags & 8) member.hitTest = true;
              member.objectID = memsrc.readUint16LE();
              member.depth = memsrc.readUint16LE();
              member.matrix = memsrc.readSWFMatrix();
              member.colorTransform = memsrc.readSWFColorTransform();
            }
            memsrc.warnIfMore();
          }
          var transitions = button.transitions = {};
          var keyActions = button.keyActions = {};
          for (;;) {
            var actionLen = source.readUint16LE();
            if (actionLen === 0) break;
            var actsrc = source.readSubarray(actionLen - 2);
            var key = actsrc.readSWFBits(7);
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
            var tnames = [];
            if (actsrc.readSWFBits(1)) tnames.push('overdown2idle');
            if (actsrc.readSWFBits(1)) tnames.push('idle2overdown');
            if (actsrc.readSWFBits(1)) tnames.push('outdown2idle');
            if (actsrc.readSWFBits(1)) tnames.push('outdown2overdown');
            if (actsrc.readSWFBits(1)) tnames.push('overdown2outdown');
            if (actsrc.readSWFBits(1)) tnames.push('overdown2overup');
            if (actsrc.readSWFBits(1)) tnames.push('overup2overdown');
            if (actsrc.readSWFBits(1)) tnames.push('overup2idle');
            if (actsrc.readSWFBits(1)) tnames.push('idle2overup');
            var bytecode = actsrc.subarray(actsrc.offset);
            if (key) {
              if (key in keyActions) {
                keyActions[key].push(bytecode);
              }
              else {
                keyActions[key] = [bytecode];
              }
            }
            for (var i = 0; i < tnames.length; i++) {
              if (tnames[i] in transitions) {
                transitions[tnames[i]].actions.push(bytecode);
              }
              else {
                transitions[tnames[i]] = {actions: [bytecode]};
              }
            }
          }
          // source.warnIfMore(); /* seems common to have extra data here? */
          this.ondefine(id, 'button', button);
          break;
        case TAG_DEFINE_BUTTON_SOUND:
          var buttonID = source.readUint16LE();
          var button = {};
          var transitions = button.transitions = {};
          var soundID;
          if (soundID = source.readUint16LE()) {
            transitions['overup2idle'] = {
              soundID: soundID,
              action: source.readSWFAudioAction(),
            };
          }
          if (soundID = source.readUint16LE()) {
            transitions['idle2overup'] = {
              soundID: soundID,
              action: source.readSWFAudioAction(),
            };
          }
          if (soundID = source.readUint16LE()) {
            transitions['overup2overdown'] = {
              soundID: soundID,
              action: source.readSWFAudioAction(),
            };
          }
          if (soundID = source.readUint16LE()) {
            transitions['overdown2overup'] = {
              soundID: soundID,
              action: source.readSWFAudioAction(),
            };
          }
          source.warnIfMore();
          this.onupdate(buttonID, button);
          break;
        case TAG_PROTECT:
        case TAG_ENABLE_DEBUGGER:
        case TAG_ENABLE_DEBUGGER_2:
          if (chunkType >= TAG_ENABLE_DEBUGGER_2) source.readUint16LE(); // reserved
          this.passwordMD5 = source.length ? source.readByteString('\0') : null;
          source.warnIfMore();
          this.onprotect();
          break;
        case TAG_PLACE_OBJECT_2:
          var flags = source.readUint8();
          var z = source.readUint16LE();
          var action = flags & 1 ? (flags & 2 ? 'replace' : 'update') : 'insert';
          var settings = {};
          if (flags & 2) {
            settings.id = source.readUint16LE();
          }
          if (flags & 4) {
            settings.matrix = source.readSWFMatrix();
          }
          if (flags & 8) {
            settings.colorTransform = source.readSWFColorTransform();
          }
          if (flags & 0x10) {
            var v = source.readUint16LE();
            settings.morphRatio = v / 0xffff;
            settings.spriteReplaceCheck = v;
          }
          if (flags & 0x20) {
            settings.name = source.readByteString('\0');
          }
          if (flags & 0x40) {
            settings.clipDepth = source.readUint16LE();
          }
          if (flags & 0x80) {
            source.readUint16LE(); // reserved
            var actions = settings.actions = [];
            var eventFlags;
            if (this.version >= 6) {
              source.readUint32LE(); // usedEventFlags
              while (eventFlags = source.readUint32LE()) {
                var action = {eventFlags:eventFlags};
                var on = action.on = [];
                if (eventFlags & EVT_CONSTRUCT) on.push('construct');
                if (eventFlags & EVT_KEY_PRESS) on.push('key_press');
                if (eventFlags & EVT_DRAG_OUT) on.push('drag_out');
                if (eventFlags & EVT_KEY_PRESS) action.keycode = source.readUint8();
                var len = source.readUint32LE();
                action.response = source.readSubarray(len);
                actions.push(action);
              }
            }
            else {
              source.readUint16LE(); // usedEventFlags
              while (eventFlags = source.readUint16LE()) {
                var action = {eventFlags:eventFlags, on:[]};
                var len = source.readUint32LE();
                action.response = source.readSubarray(len);
                actions.push(action);
              }
            }
            for (var i = 0; i < actions.length; i++) {
              var eventFlags = actions[i].eventFlags, on = actions[i].on;
              if (eventFlags & EVT_DRAG_OVER) on.push('drag_over');
              if (eventFlags & EVT_ROLL_OUT) on.push('roll_out');
              if (eventFlags & EVT_ROLL_OVER) on.push('roll_out');
              if (eventFlags & EVT_RELEASE_OUTSIDE) on.push('release_outside');
              if (eventFlags & EVT_RELEASE) on.push('release');
              if (eventFlags & EVT_PRESS) on.push('press');
              if (eventFlags & EVT_INITIALIZE) on.push('initialize');
              if (eventFlags & EVT_DATA) on.push('data');
              if (eventFlags & EVT_KEY_UP) on.push('key_up');
              if (eventFlags & EVT_KEY_DOWN) on.push('key_down');
              if (eventFlags & EVT_MOUSE_UP) on.push('mouse_up');
              if (eventFlags & EVT_MOUSE_DOWN) on.push('mouse_down');
              if (eventFlags & EVT_MOUSE_MOVE) on.push('mouse_move');
              if (eventFlags & EVT_UNLOAD) on.push('unload');
              if (eventFlags & EVT_ENTER_FRAME) on.push('enter_frame');
              if (eventFlags & EVT_ONLOAD) on.push('onload');
            }
          }
          source.warnIfMore();
          this.ondisplaylistaction(z, action, settings);
          break;
        case TAG_REMOVE_OBJECT_2:
          var z = source.readUint16LE();
          source.warnIfMore();
          this.ondisplaylistaction(z, 'remove');
          break;
        case TAG_DEFINE_SPRITE:
          this.spriteID = source.readUint16LE();
          this.spriteFrameCount = source.readUint16LE();
          this.onopensprite();
          for (var j = 0; j < this.spriteFrameCount; j++) {
            this.spriteFrameNumber = j;
            this.onopenspriteframe();
            var subChunkType;
            frameLoop: for (;;) switch (subChunkType = this.onrawtag(source)) {
              case TAG_END:
                throw new Error(
                'sprite '+this.spriteID+': not enough frames'
                + ' (expected '+this.spriteFrameCount+', found '+j+')');
              case TAG_SHOW_FRAME:
                this.onrawchunk(TAG_SHOW_FRAME, source.readSubarray(this.chunkLength));
                break frameLoop;
              case TAG_PLACE_OBJECT:
              case TAG_PLACE_OBJECT_2:
              case TAG_REMOVE_OBJECT:
              case TAG_REMOVE_OBJECT_2:
              case TAG_DO_ACTION:
              case TAG_PLAY_SOUND:
              case TAG_FRAME_LABEL:
                this.onrawchunk(subChunkType, source.readSubarray(this.chunkLength));
                continue frameLoop;
              case TAG_SOUND_STREAM_HEAD:
              case TAG_SOUND_STREAM_HEAD_2:
                if (this.spriteStream) this.onclosespritestream();
                var streamSource = source.readSubarray(this.chunkLength);
                this.spriteStream = streamSource.readSWFStreamHead();
                streamSource.warnIfMore();
                this.onopenspritestream();
                continue frameLoop;
              case TAG_SOUND_STREAM_BLOCK:
                this.onrawstreamchunk(source.readSubarray(this.chunkLength), this.spriteStream);
                continue frameLoop;
              default:
                throw new Error(
                'sprite '+this.spriteID+': invalid sprite chunk type ('+this.chunkType+')');
            }
            this.onclosespriteframe();
          }
          endLoop: for (;;) switch (this.onrawtag(source)) {
            case TAG_END:
              this.onrawchunk(TAG_END, source.readSubarray(this.chunkLength));
              break endLoop;
            default:
              throw new Error('sprite '+this.spriteID+': unexpected data after final frame');
          }
          if (this.spriteStream) {
            this.onclosespritestream();
            delete this.spriteStream;
          }
          this.onclosesprite();
          break;
        case TAG_FRAME_LABEL:
          this.onframelabel(source.readByteString('\0'));
          source.warnIfMore();
          break;
        case TAG_DEFINE_SCALING_GRID:
          var spriteOrButtonID = source.readUint16LE();
          this.onupdate(spriteOrButtonID, {
            scalingGrid: source.readSWFRect(),
          });
          break;
        case TAG_EXPORT:
          for (var count = source.readUint16LE(); count > 0; count--) {
            var id = source.readUint16LE();
            var symbolName = source.readByteString('\0');
            this.onexport(id, symbolName);
          }
          source.warnIfMore();
          break;
        case TAG_DEBUG_ID:
          this.debugID = source.readSubarray(source.length);
          this.ondebugid();
          break;
        default:
          this.onunhandledtag(chunkType, source);
          break;
      }
    },
    onrawstreamchunk: function(source, stream) {
      if (stream.format === 'mp3') {
        var sampleCount = source.readUint16LE();
        var sampleSeek = source.readInt16LE();
        this.onstream(source.subarray(source.offset), {
          sampleCount: sampleCount,
          sampleSeek: sampleSeek,
        });
      }
      else {
        this.onstream(source);
      }
    },
  };
  
  Object.assign(Uint8Array.prototype, {
    bitBuf: 0,
    bitCount: 0,
    flushSWFBits: function() {
      this.bitCount = this.bitBuf = 0;
    },
    readSWFBits: function(n, signed) {
      if (n === 0) return 0;
      while (this.bitCount < n) {
        this.bitBuf = (this.bitBuf << 8) | this[this.offset++];
        this.bitCount += 8;
      }
      var value;
      if (signed) {
        value = this.bitBuf << (32-this.bitCount) >> (32-n);
      }
      else {
        value = this.bitBuf << (32-this.bitCount) >>> (32-n);
      }
      this.bitCount -= n;
      return value;
    },
    readSWFRect: function() {
      var coordBits = this.readSWFBits(5, false);
      var rect = new SWFRect;
      rect.left = this.readSWFBits(coordBits, true);
      rect.right = this.readSWFBits(coordBits, true);
      rect.top = this.readSWFBits(coordBits, true);
      rect.bottom = this.readSWFBits(coordBits, true);
      this.flushSWFBits();
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
    readSWFMatrix: function() {
      var matrix = new SWFMatrix;
      if (this.readSWFBits(1, false)) {
        var scaleBits = this.readSWFBits(5, false);
        matrix.a = this.readSWFBits(scaleBits, true) / 0x10000;
        matrix.d = this.readSWFBits(scaleBits, true) / 0x10000;
      }
      if (this.readSWFBits(1, false)) {
        var rotSkewBits = this.readSWFBits(5, false);
        matrix.b = this.readSWFBits(rotSkewBits, true);
        matrix.c = this.readSWFBits(rotSkewBits, true);
      }
      var translateBits = this.readSWFBits(5, false);
      if (translateBits) {
        matrix.e = this.readSWFBits(translateBits, true);
        matrix.f = this.readSWFBits(translateBits, true);
      }
      this.flushSWFBits();
      return matrix;
    },
    readSWFGradientStops: function(NO_ALPHA, PAIRS) {
      var flags = this.readUint8();
      var count = flags & 0xf;
      // max count is only enforced before DefineShape4
      if (count === 0 /* || count > 8 */) {
        throw new Error('illegal number of gradient points');
      }
      if (PAIRS) count *= 2;
      var points = new Array(count);
      for (var i = 0; i < points.length; i++) {
        var stop = points[i] = {ratio: percentFromByte(this.readUint8())};
        stop.color = this.readSWFColor(NO_ALPHA);
      }
      points.spreadMode = ['pad', 'reflect', 'repeat'][flags >>> 6];
      points.interpolationMode = ['normal', 'linear'][(flags >>> 4) & 3];
      return points;
    },
    readSWFFillStyles: function(EXTENDED_LENGTH, NO_ALPHA, PAIRS) {
      var count = this.readUint8();
      if (count === 0xff && EXTENDED_LENGTH) {
        count = this.readUint16LE();
      }
      var fillStyles = new Array(count+1);
      fillStyles[0] = PAIRS ? ['none', 'none'] : 'none';
      for (var i = 1; i < fillStyles.length; i++) {
        fillStyles[i] = this.readSWFFillStyle(NO_ALPHA, PAIRS);
      }
      return fillStyles;
    },
    readSWFStrokeStyles: function(EXTENDED_LENGTH, NO_ALPHA, PAIRS, EXTENDED_STROKE) {
      var count = this.readUint8();
      if (count === 255 && EXTENDED_LENGTH) {
        count = this.readUint16LE();
      }
      var strokeStyles = new Array(1 + count);
      strokeStyles[0] = {width:0, color:'transparent'};
      if (PAIRS) strokeStyles[0] = [strokeStyles[0], strokeStyles[0]];
      if (PAIRS) for (var i = 1; i < strokeStyles.length; i++) {
        var a = {}, b = {};
        a.width = this.readUint16LE();
        b.width = this.readUint16LE();
        a.color = this.readSWFColor(NO_ALPHA);
        b.color = this.readSWFColor(NO_ALPHA);
        strokeStyles[i] = [a, b];
      }
      else for (var i = 1; i < strokeStyles.length; i++) {
        var width = this.readUint16LE();
        var stroke;
        if (EXTENDED_STROKE) {
          stroke = this.readSWFExtendedStrokeStyle(NO_ALPHA, PAIRS);
        }
        else {
          stroke = {};
        }
        stroke.width = width;
        stroke.color = this.readSWFColor(NO_ALPHA);
        strokeStyles[i] = stroke;
      }
      return strokeStyles;
    },
    readSWFExtendedStrokeStyle: function(NO_ALPHA, PAIRS) {
      var info = {};
      var flags = this.readUint8();
      if (flags & 1) info.pixelHinting = true;
      if (flags & 2) info.noYScale = true;
      if (flags & 4) info.noXScale = true;
      var hasFill = flags & 8;
      info.joinStyle = ['round', 'bevel', 'miter'][(flags >>> 4) & 3];
      info.startCapStyle = ['none', 'round', 'square'][flags >>> 6];
      flags = this.readUint8();
      info.endCapStyle = ['none', 'round', 'square'][flags & 3];
      if (flags & 4) info.noClose = true;
      if (info.joinStyle == 'miter') {
        info.miterLimitFactor = this.readUint16LE() / 0x100;
      }
      if (hasFill) {
        info.strokeFill = this.readSWFFillStyle(NO_ALPHA, PAIRS);
      }
      return info;
    },
    readSWFFillStyle: function(NO_ALPHA, PAIRS) {
      var fillStyle = this.readUint8();
      switch (fillStyle) {
        case 0x00:
          if (PAIRS) {
            var a = this.readSWFColor(NO_ALPHA);
            var b = this.readSWFColor(NO_ALPHA);
            return [a, b];
          }
          return this.readSWFColor(NO_ALPHA);
        case 0x10:
        case 0x12:
        case 0x13:
          var mode = (fillStyle === 0x10) ? 'linear' : 'radial';
          var hasFocalPoint = (fillStyle === 0x13);
          if (PAIRS) {
            var a = {type:'gradient', mode:mode, stops:[]};
            var b = {type:'gradient', mode:mode, stops:[]};
            a.matrix = this.readSWFMatrix();
            b.matrix = this.readSWFMatrix();
            var stops = this.readSWFGradientStops(NO_ALPHA, true);
            a.spreadMode = b.spreadMode = stops.spreadMode;
            a.interpolationMode = b.interpolationMode = stops.interpolationMode;
            if (hasFocalPoint) {
              a.focalPoint = b.focalPoint = this.readInt16LE() / 0x100;
            }
            while (stops.length > 0) {
              a.stops.push(stops.shift());
              b.stops.push(stops.shift());
            }
            return [a, b];
          }
          else {
            var matrix = this.readSWFMatrix();
            var stops = this.readSWFGradientStops(NO_ALPHA);
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
              style.focalPoint = this.readInt16LE() / 0x100;
            }
            return style;
          }
          break;
        case 0x40:
        case 0x41:
        case 0x42:
        case 0x43:
          var bitmapID = this.readUint16LE();
          var mode = (fillStyle & 1) ? 'clipped' : 'tiled';
          var hardEdges = !!(fillStyle & 2);
          if (PAIRS) {
            var a = {
              type: 'bitmap',
              mode: mode,
              matrix: this.readSWFMatrix(),
              bitmapID: bitmapID,
              hardEdges: hardEdges,
            };
            var b = {
              type: 'bitmap',
              mode: mode,
              matrix: this.readSWFMatrix(),
              bitmapID: bitmapID,
              hardEdges: hardEdges,
            };
            return [a, b];
          }
          else {
            return {
              type: 'bitmap',
              mode: mode,
              matrix: this.readSWFMatrix(),
              bitmapID: bitmapID,
              hardEdges: hardEdges,
            };
          }
          break;
        default:
          throw new Error('unknown fill mode');
      }
    },
    readSWFPath: function(EXTENDED_LENGTH, NO_ALPHA, EXTENDED_STROKE) {
      var fillIndexBits = this.readSWFBits(4, false);
      var lineIndexBits = this.readSWFBits(4, false);
      var path = new SWFPath;
      for (;;) {
        if (this.readSWFBits(1, false)) {
          // edge record flag
          if (this.readSWFBits(1, false)) {
            // straight edge flag
            var coordBits = 2 + this.readSWFBits(4, false);
            if (this.readSWFBits(1, false)) {
              // general line flag
              var x = this.readSWFBits(coordBits, true);
              var y = this.readSWFBits(coordBits, true);
              path.line(x, y);
            }
            else if (this.readSWFBits(1, false)) {
              // vertical
              path.line(0, this.readSWFBits(coordBits, true));
            }
            else {
              // horizontal
              path.line(this.readSWFBits(coordBits, true), 0);
            }
          }
          else {
            // curved edge
            var coordBits = 2 + this.readSWFBits(4, false);
            var controlX = this.readSWFBits(coordBits, true);
            var controlY = this.readSWFBits(coordBits, true);
            var anchorX = this.readSWFBits(coordBits, true);
            var anchorY = this.readSWFBits(coordBits, true);
            path.curve(controlX,controlY, anchorX,anchorY);
          }
        }
        else {
          // not edge record flag
          var flags = this.readSWFBits(5, false);
          if (flags === 0) break; // end of shape data
          path.newSegment();
          if (flags & 1) {
            // move-to flag
            var coordBitCount = this.readSWFBits(5, false);
            var x = this.readSWFBits(coordBitCount, true);
            var y = this.readSWFBits(coordBitCount, true);
            path.move(x, y);
          }
          if (flags & 2) {
            path.i_fill0(this.readSWFBits(fillIndexBits, false));
          }
          if (flags & 4) {
            path.i_fill1(this.readSWFBits(fillIndexBits, false));
          }
          if (flags & 8) {
            path.i_stroke(this.readSWFBits(lineIndexBits, false));
          }
          if (flags & 0x10) {
            this.flushSWFBits();
            var fillStyles = this.readSWFFillStyles(EXTENDED_LENGTH, NO_ALPHA);
            var strokeStyles = this.readSWFStrokeStyles(EXTENDED_LENGTH, NO_ALPHA, false, EXTENDED_STROKE);
            path.newStyles(fillStyles, strokeStyles);
            fillIndexBits = this.readSWFBits(4, false);
            lineIndexBits = this.readSWFBits(4, false);
          }
        }
      }
      this.flushSWFBits();
      return path;
    },
    readSWFColorTransform: function(NO_ALPHA) {
      var transform = new SWFColorTransform;
      var withAdd = this.readSWFBits(1);
      var withMultiply = this.readSWFBits(1);
      var valueBits = this.readSWFBits(4);
      if (withMultiply) {
        var r = this.readSWFBits(valueBits, true) / 0x100;
        var g = this.readSWFBits(valueBits, true) / 0x100;
        var b = this.readSWFBits(valueBits, true) / 0x100;
        var a = NO_ALPHA ? 1 : this.readSWFBits(valueBits, true) / 0x100;
        transform.multiply(r, g, b, a);
      }
      if (withAdd) {
        var r = this.readSWFBits(valueBits, true);
        var g = this.readSWFBits(valueBits, true);
        var b = this.readSWFBits(valueBits, true);
        var a = NO_ALPHA ? 0 : this.readSWFBits(valueBits, true);
        transform.add(r, g, b, a);
      }
      this.flushSWFBits();
      return transform;
    },
    readSWFAudioFormat: function() {
      var sound = {};
      var formatCode = this.readSWFBits(4);
      sound.hz = 5512.5 * (1 << this.readSWFBits(2));
      sound.bits = this.readSWFBits(1) ? 16 : 8;
      sound.channels = this.readSWFBits(1) ? 2 : 1;
      switch (formatCode) {
        case 0:
          sound.format = 'pcm';
          if (sound.bits === 16) {
            sound.endianness = 'native';
          }
          break;
        case 1: sound.format = 'adpcm'; break;
        case 2: sound.format = 'mp3'; break;
        case 3:
          sound.format = 'pcm';
          if (sound.bits !== 8) {
            sound.endianness = 'little';
          }
          break;
        case 6: sound.format = 'asao'; break;
        default: throw new Error('unknown sound format');
      }
      return sound;
    },
    readSWFAudioAction: function() {
      var action = {};
      var flags = this.readUint8();
      if (flags & 1) {
        action.startSample = this.readUint32LE();
      }
      if (flags & 2) {
        action.endSample = this.readUint32LE();
      }
      if (flags & 4) {
        action.loopCount = this.readUint16LE();
      }
      if (flags & 8) {
        var envelope = action.envelope = new Array(this.readUint8());
        for (var i = 0; i < envelope.length; i++) {
          var pos44 = this.readUint32LE();
          // documentation said 32768 not 32767
          var leftVolume = this.readUint16LE() / 32768;
          var rightVolume = this.readUint16LE() / 32768;
          envelope[i] = {
            positionAt44KHz: pos44,
            leftVolume: leftVolume,
            rightVolume: rightVolume,
          };
        }
      }
      if (flags & 0x10) {
        action.ifNotAlreadyPlaying = true;
      }
      action.mode = (flags & 0x20) ? 'stop' : 'play';
      return action;
    },
    readSWFStreamHead: function() {
      var playback = this.readSWFAudioFormat();
      var stream = this.readSWFAudioFormat();
      stream.playback = playback;
      stream.samplesPerBlock = this.readUint16LE();
      if (stream.format === 'mp3') {
        stream.seekSamples = this.readInt16LE();
      }
      return stream;
    },
    warnIfMore: function(msg) {
      if (this.offset < this.length) {
        console.warn(msg || 'unexpected data');
      }
    },
  });
  
  function percentFromByte(v) {
    // reversible (remember to use Math.round) to get 0-255 back
    return +(v*100/255).toFixed(1) + '%';
  }  
  
  function SWFRect() {
  }
  SWFRect.prototype = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    get width() { return this.right - this.left; },
    get height() { return this.bottom - this.top; },
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
        var translate = 'translate(' + this.e + ', ' + this.f + ')';
        return scale ? translate+' '+scale : translate;
      }
      return 'matrix(' + [
        this.a, this.b,
        this.c, this.d,
        this.e, this.f].join(', ') + ')';
    },
    get isIdentity() {
      return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
    },  
  };
  
  function SWFColorTransform() {
  }
  SWFColorTransform.prototype = {
    mulR: 1,
    mulG: 1,
    mulB: 1,
    mulA: 1,
    addR: 0,
    addG: 0,
    addB: 0,
    addA: 0,
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
  };
  
  function SWFPathRecord(type, values) {
    this.type = type;
    this.values = values;
  }
  SWFPathRecord.prototype = {
    toString: function() {
      return this.type + this.values.join(' ');
    },
  };
  
  function SWFPathConverter(fillStyles, strokeStyles) {
    this.fillStyles = fillStyles;
    this.strokeStyles = strokeStyles;
    this.fillEdges = new Array(fillStyles.length);
    this.strokeEdges = new Array(strokeStyles.length);
    for (var i = 1; i < fillStyles.length; i++) {
      this.fillEdges[i] = [];
    }
    for (var i = 1; i < strokeStyles.length; i++) {
      this.strokeEdges[i] = [];
    }
  }
  SWFPathConverter.prototype = {
    x:0, y:0,
    i_fill0: function(i) {
      this.fillEdge0 = this.fillEdges[i];
    },
    i_fill1: function(i) {
      this.fillEdge1 = this.fillEdges[i];
    },
    i_stroke: function(i) {
      this.strokeEdge = this.strokeEdges[i];
    },
    move: function(x, y) {
      this.x = x;
      this.y = y;
    },
    line: function(dx, dy) {
      var x = this.x + dx, y = this.y + dy;
      if (this.fillEdge0) {
        this.fillEdge0.push({x1:x, y1:y, x2:this.x, y2:this.y});
      }
      if (this.fillEdge1) {
        this.fillEdge1.push({x1:this.x, y1:this.y, x2:x, y2:y});
      }
      if (this.strokeEdge) {
        this.strokeEdge.push({x1:this.x, y1:this.y, x2:x, y2:y});
      }
      this.x = x;
      this.y = y;
    },
    curve: function(dcx, dcy, dx, dy) {
      var cx = this.x + dcx, cy = this.y + dcy;
      var x = cx + dx, y = cy + dy;
      if (this.fillEdge0) {
        this.fillEdge0.push({x1:x, y1:y, control:[cx, cy], x2:this.x, y2:this.y});
      }
      if (this.fillEdge1) {
        this.fillEdge1.push({x1:this.x, y1:this.y, control:[cx, cy], x2:x, y2:y});
      }
      if (this.strokeEdge) {
        this.strokeEdge.push({x1:this.x, y1:this.y, control:[cx, cy], x2:x, y2:y});
      }
      this.x = x;
      this.y = y;
    },
    segmentsToPath: function(segments) {
      var i_seg = 0, seg = segments[0];
      var x = seg.x1, y = seg.y1;
      var path = [{type:'m', values:[x, y]}];
      for (;;) {
        if (seg.control) {
          path.push({type:'q', values:[
            seg.control[0] - x,
            seg.control[1] - y,
            seg.x2 - x,
            seg.y2 - y,
          ]});
        }
        else if (seg.x2 === x) {
          path.push({type:'v', values:[
            seg.y2 - y,
          ]});
        }
        else if (seg.y2 === y) {
          path.push({type:'h', values:[
            seg.x2 - x,
          ]});
        }
        else {
          path.push({type:'l', values:[
            seg.x2 - x,
            seg.y2 - y,
          ]});
        }
        x = seg.x2;
        y = seg.y2;
        var nextSeg = segments[++i_seg];
        if (!nextSeg) break;
        if (x !== nextSeg.x1 || y !== nextSeg.y1) {
          path.push({type:'m', values: [
            nextSeg.x1 - x,
            nextSeg.y1 - y,
          ]});
          x = nextSeg.x1;
          y = nextSeg.y1;
        }
        seg = nextSeg;
      }
      return path;
    },
    toPaths: function() {
      var paths = [];
      for (var i_fill = 1; i_fill < this.fillEdges.length; i_fill++) {
        var segments = this.fillEdges[i_fill];
        if (segments.length === 0) continue;
        var seg = segments[0];
        var i_seg = 0;
        while (++i_seg < segments.length) {
          var nextSeg = segments[i_seg];
          if (seg.x2 !== nextSeg.x1 || seg.y2 !== nextSeg.y1) {
            var j_seg = i_seg;
            while (++j_seg < segments.length) {
              var laterSeg = segments[j_seg];
              if (seg.x2 === laterSeg.x1 && seg.y2 === laterSeg.y1) {
                nextSeg = laterSeg;
                segments.splice(j_seg, 1);
                segments.splice(i_seg, 0, nextSeg);
                break;
              }
            }
          }
          seg = nextSeg;
        }
        var path = this.segmentsToPath(segments);
        path.mode = 'fill';
        path.i_fill = i_fill;
        paths.push(path);
      }
      for (var i_stroke = 1; i_stroke < this.strokeEdges.length; i_stroke++) {
        var segments = this.strokeEdges[i_stroke];
        if (segments.length === 0) continue;
        var path = this.segmentsToPath(segments);
        path.mode = 'stroke';
        path.i_stroke = i_stroke;
        paths.push(path);
      }
      return paths;
    },
  };
  
  function SWFPath() {
    this.segments = [];
  }
  SWFPath.prototype = {
    fillStyles: ['none', '#000'],
    strokeStyles: ['none'],
    initialStyles: function(fillStyles, strokeStyles) {
      this.fillStyles = fillStyles;
      this.strokeStyles = strokeStyles;
    },
    newSegment: function() {
      this.segments.push(this.segment = []);
    },
    line: function(x, y) {
      this.segment.push(new SWFPathRecord('l', [x, y]));
    },
    curve: function(cx,cy, x,y) {
      this.segment.push(new SWFPathRecord('q', [cx,cy, x,y]));
    },
    move: function(x, y) {
      this.segment.push(new SWFPathRecord('M', [x, y]));
    },
    i_fill0: function(i_fill) {
      this.segment.i_fill0 = i_fill;
    },
    i_fill1: function(i_fill) {
      this.segment.i_fill1 = i_fill;
    },
    i_stroke: function(i_stroke) {
      this.segment.i_stroke = i_stroke;
    },
    newStyles: function(fillStyles, strokeStyles) {
      this.segment.fillStyles = fillStyles;
      this.segment.strokeStyles = strokeStyles;
    },
    toMonoPaths: function() {
      var converter = new SWFPathConverter(this.fillStyles, this.strokeStyles);
      var output = [];
      for (var i_segment = 0; i_segment < this.segments.length; i_segment++) {
        var segment = this.segments[i_segment];
        if ('fillStyles' in segment) {
          output.push({
            fillStyles: converter.fillStyles,
            strokeStyles: converter.strokeStyles,
            paths: converter.toPaths(),
          });
          converter = new SWFPathConverter(segment.fillStyles, segment.strokeStyles);
        }
        if ('i_fill0' in segment) converter.i_fill0(segment.i_fill0);
        if ('i_fill1' in segment) converter.i_fill1(segment.i_fill1);
        if ('i_stroke' in segment) converter.i_stroke(segment.i_stroke);
        for (var i_step = 0; i_step < segment.length; i_step++) {
          var step = segment[i_step];
          switch (step.type) {
            case 'M': converter.move.apply(converter, step.values); break;
            case 'l': converter.line.apply(converter, step.values); break;
            case 'q': converter.curve.apply(converter, step.values); break;
          }
        }
      }
      output.push({
        fillStyles: converter.fillStyles,
        strokeStyles: converter.strokeStyles,
        paths: converter.toPaths(),
      });
      return output;
    },
    toCFF2Path: function() {
      var pathGroups = this.toMonoPaths();
      var cff2 = [];
      var last = null;
      var x = 0, y = 0;
      for (var i_group = 0; i_group < pathGroups.length; i_group++) {
        var paths = pathGroups[i_group].paths;
        for (var i_path = 0; i_path < paths.length; i_path++) {
          var path = paths[i_path];
          if (path.mode !== 'fill') continue;
          for (var i_seg = 0; i_seg < path.length; i_seg++) {
            var segment = path[i_seg];
            switch (segment.type) {
              case 'm':
                var dx = segment.values[0], dy = segment.values[1];
                if (i_seg === 0) {
                  dx -= x;
                  dy -= y;
                }
                if (!dy) {
                  cff2.push(['hmoveto', dx]);
                }
                else if (!dx) {
                  cff2.push(['vmoveto', -dy]);
                }
                else {
                  cff2.push(['rmoveto', dx, -dy]);
                }
                x += dx;
                y += dy;
                last = null;
                break;
              case 'l':
                var dx = segment.values[0], dy = segment.values[1];
                if (last && last[0] === 'rlineto') {
                  if (last.push(dx, -dy) >= 49) last = null;
                }
                else {
                  cff2.push(last = ['rlineto', dx, -dy]);
                }
                x += dx;
                y += dy;
                break;
              case 'h':
                var dx = segment.values[0];
                if (last && (last[0] === 'hlineto' && (last.length % 2) || last[0] === 'vlineto' && !(last.length % 2))) {
                  if (last.push(dx) >= 49) last = null;
                }
                else {
                  cff2.push(last = ['hlineto', dx]);
                }
                x += dx;
                break;
              case 'v':
                var dy = segment.values[0];
                if (last && (last[0] === 'vlineto' && (last.length % 2) || last[0] === 'hlineto' && !(last.length % 2))) {
                  if (last.push(-dy) >= 49) last = null;
                }
                else {
                  cff2.push(last = ['vlineto', -dy]);
                }
                y += dy;
                break;
              case 'q':
                var dcx = segment.values[0], dcy = segment.values[1], dx = segment.values[2], dy = segment.values[3];
                var dc1x =      2* dcx    /3, dc1y =      2* dcy    /3;
                var dc2x = dx + 2*(dcx-dx)/3, dc2y = dy + 2*(dcy-dy)/3;
                x += dx;
                y += dy;
                dx -= dc2x;
                dy -= dc2y;
                dc2x -= dc1x;
                dc2y -= dc1y;
                if (last && last[0] === 'rrcurveto') {
                  if (last.push(dc1x,-dc1y, dc2x,-dc2y, dx,-dy) >= 49) last = null;
                }
                else {
                  cff2.push(last = ['rrcurveto', dc1x,-dc1y, dc2x,-dc2y, dx,-dy]);
                }
                break;
              default:
                throw new Error('unexpected path segment type');
            }
          }
        }
      }
      return cff2;
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
  };
  
  function makeImageBlob(bpp, rows, palette) {
    var header = new DataView(new ArrayBuffer(54));
    var parts = [header];
    var paletteLength;
    if (palette) {
      var palbytes = new Uint8Array(palette.buffer, palette.byteOffset, palette.byteLength);
      paletteLength = palbytes.length/4;
      var palbmp = new Uint8Array(palbytes.length);
      for (var i = 0; i < paletteLength; i++) {
        palbmp[i*4 + 2] = palbytes[i*4 + 0];
        palbmp[i*4 + 1] = palbytes[i*4 + 1];
        palbmp[i*4 + 0] = palbytes[i*4 + 2];
      }
      parts.push(palbmp);
    }
    else paletteLength = 0;
    var rowBytes = rows[0].length;
    if (rowBytes & 3) {
      var padding = new Uint8Array(4 - rowBytes&3);
      rowBytes += padding.length;
      for (var i = rows.length-1; i >= 0; i--) {
        parts.push(rows[i], padding);
      }
    }
    else {
      for (var i = rows.length-1; i >= 0; i--) {
        parts.push(rows[i]);
      }
    }
    header.setUint16(0, ('B'.charCodeAt(0) << 8) | 'M'.charCodeAt(0), false);
    header.setUint32(2, header.byteLength + paletteLength*4 + rowBytes * rows.length, true);
    header.setUint32(10, header.byteLength + paletteLength*4, true);
    header.setUint32(14, 40, true); // BITMAPINFOHEADER
    header.setUint32(18, rows[0].length * 8 / bpp, true); // width
    header.setInt32(22, rows.length, true); // height
    header.setUint16(26, 1, true); // planes
    header.setUint16(28, bpp, true); // bpp
    if (paletteLength) header.setUint32(46, paletteLength, true);
    return new Blob(parts, {type:'image/bmp'});
  }
  
  function makeAlphaBitmapBlob(bpp, rows, palette) {
    var parts = [new Uint8Array([0x89]), 'PNG\r\n\x1A\n'];

    function chunk(name, buf) {
      var info = new ArrayBuffer(8);
      var lenDV = new DataView(info, 0, 4);
      var crcDV = new DataView(info, 4, 4);
      var crc = new Uint8Array([
        name.charCodeAt(0),
        name.charCodeAt(1),
        name.charCodeAt(2),
        name.charCodeAt(3)]).getCRC32();
      if (typeof buf.byteLength === 'number') {
        lenDV.setUint32(0, buf.byteLength);
        if (!(buf instanceof Uint8Array)) {
          buf = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
        }
        crcDV.setUint32(0, buf.getCRC32(crc));
        parts.push(lenDV, name, buf, crcDV);
      }
      else {
        var len = 0;
        parts.push(lenDV, name);
        for (var i = 0; i < buf.length; i++) {
          var part = buf[i];
          len += buf[i].byteLength;
          if (!(part instanceof Uint8Array)) {
            part = new Uint8Array(part.buffer, part.byteOffset, part.byteLength);
          }
          crc = part.getCRC32(crc);
          parts.push(part);
        }
        lenDV.setUint32(0, len);
        crcDV.setUint32(0, crc);
        parts.push(crcDV);
      }
    }

    {
      var IHDR = new DataView(new ArrayBuffer(13));
      var width = rows[0].length * 8 / bpp, height = rows.length;
      IHDR.setUint32(0, width);
      IHDR.setUint32(4, height);
      IHDR.setUint8(8, bpp);
      const PALETTE_USED=1, COLOR_USED=2, ALPHA_USED=4;
      IHDR.setUint8(9, PALETTE_USED | COLOR_USED); // tRNS not represented here
      chunk('IHDR', IHDR);
    }

    {
      var PLTE = new Uint8Array(3 * palette.length);
      var tRNS = new Uint8Array(palette.length);
      var palbytes = new Uint8Array(palette.buffer, palette.byteOffset, palette.byteLength);
      for (var i = 0; i < palette.length; i++) {
        PLTE[i*3 + 0] = palbytes[i*4 + 0];
        PLTE[i*3 + 1] = palbytes[i*4 + 1];
        PLTE[i*3 + 2] = palbytes[i*4 + 2];
        tRNS[i] = palbytes[i*4 + 3];
      }
      chunk('PLTE', PLTE);
      chunk('tRNS', tRNS);
    }

    {
      // all rows must be prepended with filter byte
      var rowBytes = 1 + rows[0].length;
      var IDAT = new Uint8Array(rows.length * rowBytes);
      for (var i = 0; i < rows.length; i++) {
        IDAT.set(rows[i], i*rowBytes + 1);
      }
      IDAT = IDAT.toZStoredParts();
      chunk('IDAT', IDAT);
    }

    chunk('IEND', new Uint8Array(0));
    return new Blob(parts, {type:'image/png'});
  }
  
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
  
  Uint8Array.prototype.readSWFSoundADPCM = function(sampleRate, channels) {
    const codeSize = 2 + (this.readUint8() >>> 6);
    const indexTable = ADPCM_INDEX_TABLES[codeSize];
    const inPacketSize = (channels === 2)
      ? Math.ceil((46 + 8192*codeSize) / 8)
      : Math.ceil((22 + 4096*codeSize) / 8);
    const packetCount = Math.floor((this.length - this.offset)/inPacketSize);
    const outPacketSize = channels * 2 * 4097;
    var wavBuffer = new ArrayBuffer(4 + 4 + 16 + packetCount*outPacketSize);
    var dataSizeSlot = new DataView(wavBuffer, 0, 4);
    var totalSizeSlot = new DataView(wavBuffer, 4, 4);
    var fmt = new DataView(wavBuffer, 8, 16);
    var data = new DataView(wavBuffer, 24);
    dataSizeSlot.setUint32(0, packetCount*outPacketSize, true);
    totalSizeSlot.setUint32(0, 44 + packetCount*outPacketSize, true);
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
    if (channels === 2) {
      for (var i_packet = 0; i_packet < packetCount; i_packet++) {
        var leftSample = this.readInt16LE();
        var leftStepIndex = this.readUint8() >>> 2;
        var rightSample = this.readInt16LE();
        var rightStepIndex = this.readSWFBits(6);
        data.setInt16(leftSample, i_packet * outPacketSize, true);
        data.setInt16(rightSample, i_packet * outPacketSize + 2, true);
        for (var i_sample = 0; i_sample < 4096; i_sample++) {
          var leftCode = this.readSWFBits(codeSize);
          var rightCode = this.readSWFBits(codeSize);
          var leftStep = ADPCM_STEP_SIZE[leftStepIndex];
          var rightStep = ADPCM_STEP_SIZE[rightStepIndex];
          var leftDiff = leftStep >> 3;
          if (leftCode & 4) leftDiff += leftStep;
          if (leftCode & 2) leftDiff += leftStep >> 1;
          if (leftCode & 1) leftDiff += leftStep >> 2;
          if (leftCode & 8) leftDiff = -leftDiff;
          var rightDiff = rightStep >> 3;
          if (rightCode & 4) rightDiff += rightStep;
          if (rightCode & 2) rightDiff += rightStep >> 1;
          if (rightCode & 1) rightDiff += rightStep >> 2;
          if (rightCode & 8) rightDiff = -rightDiff;
          leftSample = Math.min(0x7fff, Math.max(-0x8000, leftSample + leftDiff));
          rightSample = Math.min(0x7fff, Math.max(-0x8000, rightSample + rightDiff));
          data.setInt16(i_packet * outPacketSize + (1 + i_sample) * 4, leftSample, true);
          data.setInt16(i_packet * outPacketSize + (1 + i_sample) * 4 + 2, rightSample, true);
          leftStepIndex = Math.min(88, Math.max(0, leftStepIndex + indexTable[leftCode]));
          rightStepIndex = Math.min(88, Math.max(0, rightStepIndex + indexTable[rightCode]));
        }
        this.flushSWFBits();
      }
    }
    else {
      for (var i_packet = 0; i_packet < packetCount; i_packet++) {
        var sample = this.readInt16LE();
        var stepIndex = this.readSWFBits(6);
        for (var i_sample = 0; i_sample < 4096; i_sample++) {
          var code = this.readSWFBits(codeSize);
          var step = ADPCM_STEP_SIZE[stepIndex];
          var diff = step >> 3;
          if (code & 4) diff += step;
          if (code & 2) diff += step >> 1;
          if (code & 1) diff += step >> 2;
          if (code & 8) diff = -diff;
          sample = Math.min(0x7fff, Math.max(-0x8000, sample + diff));
          data.setInt16(i_packet * outPacketSize + (1 + i_sample) * 2, sample, true);
          stepIndex = Math.min(88, Math.max(0, stepIndex + indexTable[code]));
        }
        this.flushSWFBits();
      }
    }
    return new Blob(parts, 'audio/x-wav');
  };

  SWFReader.Rect = SWFRect;
  SWFReader.Matrix = SWFMatrix;
  SWFReader.ColorTransform = SWFColorTransform;
  SWFReader.Path = SWFPath;
  SWFReader.Color = SWFColor;
  
  return SWFReader;

});
