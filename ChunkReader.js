
function ChunkReader() {
  this.chunks = [];
}
ChunkReader.prototype = {
  available: 0,
  readIndex: 0,
  readOffset: 0,
  append: function(chunk) {
    this.chunks.push(chunk);
    self.dispatchEvent(new CustomEvent('chunkupdate', {detail:this}));
  },
  whenAvailable: function(n) {
    if (this.available >= n) return Promise.resolve(this);
    var reader = this;
    return new Promise(function(resolve, reject) {
      self.addEventListener('chunkupdate', function onchunkupdate(e) {
        if (e.detail !== reader) return;
        if (reader.available >= n) {
          this.removeEventListener('chunkupdate', onchunkupdate);
          resolve(reader);
        }
      });
    });
  },
  byteCallback: function(n, callback) {
    function process(reader) {
      var chunk = reader.chunks[reader.readIndex];
      var offset = reader.readOffset;
      if (offset+n <= chunk.length) {
        var result;
        switch (n) {
          case 1:
            result = callback(chunk[offset]);
            break;
          case 2:
            result = callback(chunk[offset], chunk[offset+1]);
            break;
          case 4:
            result = callback(chunk[offset], chunk[offset+1], chunk[offset+2], chunk[offset+3]);
            break;
          default:
            result = callback.apply(null, chunk.subarray(offset, offset+n));
            break;
        }
        offset += n;
        reader.available -= n;
        if (offset === chunk.length) {
          reader.readIndex++;
          reader.readOffset = 0;
        }
        else {
          reader.readOffset = offset;
        }
        return result;
      }
      var array = [];
      while (array.length < n) {
        array.push(chunk[offset++]);
        while (offset === chunk.length) {
          offset = 0;
          chunk = reader.chunks[++reader.readIndex];
        }
      }
      reader.available -= n;
      reader.readOffset = offset;
      return callback.apply(null, array);
    }
    if (this.available >= n) {
      return Promise.resolve(process(this));
    }
    return this.whenAvailable(n).then(process);
  },
  gotUint8: function() {
    return this.byteCallback(1, function(byte) {
      return byte;
    });
  },
  gotInt8: function() {
    return this.byteCallback(1, function(byte) {
      return byte << 24 >> 24;
    });
  },
  gotUint16LE: function() {
    return this.byteCallback(2, function(lo, hi) {
      return (hi << 8) | lo;
    });
  },
  gotUint16BE: function() {
    return this.byteCallback(2, function(hi, lo) {
      return (hi << 8) | lo;
    });
  },
  gotInt16LE: function() {
    return this.byteCallback(2, function(lo, hi) {
      return (hi << 24 >> 16) | lo;
    });
  },
  gotInt16BE: function() {
    return this.byteCallback(2, function(hi, lo) {
      return (hi << 24 >> 16) | lo;
    });
  },
  gotUint32LE: function() {
    return this.byteCallback(4, function(lo, ml, mh, hi) {
      return ((hi << 24) | (mh << 16) | (ml << 8) | lo) >>> 0;
    });
  },
  gotUint32BE: function() {
    return this.byteCallback(4, function(hi, mh, ml, lo) {
      return ((hi << 24) | (mh << 16) | (ml << 8) | lo) >>> 0;
    });
  },
  gotInt32LE: function() {
    return this.byteCallback(4, function(lo, ml, mh, hi) {
      return (hi << 24) | (mh << 16) | (ml << 8) | lo;
    });
  },
  gotInt32BE: function() {
    return this.byteCallback(4, function(hi, mh, ml, lo) {
      return (hi << 24) | (mh << 16) | (ml << 8) | lo;
    });
  },
  gotUint8Array: function(n) {
    return this.whenAvailable(n).then(function(reader) {
      var i = reader.readIndex, offset = reader.readOffset;
      var chunk = reader.chunks[i];
      var endOffset = offset + n;
      if (endOffset > chunk.length) {
        var bytes = new Uint8Array(n);
        var offset = 0;
        chunk = chunk.subarray(offset);
        do {
          bytes.set(chunk, offset);
          chunk = reader.chunks[++i];
          offset = 0;
          if (chunk.length > n) {
            bytes.set(chunk.subarray(0, n), offset);
            offset += n;
            break;
          }
          n -= chunk.length;
          reader.available -= chunk.length;
        } while (n > 0);
        reader.readIndex = i;
        return bytes;
      }
      if (endOffset < chunk.byteLength) {
        reader.readOffset = endOffset;
        return chunk.subarray(offset, endOffset);
      }
      if ((offset + n) > reader.chunks[i].byteLength) {
        var bytes = new Uint8Array(n);
        var offset = 0;
        do {
          var reader = self.chunks.shift();
          bytes.set(offset, chunk);
          self.chunks.byteLength -= chunk.byteLength;
          offset += chunk.byteLength;
          n -= chunk.byteLength;
          if (self.chunks[0].byteLength > n) {
            bytes.set(self.chunks[0].subarray(0, n), offset);
            self.chunks[0] = self.chunks[0].subarray(n);
            break;
          }
        } while (n > 0);
        return bytes;
      }
      return self.chunks.shift();
    });
  },
  bitBuf: 0, bitBufSize: 0,
  flushBits: function() {
    this.bitBufSize = 0;
  },
  gotTopBits: function(n, signed) {
    if (n <= this.bitBufSize) {
      var value;
      if (signed) {
        value = this.bitBuf << (32-this.bitBufSize) >> (32-n);
      }
      else {
        value = this.bitBuf << (32-this.bitBufSize) >>> (32-n);
      }
      this.bitBufSize -= n;
      return Promise.resolve(value);
    }
    var reader = this;
    function pullByte(b) {
      reader.bitBuf = (reader.bitBuf << 8) | b;
      if ((reader.bitBufSize += 8) >= n) {
        var value;
        if (signed) {
          value = reader.bitBuf << (32-reader.bitBufSize) >> (32-n);
        }
        else {
          value = reader.bitBuf << (32-reader.bitBufSize) >>> (32-n);
        }
        reader.bitBufSize -= n;
        return value;
      }
      return reader.gotUint8().then(pullByte);
    }
    return this.gotUint8().then(pullByte);
  },
  fromURL: function(url) {
    var chunkReader = this;
    if ('Response' in self && 'body' in Response.prototype) {
      fetch(url).then(function(response) {
        var reader = response.body.getReader();
        function onchunk(chunk) {
          if (chunk.done) {
            //self.close();
            return;
          }
          chunkReader.append(chunk.value);
          reader.read().then(onchunk);
        }
        return reader.read().then(onchunk);
      });
    }
    else {
      var xhr = new XMLHttpRequest;
      xhr.open('GET', url, false);
      xhr.responseType = 'moz-chunked-arraybuffer';
      if (xhr.responseType === 'moz-chunked-arraybuffer') {
        xhr.onprogress = function(e) {
          chunkReader.append(new Uint8Array(this.response));
        };
        xhr.onload = function(e) {
          //self.close();
        };
      }
      else {
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(e) {
          chunkReader.append(new Uint8Array(this.response));
          //self.close();
        };
      }
      xhr.send();
    }      
  },
};
