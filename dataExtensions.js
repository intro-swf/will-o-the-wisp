define('dataExtensions', function() {

  'use strict';
  
  const BUF = new ArrayBuffer(4);
  const U32_BUF = new Uint32Array(BUF);
  const F32_BUF = new Float32Array(BUF);
  
  const CRC_TABLE = (function(table) {
    for (var i = 0; i < table.length; i++) {
      var c = i;
      for (var k = 0; k < 8; k++) {
        c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  })(new Uint32Array(256));
  
  Object.assign(Uint8Array.prototype, {
    offset: 0,
    getCRC32: function(crc) {
      crc = isNaN(crc) ? ~0 : ~crc;
      for (var n = 0; n < this.length; n++) {
        crc = CRC_TABLE[(crc ^ this[n]) & 0xff] ^ (crc >>> 8);
      }
      return ~crc;
    },
    getAdler32: function() {
      var a = 1, b = 0;
      for (var i = 0; i < this.length; i++) {
          a = (a + this[i]) % 65521;
          b = (b + a) % 65521;
      }
      return (b << 16) | a;
    },
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
    readUint16BE: function() {
      var o = this.offset;
      var v = (this[o] << 8) | this[o+1];
      this.offset += 2;
      return v;
    },
    readInt16BE: function() {
      var o = this.offset;
      var v = (this[o] << 8) | this[o+1];
      this.offset += 2;
      return v << 16 >> 16;
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
    readUint32BE: function() {
      var o = this.offset;
      var v = this[o+3] | (this[o+2] << 8) | (this[o+1] << 16) | (this[o] << 24);
      this.offset += 4;
      return v >>> 0;
    },
    readFloat32LE: function() {
      U32_BUF[0] = this.readUint32LE();
      return F32_BUF[0];
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
    warnIfMore: function(msg) {
      if (this.offset < this.length) {
        console.warn(msg || 'unexpected data');
      }
    },
    bitBuf: 0,
    bitBufSize: 0,
    flushBits: function() {
      this.bitBufSize = 0;
    },
    readTopBits: function(n, signed) {
      if (n === 0) return 0;
      while (this.bitBufSize < n) {
        this.bitBuf = (this.bitBuf << 8) | this[this.offset++];
        this.bitBufSize += 8;
      }
      var value;
      if (signed) {
        value = this.bitBuf << (32-this.bitBufSize) >> (32-n);
      }
      else {
        value = this.bitBuf << (32-this.bitBufSize) >>> (32-n);
      }
      this.bitBufSize -= n;
      return value;
    },
  });
  
  var lib = {
    load: function(name, parentRequire, onload, config) {
      onload(lib);
    },
  };
  
  return lib;

});
