define(function() {

  'use strict';
  
  function BinaryReader(source) {
    if (source instanceof ArrayBuffer) {
      this.bytes = new Uint8Array(source);
      this.dv = new DataView(source);
    }
    else if (ArrayBuffer.isView(source)) {
      this.bytes = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
      this.dv = new DataView(source.buffer, source.byteOffset, source.byteLength);
    }
    else {
      throw new Error('invalid source');
    }
  }
  BinaryReader.prototype = {
    offset: 0,
    littleEndian: false,
    get isAtEnd() {
      return this.offset >= this.source.length;
    },
    u8: function() {
      var v = this.source[this.offset++];
      if (typeof v !== 'number') {
        throw new Error('unexpected end of data');
      }
      return v;
    },
    expectU8: function(v) {
      var b = this.source[this.offset];
      if (v !== b) {
        v = '0x' + ('0' + v.toString(16)).slice(-2);
        if (b === undefined) {
          b = 'end of data';
        }
        else {
          b = '0x' + ('0' + v.toString(16)).slice(-2);
        }
        throw new Error('expected ' + v + ', got ' + b);
      }
      this.offset++;
      return this;
    },
    i8: function() {
      return this.u8() << 24 >> 24;
    },
    i16: function() {
      if (this.offset+2 > this.source.length) {
        throw new Error('unexpected end of data');
      }
      var v = this.dv.getInt16(this.offset, this.littleEndian);
      this.offset += 2;
      return v;
    },
    u16: function() {
      return this.i16() & 0xffff;
    },
    i32: function() {
      if (this.offset+4 > this.source.length) {
        throw new Error('unexpected end of data');
      }
      var v = this.dv.getInt32(this.offset, this.littleEndian);
      this.offset += 4;
      return v;
    },
    u32: function() {
      return this.i32() >>> 0;
    },
    f32: function() {
      if (this.offset+4 > this.source.length) {
        throw new Error('unexpected end of data');
      }
      var v = this.dv.getFloat32(this.offset, this.littleEndian);
      this.offset += 4;
      return v;
    },
    f64: function() {
      if (this.offset+8 > this.source.length) {
        throw new Error('unexpected end of data');
      }
      var v = this.dv.getFloat64(this.offset, this.littleEndian);
      this.offset += 8;
      return v;
    },
  };
  
  const BUFFER_SIZE = 32 * 1024;
  
  function BinaryWriter() {
    this.parts = []; // must contain Uint8Arrays
    this.buffer = new Uint8Array(BUFFER_SIZE);
    this.dv = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
  }
  BinaryWriter.prototype = {
    littleEndian: false,
    bufferPos: 0,
    get byteLength() {
      return this.parts.reduce(function(bytes, len) {
        return len + bytes.length;
      }, this.bufferPos);
    },
    toBlob: function() {
      return new Blob(this.parts);
    },
    toUint8Array: function() {
      if (this.parts.length === 0) {
        return this.buffer.subarray(0, this.bufferPos);
      }
      var buffer = new Uint8Array(this.byteLength);
      var offset = 0;
      for (var i = 0; i < this.parts.length; i++) {
        var part = this.parts[i];
        buffer.set(part, offset);
        offset += part.length;
      }
      buffer.set(this.buffer.subarray(0, this.bufferPos), offset);
      return buffer;
    },
    requireBuffer: function(byteLength) {
      var available = this.buffer.length - this.bufferPos;
      if (available >= byteLength) {
        return;
      }
      if (available === 0) {
        this.parts.push(this.buffer);
      }
      else if (this.bufferPos > 0) {
        this.parts.push(this.buffer.subarray(0, this.bufferPos));
      }
      this.buffer = new Uint8Array(Math.max(BUFFER_SIZE, byteLength));
      this.dv = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
      this.bufferPos = 0;
    },
    u8: function(v) {
      this.requireBuffer(1);
      this.buffer[this.bufferPos++] = v & 0xff;
      return this;
    },
    i16: function(v) {
      this.requireBuffer(2);
      this.dv.setInt16(this.bufferPos, v, this.littleEndian);
      this.bufferPos += 2;
      return this;
    },
    u16: function(v) {
      this.requireBuffer(2);
      this.dv.setUint16(this.bufferPos, v, this.littleEndian);
      this.bufferPos += 2;
      return this;
    },
    i32: function(v) {
      this.requireBuffer(4);
      this.dv.setInt32(this.bufferPos, v, this.littleEndian);
      this.bufferPos += 4;
      return this;
    },
    u32: function(v) {
      this.requireBuffer(4);
      this.dv.setUint32(this.bufferPos, v, this.littleEndian);
      this.bufferPos += 4;
      return this;
    },
    f32: function(v) {
      this.requireBuffer(4);
      this.dv.setFloat32(this.bufferPos, v, this.littleEndian);
      this.bufferPos += 4;
      return this;
    },
    f64: function(v) {
      this.requireBuffer(8);
      this.dv.setFloat64(this.bufferPos, v, this.littleEndian);
      this.bufferPos += 4;
      return this;
    },
    put: function(bytes) {
      if (this.bufferPos > 0) {
        if (this.bufferPos === this.buffer.length) {
          this.parts.push(this.buffer);
        }
        else {
          this.parts.push(this.buffer.subarray(0, this.bufferPos));
          this.buffer = this.buffer.subarray(this.bufferPos);
          this.dv = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
        }
        this.bufferPos = 0;
      }
      this.parts.push(bytes);
      return this;
    },
  };
  
  if ('TextEncoder' in self) {
    var utf8 = new TextEncoder('utf-8');
    BinaryWriter.utf8 = function(str) {
      return this.put(utf8.encode(str));
    };
  }
  else {
    BinaryWriter.utf8 = function(str) {
      for (var i = 0; i < str.length; i++) {
        var copo = str.codePointAt(i);
        if (copo < 0x80) {
          this.u8(copo);
        }
        else if (copo < 0x800) {
          this
            .u8((copo >>> 6) | 0xC0)
            .u8((copo & 0x3F) | 0x80);
        }
        else {
          this
            .u8((copo >>> 12) | 0xE0)
            .u8(((copo >>> 6) & 0x3F) | 0x80);
            .u8((copo & 0x3F) | 0x80);
        }
      }
      return this;
    };
  }
  
  const RX_NUM = new RegExp('^'
    + '([+-]?)' // 1: sign
    + '(?:'
      + '([0-9]+)((?:_[0-9]+)*)' // 2: dec int, 3: dec int separated
        + '(?:(\\.[0-9]+)((?:_[0-9]+)*))?' // 4: dec frac, 5: dec frac separated
        + '(?:(e[+-]?[0-9]+)((?:_[0-9]+)+)?)?' // 6: e, 7: e separated
      + '|'
      + '0x([0-9a-f]+)((?:_[0-9a-f]+)*)' // 8: hex int, 9: hex int separated
        + '(?:(\\.[0-9a-f]+)((?:_[0-9a-f]+)*))?' // 10: hex frac, 11: hex frac separated
        + '(?:(p[+-]?[0-9]+)((?:_[0-9]+)*))?' // 12: p, 13: p int separated
      + '|'
        + '(inf|nan(?::0x([0-9a-f]+(?:_[0-9a-f]+)*))?)' // 14: inf/nan/nan:0x(hex) 15: (hex)
    + ')'
    + '$', 'i');
  
  function SymbolReader(source) {
    this.source = source;
    this.matcher = /[ \n\r\t]+|;;[^\r\n*]|\(;?|\)|"(?:[^"\\]+|\\.)*"|'(?:[^'\\]+|\\.)*'|[^;"\s\(\)]+|$/g;
  }
  SymbolReader.prototype = {
    value: null,
    listDepth: 0,
    nextRaw: function() {
      var index = this.matcher.lastIndex;
      var match = this.matcher.exec(this.source);
      if (match.index !== index) {
        throw new Error('invalid content');
      }
      switch (match[0][0]) {
        case '\t': case ' ': case '\n': case '\r':
          this.value = match[0];
          return this.mode = 'whitespace';
        case ';':
          this.value = match[0];
          return this.mode = 'comment';
        case '(':
          if (match[0] === '(;') {
            var commentStart = match.index;
            var commentDepth = 1;
            var commentMatcher = /\(;|;\)/g;
            commentMatcher.lastIndex = this.matcher.lastIndex;
            var commentMatch;
            while (commentMatch = commentMatcher.exec(this.source)) {
              if (commentMatch[0] === '(;') {
                commentDepth++;
              }
              else {
                if (--commentDepth < 1) break;
              }
            }
            if (commentDepth > 0) {
              throw new Error('unterminated comment');
            }
            var commentEnd = this.matcher.lastIndex = commentMatcher.lastIndex;
            this.value = this.source.slice(commentStart, commentEnd);
            return this.mode = 'comment';
          }
          this.listDepth++;
          return this.mode = 'open';
        case ')':
          if (--this.listDepth < 0) {
            throw new Error('unbalanced list');
          }
          return this.mode = 'close';
        case '"': case "'":
          this.value = (match[2] || match[3]).replace(
            /\\(?:u\{([a-fA-F0-9]+)\}|([a-fA-F0-9]{1,2})|[\\tnr"'])?/g,
            function(escape, hex1, hex2) {
              switch (escape) {
                case '\\\\': return = '\\';
                case '\\t': return '\t';
                case '\\r': return '\r';
                case '\\"': return '"';
                case "\\'": return "'";
                default:
                  var hex = hex1 || hex2;
                  if (hex) {
                    return String.fromCodePoint(parseInt(hex, 16));
                  }
                  throw new Error('invalid escape');
              }
           });
          return this.mode = 'string';
        case void '$': // undefined = end of content reached
          if (this.listDepth !== 0) {
            throw new Error('unbalanced list');
          }
          return this.mode = 'end';
        default:
          var numMatch = match[0].match(RX_NUM);
          if (numMatch) {
            if (numMatch[2]) {
              // decimal
              var intPart = numMatch[1] + numMatch[2];
              if (numMatch[3]) intPart += numMatch[3].replace(/_/g, '');
              var fracPart = numMatch[4] || '';
              if (numMatch[5]) fracPart += numMatch[5].replace(/_/g, '');
              var ePart = numMatch[6] || '';
              if (numMatch[7]) ePart += numMatch[7].replace(/_/g, '');
              if (fracPart || ePart) {
                this.value = parseFloat(intPart + fracPart + ePart);
                return this.mode = 'float';
              }
              else {
                this.value = parseInt(intPart);
                return this.mode = 'int';
              }
            }
            else if (numMatch[8]) {
              // hexadecimal
              var intPart = numMatch[1] + numMatch[8];
              if (numMatch[9]) intPart += numMatch[9].replace(/_/g, '');
              var fracPart = numMatch[10] || '';
              if (numMatch[11]) fracPart += numMatch[11].replace(/_/g, '');
              var pPart = numMatch[12] || '';
              if (numMatch[13]) pPart += numMatch[13].replace(/_/g, '');
              if (fracPart || pPart) {
                if (fracPart) {
                  fracPart = fracPart.slice(1);
                  intPart += fracPart;
                }
                if (pPart) {
                  pPart = parseInt(pPart.slice(1));
                }
                else {
                  pPart = 0;
                }
                pPart -= fracPart.length * 4;
                if (pPart < 0) {
                  this.value = parseInt(intPart, 16) / (1 << -pPart);
                }
                else {
                  this.value = parseInt(intPart, 16) << pPart;
                }
                return this.mode = 'float';
              }
              else {
                this.value = parseInt(intPart, 16);
                return this.mode = 'int';
              }
            }
            else if (numMatch[14] === 'inf') {
              this.value = numMatch[1] === '-' ? -Infinity : Infinity;
              return this.mode = 'float';
            }
            else if (numMatch[15]) {
              this.value = numMatch[15].replace(/_/g, '').toUpperCase();
              return this.mode = 'nan-hex';
            }
            else {
              this.value = NaN;
              return this.mode = 'float';
            }
          }
          this.value = match[0];
          return this.mode = 'symbol';
      }
    },
    skip: function() {
      var mode = this.nextRaw();
      while (mode === 'comment' || mode === 'whitespace') {
        mode = this.nextRaw();
      }
      return mode;
    },
    expect: function(expectedType) {
      var mode = this.skip();
      if (mode !== expectedType) {
        throw new Error('expected ' + expectedType + ', got ' + mode);
      }
      return this.value;
    },
  };
  
  function SymbolWriter() {
    this.parts = [];
  }
  SymbolWriter.prototype = {
    encodeString: function(val) {
      // & < > included for XML ease
      val = val.replace(/[\x00-\x1F\\&<>]/g, function(v) {
        switch (v) {
          case '\t': return '\\t';
          case '\r': return '\\r';
          case '\\': return '\\\\';
          case '\n': return '\\n';
          default: return '\\' + ('0' + v.charCodeAt(0).toString(16)).slice(-2).toUpperCase();
        }
      });
      if (val.indexOf('"') === -1) return '"' + val + '"';
      if (val.indexOf("'") === -1) return "'" + val + "'";
      return '"' + val.replace('"', '\\"') + '"';
    },
    string: function(val) {
      this.parts.push(this.encodeString(val));
      return this;
    },
    toString: function() {
      return this.parts.join('');
    },
    int: function(v) {
      this.parts.push(v.toString());
      return this;
    },
    float: function(v) {
      v = v.toString();
      if (!/[\.e]/i.test(v)) v += '.0';
      this.parts.push(v);
      return this;
    },
    symbol: function(v) {
      this.parts.push(v);
      return this;
    },
    open: function() {
      this.parts.push('(');
      return this;
    },
    close: function() {
      this.parts.push(')');
      return this;
    },
  };
  
  function Op() {
    this.binaryReaders = [];
    this.binaryWriters = [];
    this.symbolReaders = [];
    this.symbolWriters = [];
    this.stackTopBefore = [];
    this.stackTopAfter = [];
  }
  Op.prototype = {
    binaryReader: function(fn) {
      this.binaryReaders.push(fn);
      return this;
    },
    binaryWriter: function(fn) {
      this.binaryWriters.push(fn);
      return this;
    },
    symbolReader: function(fn) {
      this.symbolReaders.push(fn);
      return this;
    },
    symbolWriter: function(fn) {
      this.symbolWriters.push(fn);
      return this;
    },
    u8: function(v) {
      if (typeof v === 'number') {
        return this
        .binaryReader(function(bin) {
          bin.expectU8(v);
        })
        .binaryWriter(function(bout) {
          bout.u8(v);
        });
      }
      this
      .binaryReader(function(bin) {
        this[v] = bin.u8();
      })
      .binaryWriter(function(bout) {
        bout.u8(this[v]);
      });
      var match = v.match(/^(?:\((.*)\)|(.*?)=)$/);
      if (match) {
        if (match[1]) {
          v = match[1];
          this
          .symbolReader(function(sin) {
            sin.expectOpen(v);
            this[v] = sin.expectInt();
            sin.expectClose();
          })
          .symbolWriter(function(sout) {
            sout.open(v).int(this[v]).close();
          });
        }
        else {
          v = match[2];
          this
          .symbolReader(function(sin) {
            this[v] = sin.expectSymbolAfterPrefix(v+'=');
          })
          .symbolWriter(function(sout) {
            sout.symbol(v+'='+this[v]);
          });
        }
      }
      else {
        this
        .symbolReader(function(sin) {
          this[v] = sin.expectInt();
        })
        .symbolWriter(function(sout) {
          sout.int(this[v]);
        });
      }
      return this;
    },
    pop: function() {
      if (arguments.length === 1 && typeof arguments[0] === 'number') {
        for (var count = arguments[0]; count > 0; count--) {
          this.stackTopBefore.push('*');
        }
      }
      else {
        [].push.apply(this.stackTopBefore, arguments);
      }
      return this;
    },
    push: function() {
      if (arguments.length === 1 && typeof arguments[0] === 'number') {
        for (var count = arguments[0]; count > 0; count--) {
          this.stackTopAfter.push('*');
        }
      }
      else {
        [].push.apply(this.stackTopAfter, arguments);
      }
      return this;
    },
    symbol: function(symbol) {
      return this
      .symbolReader(function(sin) {
        sin.expectSymbol(symbol);
      })
      .symbolWriter(function(sout) {
        sout.symbol(symbol);
      });
    },
  };
  
  return {
    BinaryReader: BinaryReader,
    BinaryWriter: BinaryWriter,
    SymbolReader: SymbolReader,
    SymbolWriter: SymbolWriter,
    Op: Op,
  };

});
