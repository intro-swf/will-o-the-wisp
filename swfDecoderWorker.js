
importScripts('ChunkReader.js');

function readSWF(input) {
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
      return input.getUint16LE();
    })
    .then(function(count) {
      frameCount = count;
      postMessage(JSON.stringify([['init', {
        v: version,
        bounds: frameBounds.toString(),
        count: frameCount,
        rate: framesPerSecond,
      }]]));
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

