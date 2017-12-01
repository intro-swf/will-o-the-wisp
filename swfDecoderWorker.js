
importScripts('ChunkReader.js');

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
      return input.gotUint16().then(function(len) {
        return input.readUint8Array(len);
      })
      .then(function(data) {
        return processChunk(typeCode, data);
      });
    });
  }
  function processChunk(typeCode, data) {
    switch (typeCode) {
      case TAG_END: return;
      default:
        console.log('unhandled tag: ' + typeCode, data);
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
    var frameBounds, framesPerSecond, frameCount;
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
      postMessage(JSON.stringify([['init', {
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

