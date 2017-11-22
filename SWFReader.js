define(function() {

  'use strict';
  
  const NULLFUNC = function(){};
  
  const TAG_END = 0
    ,TAG_SHOW_FRAME = 1
    ,TAG_DEFINE_SHAPE = 2
      ,TAG_DEFINE_SHAPE_2 = 22
      ,TAG_DEFINE_SHAPE_3 = 32
    ,TAG_PLACE_OBJECT = 4
      ,TAG_PLACE_OBJECT_2 = 26
    ,TAG_REMOVE_OBJECT = 5
      ,TAG_REMOVE_OBJECT_2 = 28
    ,TAG_DEFINE_BITS = 6
    ,TAG_DEFINE_BUTTON = 7
      ,TAG_DEFINE_BUTTON_2 = 34
    ,TAG_JPEG_TABLES = 8
    ,TAG_SET_BACKGROUND_COLOR = 9
    ,TAG_DEFINE_FONT = 10
      ,TAG_DEFINE_FONT_2 = 48
    ,TAG_DEFINE_TEXT = 11
      ,TAG_DEFINE_TEXT_2 = 33
    ,TAG_DO_ACTION = 12
    ,TAG_DEFINE_FONT_INFO = 13
    ,TAG_DEFINE_SOUND = 14
    ,TAG_PLAY_SOUND = 15
    ,TAG_DEFINE_BUTTON_SOUND = 17
    ,TAG_SOUND_STREAM_HEAD = 18
      ,TAG_SOUND_STREAM_HEAD_2 = 45
    ,TAG_SOUND_STREAM_BLOCK = 19
    ,TAG_PROTECT = 24
    ,TAG_DEFINE_EDIT_TEXT = 37
    ,TAG_DEFINE_SPRITE = 39
    ,TAG_FRAME_LABEL = 43
    ,TAG_DEFINE_MORPH_SHAPE = 46
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
    // onupdate(id <int>, type <string>, def <Object>)
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
    
    read: function(source) {
      // TODO: support Blob/URL sources?
      if (!(source instanceof Uint8Array)) {
        throw new TypeError('source must be byte array');
      }
      try {
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
            this.onrawchunk(source.readSubarray(this.chunkLength));
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
    
    onrawfileheader: function(source) {
      switch (source.readByteString(3)) {
        case 'FWS': this.compressed = false; break;
        case 'CWS': this.compressed = true; break;
        default: throw new Error('invalid file header');
      }
      this.version = source.readUint8();
      this.uncompressedFileSize = source.readUint32LE();
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
        case TAG_DEFINE_SHAPE:
        case TAG_DEFINE_SHAPE_2:
        case TAG_DEFINE_SHAPE_3:
          var id = source.readUint16LE();
          var shape = {};
          shape.bounds = source.readSWFRect();
          const EXTENDED_LENGTH = chunkType >= TAG_DEFINE_SHAPE_2;
          const NO_ALPHA = chunkType < TAG_DEFINE_SHAPE_3;
          shape.fillStyles = source.readSWFFillStyles(EXTENDED_LENGTH, NO_ALPHA);
          shape.strokeStyles = source.readSWFStrokeStyles(EXTENDED_LENGTH, NO_ALPHA);
          shape.path = source.readSWFPath(EXTENDED_LENGTH, NO_ALPHA);
          source.warnIfMore();
          this.ondefine(id, 'shape', shape);
          break;
        case TAG_DEFINE_MORPH_SHAPE:
          var id = source.readUint16LE();
          var fromShape = {fillStyles:[], strokeStyles:[]};
          var toShape = {fillStyles:[], strokeStyles:[]};
          fromShape.bounds = source.readSWFRect();
          toShape.bounds = source.readSWFRect();
          var endPathOffset = source.offset + source.readUint32LE();
          if (endPathOffset === source.offset) {
            endPathOffset = source.length;
          }
          var fillStyles = source.readSWFFillStyles(true, false, true);
          for (var i = 0; i < fillStyles.length; i++) {
            fromShape.fillStyles.push(fillStyles[i][0]);
            toShape.fillStyles.push(fillStyles[i][1]);
          }
          var strokeStyles = source.readSWFStrokeStyles(true, false, true);
          for (var i = 0; i < strokeStyles.length; i++) {
            fromShape.strokeStyles.push(strokeStyles[i][0]);
            toShape.strokeStyles.push(strokeStyles[i][1]);
          }
          fromShape.path = source.readSWFPath(true, false);
          toShape.path = source.readSWFPath(true, false);
          this.ondefine(id, 'morph', fromShape, toShape);
          break;
        case TAG_DEFINE_BITS:
          var id = source.readUint16LE();
          var file = new Blob([source.subarray(source.offset)], {type:'image/jpeg; encoding-tables=no'});
          this.ondefine(id, 'bitmap', file);
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
          this.onupdate(id, 'font', font);
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
            glyphs[i] = source.readSWFPath(true, true);
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
        case TAG_DEFINE_TEXT:
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
                segment.color = source.readSWFColor(true);
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
          if (sound.format === 'mp3') {
            sound.seekSamples = source.readUint16LE();
          }
          sound.data = source.subarray(source.offset);
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
          this.onupdate(buttonID, 'button', button);
          break;
        case TAG_PROTECT:
          this.passwordMD5 = source.length ? source.readByteString(source.length) : null;
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
            throw new Error('NYI: Clip Actions');
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
            frameLoop: for (;;) switch (this.onrawtag(source)) {
              case TAG_END:
                throw new Error(
                'sprite '+this.spriteID+': not enough frames'
                + ' (expected '+this.spriteFrameCount+', found '+j+')');
              case TAG_SHOW_FRAME:
                this.onrawchunk(source.readSubarray(this.chunkLength));
                break frameLoop;
              case TAG_PLACE_OBJECT:
              case TAG_PLACE_OBJECT_2:
              case TAG_REMOVE_OBJECT:
              case TAG_REMOVE_OBJECT_2:
              case TAG_DO_ACTION:
              case TAG_PLAY_SOUND:
              case TAG_FRAME_LABEL:
                this.onrawchunk(source.readSubarray(this.chunkLength));
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
                this.onrawstreamchunk(source.readSubarray(this.chunkLength), this.sampleStream);
                continue frameLoop;
              default:
                throw new Error(
                'sprite '+this.spriteID+': invalid sprite chunk type ('+this.chunkType+')');
            }
            this.onclosespriteframe();
          }
          endLoop: for (;;) switch (this.onrawtag(source)) {
            case TAG_END:
              this.onrawchunk(source.readSubarray(this.chunkLength));
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
    offset: 0,
    readSubarray: function(n) {
      var sub = this.subarray(this.offset, this.offset + n);
      this.offset += n;
      return sub;
    },
    readUint8: function() {
      return this[this.offset++];
    },
    readInt8: function() {
      return this[this.offset++] << 24 >> 24;
    },
    readUint16LE: function() {
      var o = this.offset;
      var v = this[o] | (this[o+1] << 8);
      this.offset += 2;
      return v;
    },
    readInt16LE: function() {
      var o = this.offset;
      var v = this[o] | (this[o+1] << 24 >> 16);
      this.offset += 2;
      return v;
    },
    readInt32LE: function() {
      var o = this.offset;
      var v = this[o] | (this[o+1] << 8) | (this[o+2] << 16) | (this[o+3] << 24);
      this.offset += 4;
      return v;
    },
    readUint32LE: function() {
      var o = this.offset;
      var v = this[o] | (this[o+1] << 8) | (this[o+2] << 16) | (this[o+3] << 24);
      this.offset += 4;
      return v >>> 0;
    },
    readByteString: function(n) {
      if (n === '\0') {
        var endOffset = this.offset;
        while (this[endOffset]) endOffset++;
        var v = String.fromCharCode.apply(null, this.subarray(this.offset, endOffset));
        this.offset = endOffset + 1;
        return v;
      }
      var v = String.fromCharCode.apply(null, this.subarray(this.offset, this.offset + n));
      this.offset += n;
      return v;
    },
    readUTF16LE: function(n) {
      var str = '';
      for (var i = 0; i < n; i++) {
        str += String.fromCodePoint(this.readUint16LE());
      }
      return str;
    },
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
        return makeCSSColor(r,g,b,255);
      }
      var a = this[o+3];
      this.offset = o+4;
      return makeCSSColor(r,g,b,a);
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
      var count = this.readUint8();
      if (count === 0 || count > 8) {
        throw new Error('illegal number of gradient points');
      }
      if (PAIRS) count *= 2;
      var points = new Array(count);
      for (var i = 0; i < points.length; i++) {
        var stop = points[i] = {ratio: percentFromByte(this.readUint8())};
        stop.color = this.readSWFColor(NO_ALPHA);
      }
      return points;
    },
    readSWFFillStyles: function(EXTENDED_LENGTH, NO_ALPHA, PAIRS) {
      var count = this.readUint8();
      if (count === 0xff && EXTENDED_LENGTH) {
        count = this.readUint16LE();
      }
      var fillStyles = new Array(count+1);
      fillStyles[0] = PAIRS ? ['none', 'none'] : 'none';
      var fillStyle;
      for (var i = 1; i < fillStyles.length; i++) {
        switch (fillStyle = this.readUint8()) {
          case 0x00:
            if (PAIRS) {
              var a = this.readSWFColor(NO_ALPHA);
              var b = this.readSWFColor(NO_ALPHA);
              fillStyles[i] = [a, b];
            }
            else {
              fillStyles[i] = this.readSWFColor(NO_ALPHA);
            }
            break;
          case 0x10:
          case 0x12:
            var mode = (fillStyle === 0x10) ? 'linear' : 'radial';
            if (PAIRS) {
              var a = {type:'gradient', mode:mode, stops:[]};
              var b = {type:'gradient', mode:mode, stops:[]};
              a.matrix = this.readSWFMatrix();
              b.matrix = this.readSWFMatrix();
              var stops = this.readSWFGradientStops(NO_ALPHA, true);
              while (stops.length > 0) {
                a.stops.push(stops.shift());
                b.stops.push(stops.shift());
              }
              fillStyles[i] = [a, b];
            }
            else {
              var matrix = this.readSWFMatrix();
              var stops = this.readSWFGradientStops(NO_ALPHA);
              fillStyles[i] = {
                type: 'gradient',
                mode: mode,
                matrix: matrix,
                stops: stops,
              };
            }
            break;
          case 0x40:
          case 0x41:
            var bitmapID = this.readUint16LE();
            var mode = (fillStyle === 0x40) ? 'tiled' : 'clipped';
            if (PAIRS) {
              var a = {
                type: 'bitmap',
                mode: mode,
                matrix: this.readSWFMatrix(),
                bitmapID: bitmapID,
              };
              var b = {
                type: 'bitmap',
                mode: mode,
                matrix: this.readSWFMatrix(),
                bitmapID: bitmapID,
              };
              fillStyles[i] = [a, b];
            }
            else {
              fillStyles[i] = {
                type: 'bitmap',
                mode: mode,
                matrix: this.readSWFMatrix(),
                bitmapID: bitmapID,
              };
            }
            break;
          default:
            throw new Error('unknown fill mode');
        }
      }
      return fillStyles;
    },
    readSWFStrokeStyles: function(EXTENDED_LENGTH, NO_ALPHA, PAIRS) {
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
        var color = this.readSWFColor(NO_ALPHA);
        strokeStyles[i] = {width:width, color:color};
      }
      return strokeStyles;
    },
    readSWFPath: function(EXTENDED_LENGTH, NO_ALPHA) {
      var fillIndexBits = this.readSWFBits(4, false);
      var lineIndexBits = this.readSWFBits(4, false);
      var currentX = 0, currentY = 0;
      var segments = [], segment, i_fill = 0, i_fill2 = 0, i_stroke = 0;
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
              segment.push({type:'l', values:[x, y]});
              currentX += x;
              currentY += y;
            }
            else {
              if (this.readSWFBits(1, false)) {
                var v = this.readSWFBits(coordBits, true);
                segment.push({type:'v', values:[v]});
                currentY += v;
              }
              else {
                var h = this.readSWFBits(coordBits, true);
                segment.push({type:'h', values:[h]});
                currentX += h;
              }
            }
          }
          else {
            // curved edge
            var coordBits = 2 + this.readSWFBits(4, false);
            var controlX = this.readSWFBits(coordBits, true);
            var controlY = this.readSWFBits(coordBits, true);
            var anchorX = this.readSWFBits(coordBits, true);
            var anchorY = this.readSWFBits(coordBits, true);
            segment.push({type:'q', values:[controlX,controlY, anchorX,anchorY]});
            currentX += anchorX;
            currentY += anchorY;
          }
        }
        else {
          // not edge record flag
          var flags = this.readSWFBits(5, false);
          if (flags === 0) break; // end of shape data
          if (flags & 1) {
            // move-to flag
            var coordBitCount = this.readSWFBits(5, false);
            currentX += this.readSWFBits(coordBitCount, true);
            currentY += this.readSWFBits(coordBitCount, true);
          }
          segments.push(segment = [{type:'M', values:[currentX, currentY]}]);
          if (flags & 2) {
            i_fill2 = segment.i_fill2 = this.readSWFBits(fillIndexBits, false);
          }
          else segment.i_fill2 = i_fill2;
          if (flags & 4) {
            i_fill = segment.i_fill = this.readSWFBits(fillIndexBits, false);
          }
          else segment.i_fill = i_fill;
          if (flags & 8) {
            i_stroke = segment.i_stroke = this.readSWFBits(lineIndexBits, false);
          }
          else segment.i_stroke = i_stroke;
          if (flags & 0x10) {
            this.flushSWFBits();
            segment.fillStyles = this.readSWFFillStyles(EXTENDED_LENGTH, NO_ALPHA);
            segment.strokeStyles = this.readSWFStrokeStyles(EXTENDED_LENGTH, NO_ALPHA);
            fillIndexBits = this.readSWFBits(4, false);
            lineIndexBits = this.readSWFBits(4, false);
            currentX = currentY = 0;
          }
        }
      }
      this.flushSWFBits();
      return segments;
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
      if (playback.format !== 'pcm') {
        console.warn('invalid playback format specified: ' + playback.format);
      }
      else {
        delete playback.format;
        delete playback.endianness;
      }
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
  
  function makeCSSColor(r,g,b,a) {
    if (a !== 255) {
      if (a === 0 && r === 0 && g === 0 && b === 0) {
        return 'transparent';
      }
      return ('rgba('
        + r + ',' + g + ',' + b
        + ', ' + percentFromByte(a)
        + ')');
    }
    if ((r>>4)==(r&15)&&(g>>4)==(g&15)&&(b>>4)==(b&15)) {
      return '#'
        + (r&15).toString(16)
        + (g&15).toString(16)
        + (b&15).toString(16);
    }
    var rgb = (r << 16) | (g << 8) | b;
    return '#' + ('0000000' + rgb.toString(16)).slice(-6);
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
          this.multiplyR, 0, 0, 0, this.addR / 255,
          0, this.multiplyG, 0, 0, this.addG / 255,
          0, 0, this.multiplyB, 0, this.addB / 255,
          0, 0, 0, this.multiplyA, this.addA / 255,
        ].join(' ');
    },
  };
  
  SWFReader.Rect = SWFRect;
  SWFReader.Matrix = SWFMatrix;
  SWFReader.ColorTransform = SWFColorTransform;
  
  return SWFReader;

});
