
importScripts('require.js');

require([
  'dataExtensions'
  ,'ChunkReader'
  ,'MakeshiftXML'
],
function(
  dataExtensions
  ,ChunkReader
  ,MakeshiftXML
) {
  
  'use strict';
  
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

  function readSWF(input) {
    var frameCount;
    var displayObjects = {};
    var nextUpdates = [];
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
        case TAG_DEFINE_SHAPE:
        case TAG_DEFINE_SHAPE_2:
          var svg = new MakeshiftXML('svg', {xmlns:'http://www.w3.org/2000/svg'});
          var id = data.readUint16LE();
          var g = svg.open('g', {id:'shape'+id});
          g.empty('path', {d:'m0,0h50v50h-50v-50'});
          var url = URL.createObjectURL(svg.toBlob({type:'image/svg+xml'}))+'#shape'+id;
          displayObjects[id] = url;
          break;
        case TAG_DEFINE_TEXT:
          var svg = new MakeshiftXML('svg', {xmlns:'http://www.w3.org/2000/svg'});
          var id = data.readUint16LE();
          var g = svg.open('g', {id:'text'+id});
          g.open('text').text('hello');
          var url = URL.createObjectURL(svg.toBlob({type:'image/svg+xml'}))+'#text'+id;
          displayObjects[id] = url;          
          break;
        case TAG_DEFINE_BUTTON:
          var id = data.readUint16LE();
          var def = ['btn', '#button' + id];
          for (;;) {
            var flags = data.readUint8();
            if (flags === 0) break;
            var characterID = data.readUint16LE();
            var depth = data.readUint16LE();
            var matrix = data.readSWFMatrix();
            // no color transform until DefineButton2
            var insertion = ['i', depth + characterID/65536, displayObjects[characterID]];
            if (!matrix.isIdentity) insertion.push(['transform', matrix.toString()]);
            def.push(insertion);
          }
          def.push(data.readSWFActions());
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
          break;
        case TAG_REMOVE_OBJECT:
          var characterID = data.readUint16LE();
          var depth = data.readUint16LE() + characterID/65536;
          nextFrame.updates.push(['r', depth]);
          break;
        case TAG_DO_ACTION:
          nextFrame.updates.push(data.readSWFActions());
          break;
        case TAG_SHOW_FRAME:
          showFrame();
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
      var version = bytes[3];
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
          v: version,
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
        matrix.b = this.readTopBits(rotSkewBits, true);
        matrix.c = this.readTopBits(rotSkewBits, true);
      }
      var translateBits = this.readTopBits(5, false);
      if (translateBits) {
        matrix.e = this.readTopBits(translateBits, true);
        matrix.f = this.readTopBits(translateBits, true);
      }
      this.flushBits();
      return matrix;
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
      this.flushSWFBits();
      return transform;
    },
    readSWFActions: function() {
      var actions = ['do'];
      var code;
      while (code = this.readUint8()) {
        var data = code & 0x80 ? this.readSubarray(this.readUint16LE()) : null;
        switch (code) {
          case 0x81: actions.push(['GotoFrame', data.readUint16LE()]); break;
          case 0x83:
            var url = data.readByteString('\0');
            var target = data.readByteString('\0');
            actions.push(['GetURL', url, target]);
            break;
          case 0x04: actions.push('NextFrame'); break;
          case 0x05: actions.push('PreviousFrame'); break;
          case 0x06: actions.push('Play'); break;
          case 0x07: actions.push('Stop'); break;
          case 0x08: actions.push('ToggleQuality'); break;
          case 0x09: actions.push('StopSounds'); break;
          case 0x8A:
            var ifFrameNotReady = data.readUint16LE();
            var thenSkipActions = data.readUint8();
            actions.push(['WaitForFrame', ifFrameNotReady, thenSkipActions]);
            break;
          case 0x8B:
            actions.push(['SetTarget', data.readByteString('\0')]);
            break;
          case 0x8C:
            actions.push(['GotoLabel', data.readByteString('\0')]);
            break;
        }
        if (data) data.warnIfMore();
      }
      return actions;
    },
  });

  function SWFRect() {
  }
  SWFRect.prototype = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    get width() { return this.right - this.left; },
    get height() { return this.bottom - this.top; },
    isEqualTo: function(r) {
      if (this === r) return true;
      return this.left === r.left && this.top === r.top
          && this.right === r.right && this.bottom === r.bottom;
    },
    toString: function() {
      return [this.left, this.top, this.right, this.bottom].join(' ');
    },
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
      return this.a === 1 && this.b === 0 && this.c === 0
          && this.d === 1 && this.e === 0 && this.f === 0;
    },
    isEqualTo: function(m) {
      if (this === m) return true;
      return this.a === m.a && this.b === m.b && this.c === m.c
          && this.d === m.d && this.e === m.e && this.f === m.f;
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
  
  self.postMessage('[["ready"]]');
  
});
