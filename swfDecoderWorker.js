
importScripts('require.js');

require([
  'dataExtensions'
  ,'ChunkReader'
  ,'MakeshiftXML'
  ,'SWFShape'
],
function(
  dataExtensions
  ,ChunkReader
  ,MakeshiftXML
  ,SWFShape
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
    var sounds = {};
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
          var bounds = data.readSWFRect();
          var shape = new SWFShape;
          shape.hasStyles = true;
          if (typeCode >= TAG_DEFINE_SHAPE_2) shape.hasExtendedLength = true;
          shape.readFrom(data);
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
            var classes = ['class'];
            if (flags & 1) classes.push('up');
            if (flags & 2) classes.push('over');
            if (flags & 4) classes.push('down');
            if (flags & 8) classes.push('hit-test');
            insertion.push(classes);
            def.push(insertion);
          }
          def.push(['on', ['t', 'overdown', 'overup'], data.readSWFActions()]);
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
          nextFrame.updates.push(['d', depth]);
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
        default: throw new Error('unknown action code ' + code);
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
  
  self.postMessage('[["ready"]]');
  
});
