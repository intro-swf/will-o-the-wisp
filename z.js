
define('CodeTableView', function() {

  'use strict';
  
  function CodeTableView(mode, bitWidth, lens) {
    switch(mode) {
      case 'lens':
        this.bits = new Uint8Array(CodeTableView.ENOUGH_LENS);
        this.op = new Uint8Array(CodeTableView.ENOUGH_LENS);
        this.val = new Uint16Array(CodeTableView.ENOUGH_LENS);
        break;
      case 'dists':
        this.bits = new Uint8Array(CodeTableView.ENOUGH_DISTS);
        this.op = new Uint8Array(CodeTableView.ENOUGH_DISTS);
        this.val = new Uint16Array(CodeTableView.ENOUGH_DISTS);
        break;
      case 'codes':
        this.bits = new Uint8Array(1 << bitWidth);
        this.op = new Uint8Array(1 << bitWidth);
        this.val = new Uint16Array(1 << bitWidth);
        break;
      default: throw new Error('unknown mode');
    }

    var count = new Uint16Array(16 /*MAXBITS+1*/); // number of codes of each length
    for (var sym = 0; sym < lens.length; sym++) {
      count[lens[sym]]++;
    }
    
    // bound code lengths, force root to be within code lengths
    var root = bitWidth;
    var max;
    for (max = 15 /* MAXBITS */; max >= 1; max--) {
      if (count[max] > 0) break;
    }
    if (root > max) root = max;
    if (max === 0) {
      /* no symbols to code at all */
      this.op[0] = this.op[1] = 64; // invalid code number
      this.bits[0] = this.bits[1] = 1;
      this.val[0] = this.val[1] = 0;
      this.bitWidth = 1;
      return; // no symbols, but wait for decoding to report error
    }
    var min;
    for (min = 1; min < max; min++) {
      if (count[min] !== 0) break;
    }
    if (root < min) root = min;
    
    this.bitWidth = root;
    
    /* check for an over-subscribed or incomplete set of lengths */
    var left = 1;
    for (var len = 1; len <= 15 /* MAXBITS */; len++) {
      left <<= 1;
      left -= count[len];
      if (left < 0) throw new Error('over-subscribed');
    }
    if (left > 0 && (mode == 'codes' || max !== 1)) {
      throw new Error('incomplete set');
    }
    
    // generate offsets into symbol table for each length for sorting
    var offs = new Uint16Array(16 /*MAXBITS+1*/);
    for (var len = 1; len < 15 /*MAXBITS*/; len++) {
      offs[len+1] = offs[len] + count[len];
    }

    // sort symbols by length, by symbol order within each length
    var work = new Uint16Array(288);
    for (var sym = 0; sym < lens.length; sym++) {
      if (lens[sym] > 0) {
        work[offs[lens[sym]]++] = sym & 0xffff;
      }
    }
    
    var base, extra, end;

    /* set up for code type */
    switch (mode) {
      case 'codes':
        base = extra = work;    /* dummy value--not used */
        end = 19;
        break;
      case 'lens':
        base = new Uint16Array(285 + 3);
        base.set([ /* Length codes 257..285 base */
          3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
          35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], 257);
        extra = new Uint16Array(285 + 3);
        extra.set([ /* Length codes 257..285 extra */
          16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
          19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], 257);
        end = 256;
        break;
      case 'dists':
        base = new Uint16Array([ /* Distance codes 0..29 base */
          1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
          257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
          8193, 12289, 16385, 24577, 0, 0]);
        extra = new Uint16Array([ /* Distance codes 0..29 extra */
          16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
          23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
          28, 28, 29, 29, 64, 64]);
        end = -1;
        break;
      default: throw new Error('unknown mode: ' + mode);
    }
    
    /* initialize state for loop */
    var huff = 0,       //  starting code
      sym = 0,          // starting code symbol
      len = min,        // starting code length
      next = 0,         // current table to fill in
      curr = root,      // current table index bits
      drop = 0,         // current bits to drop from code for index
      low = -1 >>> 0,   // trigger new sub-table when len > root
      used = 1 << root; // use root table entries
    var mask = used - 1;  // mask for comparing low

    /* check available table space */
    if ((mode === 'lens' && used > CodeTableView.ENOUGH_LENS)
    ||  (mode === 'dists' && used > CodeTableView.ENOUGH_DISTS)) {
      throw new Error('not enough table space');
    }

    /* process all codes and make table entries */
    for (;;) {
      /* create table entry */
      var here_op, here_val, here_bits = (len - drop) & 0xff;
      if (work[sym] < end) {
        here_op = 0;
        here_val = work[sym];
      }
      else if (work[sym] > end) {
        here_op = extra[work[sym]] & 0xff;
        here_val = base[work[sym]];
      }
      else {
        here_op = 32 + 64; // end of block
        here_val = 0;
      }

      /* replicate for those indices with low len bits equal to huff */
      var incr = 1 << (len - drop);
      var fill = 1 << curr;
      min = fill; // save offset to next table
      do {
        fill -= incr;
        var n = next + (huff >> drop) + fill;
        this.op[n] = here_op; this.bits[n] = here_bits; this.val[n] = here_val;
      } while (fill !== 0);

      /* backwards increment the len-bit code huff */
      incr = 1 << (len - 1);
      while (huff & incr) incr >>= 1;
      if (incr !== 0) {
        huff &= incr - 1;
        huff += incr;
      }
      else huff = 0;

      /* go to next symbol, update count, len */
      sym++;
      if (--count[len] == 0) {
        if (len === max) break;
        len = lens[work[sym]];
      }

      /* create new sub-table if needed */
      if (len > root && (huff & mask) !== low) {
        /* if first time, transition to sub-tables */
        if (drop === 0) drop = root;

        /* increment past last table */
        next += min; // here min is 1 << curr

        /* determine length of next table */
        curr = len - drop;
        left = 1 << curr;
        while (curr + drop < max) {
          left -= count[curr + drop];
          if (left <= 0) break;
          curr++;
          left <<= 1;
        }

        /* check for enough space */
        used += 1 << curr;
        if ((mode === 'lens' && used > CodeTableView.ENOUGH_LENS)
        ||  (mode === 'dists' && used > CodeTableView.ENOUGH_DISTS)) {
          throw new Error('not enough space');
        }

        /* point entry in root table to sub-table */
        low = huff & mask;
        this.op[low] = curr & 0xff;
        this.bits[low] = root & 0xff;
        this.val[low] = next & 0xffff;
      }
    }

    /*
    fill in remaining table entry if code is incomplete (guaranteed to have
    at most one remaining entry, since if the code is incomplete, the
    maximum code length that was allowed to get this far is one bit)
    */
    if (huff !== 0) {
      this.op[next + huff] = 64; // invalid code marker
      this.bits[next + huff] = (len - drop) & 0xff;
      this.val[next + huff] = 0;
    }
  }
  CodeTableView.prototype = {
    get length() {
      return 1 << this.bitWidth;
    },
    get mask() {
      return (1 << this.bitWidth) - 1;
    },
  };

  CodeTableView.ENOUGH_LENS = 852;
  CodeTableView.ENOUGH_DISTS = 592;

  // initialize fixed tables
  var lens, sym;
  
  lens = new Uint16Array(288);
  sym = 0;
  while (sym < 144) lens[sym++] = 8;
  while (sym < 256) lens[sym++] = 9;
  while (sym < 280) lens[sym++] = 7;
  while (sym < lens.length) lens[sym++] = 8;
  CodeTableView.fixedLengthTable = new CodeTableView('lens', 9, lens);

  lens = new Uint16Array(32);
  sym = 0;
  while (sym < lens.length) lens[sym++] = 5;
  CodeTableView.fixedDistanceTable = new CodeTableView('dists', 5, lens);

  return CodeTableView;

});

define('zutil', function() {

  'use strict';
  
  var CRC = new Int32Array(256);
  for (var i = 0; i < 256; i++) {
    CRC[i] = i;
    for (var j = 0; j < 8; j++) {
      CRC[i] = CRC[i] & 1 ? 0xEDB88320 ^ (CRC[i] >>> 1) : (CRC[i] >>> 1);
    }
  }
  
  function CHOP(a) {
    return (a & 0xffff) + (a >>> 16 << 4) - (a >>> 16);
  }

  return {
    crc32: function(crc, bytes, offset, length) {
      switch (arguments.length) {
        case 0: return 0;
        case 2:
          offset = 0;
          length = bytes.byteLength;
          break;
        case 3:
          length = bytes.byteLength - offset;
          break;
        case 4: break;
        default: throw new Error('unexpected number of arguments');
      }
      
      crc ^= -1;
      for (var i = 0; i < length; i++) {
        crc = CRC[(crc ^ bytes[offset + i]) & 0xff] ^ (crc >>> 8);
      }
      return (crc ^ -1) >>> 0;
    },
    adler32: function(adler, bytes, offset, length) {
      switch (arguments.length) {
        case 0: return 1;
        case 2:
          offset = 0;
          length = bytes.byteLength;
          break;
        case 3:
          length = bytes.byteLength - offset;
          break;
        case 4: break;
        default: throw new Error('unexpected number of arguments');
      }
      var sum2 = (adler >>> 16);
      adler &= 0xffff;
      while (length-- > 0) {
        adler += bytes[offset++];
        sum2 += adler;
      }
      // 65521: largest prime smaller than 65536
      adler = CHOP(CHOP(adler)) % 65521;
      sum2 = CHOP(CHOP(sum2)) % 65521;

      /* return recombined sums */
      return adler | (sum2 << 16);
    },
    // reverse the bytes of a 32-bit integer
    swap32: function(q) {
      return ((q >> 24) & 0xff)
        | ((q >> 8) & 0xff00)
        | ((q & 0xff00) << 8)
        | ((q & 0xff) << 24);
    },
  };

});

// Adapted from Mark Adler's zlib inflate.c decompression
define('inflate', ['zutil', 'CodeTableView'], function(zutil, CodeTableView) {

  'use strict';
  
  var NO_BYTES = new Uint8Array(0);
  
  /* permutation of code lengths */
  var order = new Uint16Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);

  function InflateState(windowBits) {
    this.lens = new Uint16Array(320); /* temporary storage for code lengths */

    if (arguments.length === 0) windowBits = 15 + 32; // +32 to enable gzip decoding

    /* extract wrap request from windowBits parameter */
    if (windowBits < 0) {
      this.wrap = 0;
      windowBits = -windowBits;
    }
    else {
      this.wrap = (windowBits >> 4) + 1;
      if (windowBits < 48) windowBits &= 15;
    }

    if (windowBits && (windowBits < 8 || windowBits > 15)) {
      throw new Error('invalid number of windowBits');
    }

    this.wbits = windowBits;
  }
  InflateState.prototype = {
    next_in: NO_BYTES,
    total_in: 0,
    next_out: NO_BYTES,
    total_out: 0,
    data_type: 0,

    mode: 0 /* HEAD */,
    last: 0,
    wrap: 0,
    havedict: false,
    flags: 0,
    dmax: 32768,
    check: 0,
    total: 0,
    head: null,
    wbits: 0,
    wsize: 0,
    whave: 0,
    wnext: 0,
    window: null,
    hold: 0,
    bits: 0,
    length: 0,
    offset: 0,
    extra: 0,
    lencode: null,
    distcode: null,
    ncode: 0,
    nlen: 0,
    ndist: 0,
    have: 0,
    back: -1,
    was: 0,
    inflate: function(flush) {
      var mode = this.mode;
      if (mode === 11 /* TYPE */) mode = 12 /* TYPEDO */; // skip check

      var self = this;

      var put = self.next_out, next = self.next_in, hold = self.hold, bits = self.bits;

      function RESTORE() {
        self.next_out = put;
        self.next_in = next;
        self.hold = hold;
        self.bits = bits;
        self.mode = mode;
      }

      function PULLBYTE() {
        if (next.length === 0) return false;
        hold += next[0] << bits;
        next = next.subarray(1);
        bits += 8;
        return true;
      }

      function NEEDBITS(n) {
        while (bits < n) {
          if (!PULLBYTE()) return false;
        }
        return true;
      }

      function BITS(n) {
        // n < 16
        return hold & ((1 << n) - 1);
      }

      function DROPBITS(n) {
        hold >>= n;
        bits -= n;
      }

      var _in = next.length, out = put.length;

      var ret = 'more';

      inflation: for (;;) switch (mode) {
        case 0 /* HEAD */:
          if (this.wrap === 0) {
            mode = 12 /* TYPEDO */;
            continue inflation;
          }
          if (!NEEDBITS(16)) break inflation;
          if ((this.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
            this._crc2(hold);
            hold = bits = 0;
            mode = 1 /* FLAGS */;
            continue inflation;
          }
          this.flags = 0; //  expect zlib header
          if (this.head) this.head.done = -1;
          if (!(this.wrap & 1) ||   /* check if zlib header allowed */
              ((BITS(8) << 8) + (hold >> 8)) % 31) {
            throw new Error("incorrect header check");
          }
          if (BITS(4) !== 8 /* Z_DEFLATED */) {
            throw new Error("unknown compression method");
          }
          DROPBITS(4);
          var len = BITS(4) + 8;
          if (this.wbits === 0) this.wbits = len;
          else if (len > this.wbits) {
            throw new Error("invalid window size");
          }
          this.dmax = 1 << len;
          this.check = zutil.adler32();
          mode = hold & 0x200 ? 9 /* DICTID */ : 11 /* TYPE */;
          hold = bits = 0;
          continue inflation;
        case 1 /* FLAGS */:
          if (!NEEDBITS(16)) break inflation;
          this.flags = hold;
          if ((this.flags & 0xff) !== 8 /* Z_DEFLATED */) {
            throw new Error("unknown compression method");
          }
          if (this.flags & 0xe000) {
            throw new Error("unknown header flags set");
          }
          if (this.head) this.head.text = ((hold >> 8) & 1);
          if (this.flags & 0x0200) this._crc2(hold);
          hold = bits = 0;
          mode = 2 /* TIME */;
          //continue inflation;
        case 2:
          if (!NEEDBITS(32)) break inflation;
          if (this.head) this.head.time = hold;
          if (this.flags & 0x0200) this._crc4(hold);
          hold = bits = 0;
          mode = 3 /* OS */;
          //continue inflation;
        case 3:
          if (!NEEDBITS(16)) break inflation;
          if (this.head) {
            this.head.xflags = hold & 0xff;
            this.head.os = hold >> 8;
          }
          if (this.flags & 0x0200) this._crc2(hold);
          hold = bits = 0;
          mode = 4 /* EXLEN */;
          //continue inflation;
        case 4 /* EXLEN */:
          if (this.flags & 0x0400) {
            if (!NEEDBITS(16)) break inflation;
            this.length = hold >>> 0;
            if (this.head) this.head.extra_len = hold >>> 0;
            if (this.flags & 0x0200) this._crc2(hold);
            hold = bits = 0;
          }
          else if (this.head) this.head.extra = null;
          mode = 5 /* EXTRA */;
          //continue inflation;
        case 5 /* EXTRA */:
          if (this.flags & 0x0400) {
            var copy = Math.min(this.length, next.length);
            if (copy > 0) {
              if (this.head && this.head.extra) {
                var len = this.head.extra_len - this.length;
                if (len + copy > this.head.extra_max) {
                  this.head.extra.set(next.subarray(0, this.head.extra_max - len), len);
                }
                else {
                  this.head.extra.set(next.subarray(0, copy), len);
                }
              }
              if (this.flags & 0x0200) this._crc(next, copy);
              next = next.subarray(copy);
              this.length -= copy;
            }
            if (this.length > 0) break inflation;
          }
          this.length = 0;
          mode = 6 /* NAME */;
          //continue inflation;
        case 6 /* NAME */:
          if (this.flags & 0x0800) {
            if (next.length === 0) break inflation;
            var len, copy = 0;
            do {
              len = next[copy++];
              if (this.head && this.head.name && this.length < this.head.name_max) {
                this.head.name[this.length++] = len;
              }
            } while (len > 0 && copy < next.length);
            if (this.flags & 0x0200) {
              this._crc(next, copy);
            }
            next = next.subarray(copy);
            if (len > 0) break inflation;
          }
          else if (this.head) this.head.name = null;
          this.length = 0;
          mode = 7 /* COMMENT */;
          //continue inflation;
        case 7 /* COMMENT */:
          if (this.flags & 0x1000) {
            if (next.length === 0) break inflation;
            var copy = 0, len;
            do {
              len = next[copy++];
              if (this.head && this.head.comment && this.length < this.head.comm_max) {
                this.head.comment[this.length++] = len;
              }
            } while (len > 0 && copy < next.length);
            if (this.flags & 0x0200) this.check = crc32(this.check, next, copy);
            next = next.subarray(copy);
            if (len) break inflation;
          }
          else if (this.head) this.head.comment = null;
          mode = 8 /* HCRC */;
          //continue inflation;
        case 8 /* HCRC */:
          if (this.flags & 0x0200) {
            if (!NEEDBITS(16)) break inflation;
            if (hold !== (this.check & 0xffff)) {
              throw new Error("header crc mismatch");
            }
            hold = bits = 0;
          }
          if (this.head) {
            this.head.hcrc = (this.flags >> 9) & 1;
            this.head.done = 1;
          }
          this.check = zutil.crc32();
          mode = 11 /* TYPE */;
          continue inflation;
        case 9 /* DICTID */:
          if (!NEEDBITS(32)) break inflation;
          this.check = zutil.swap32(hold);
          hold = bits = 0;
          mode = 10 /* DICT */;
          //continue inflation;
        case 10 /* DICT */:
          if (!this.havedict) {
            RESTORE();
            return 'needDictionary';
          }
          this.check = zutil.adler32();
          mode = 11 /* TYPE */;
          //continue inflation;
        case 11 /* TYPE */:
          if (flush === 'block' || flush === 'trees') break inflation;
          //continue inflation;
        case 12 /* TYPEDO */:
          if (this.last) {
            hold >>= bits & 7; bits -= bits & 7;
            mode = 26 /* CHECK */;
            continue inflation;
          }
          if (!NEEDBITS(3)) break inflation;
          this.last = BITS(1);
          DROPBITS(1);
          switch (BITS(2)) {
            case 0: // stored block
              mode = 13 /* STORED */;
              break;
            case 1: // fixed block
              this.lencode = CodeTableView.fixedLengthTable;
              this.distcode = CodeTableView.fixedDistanceTable;
              mode = 19 /* LEN_ */; // decode codes
              if (flush === 'trees') {
                DROPBITS(2);
                break inflation;
              }
              break;
            case 2: // dynamic block
              mode = 16 /* TABLE */;
              break;
            case 3:
              throw new Error("invalid block type");
          }
          DROPBITS(2);
          continue inflation;
        case 13 /* STORED */:
          // go to byte boundary
          hold >>= bits & 7; bits -= bits & 7;
          if (!NEEDBITS(32)) break inflation;
          if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
            throw new Error("invalid stored block lengths");
          }
          this.length = hold & 0xffff;
          hold = bits = 0;
          mode = 14 /* COPY_ */;
          if (flush === 'trees') break inflation;
          //continue inflation;
        case 14 /* COPY_ */:
          mode = 15 /* COPY */;
          //continue inflation;
        case 15 /* COPY */:
          var copy = this.length;
          if (copy > 0) {
            if ((copy = Math.min(copy, next.length, put.length)) === 0) {
              break inflation;
            }
            put.set(next.subarray(0, copy));
            next = next.subarray(copy);
            put = put.subarray(copy);
            this.length -= copy;
            continue inflation;
          }
          mode = 11 /* TYPE */;
          continue inflation;
        case 16 /* TABLE */:
          if (!NEEDBITS(14)) break inflation;
          this.nlen = BITS(5) + 257;
          DROPBITS(5);
          this.ndist = BITS(5) + 1;
          DROPBITS(5);
          this.ncode = BITS(4) + 4;
          DROPBITS(4);
          /*
          #ifndef PKZIP_BUG_WORKAROUND
          if (this.nlen > 286 || this.ndist > 30) {
            throw new Exception("too many length or distance symbols");
          }
          #endif
          */
          this.have = 0;
          mode = 17 /* LENLENS */;
          //continue inflation;
        case 17 /* LENLENS */:
          while (this.have < this.ncode) {
            if (!NEEDBITS(3)) break inflation;
            this.lens[order[this.have++]] = BITS(3);
            DROPBITS(3);
          }
          while (this.have < 19) {
            this.lens[order[this.have++]] = 0;
          }
          this.lencode = new CodeTableView('codes', 7, this.lens.subarray(0, 19));
          this.have = 0;
          mode = 18 /* CODELENS */;
          //continue inflation;
        case 18 /* CODELENS */:
          var lcode = this.lencode;
          while (this.have < this.nlen + this.ndist) {
            var here;
            for (;;) {
              here = BITS(lcode.bitWidth);
              if (lcode.bits[here] <= bits) break;
              if (!PULLBYTE()) break inflation;
            }
            var here_val = lcode.val[here], here_bits = lcode.bits[here];
            if (here_val < 16) {
              DROPBITS(here_bits);
              this.lens[this.have++] = here_val;
            }
            else {
              var len, copy;
              if (here_val === 16) {
                if (!NEEDBITS(here_bits + 2)) break inflation;
                DROPBITS(here_bits);
                if (this.have === 0) {
                  throw new Error("invalid bit length repeat");
                }
                len = this.lens[this.have - 1];
                copy = 3 + BITS(2);
                DROPBITS(2);
              }
              else if (here_val === 17) {
                if (!NEEDBITS(here_bits + 3)) break inflation;
                DROPBITS(here_bits);
                len = 0;
                copy = 3 + BITS(3);
                DROPBITS(3);
              }
              else {
                if (!NEEDBITS(here_bits + 7)) break inflation;
                DROPBITS(here_bits);
                len = 0;
                copy = 11 + BITS(7);
                DROPBITS(7);
              }
              if (this.have + copy > this.nlen + this.ndist) {
                throw new Error("invalid bit length repeat");
              }
              while (copy--) {
                this.lens[this.have++] = len & 0xffff;
              }
            }
          }

          /* check for end-of-block code (better have one) */
          if (this.lens[256] === 0) {
            throw new Error("invalid code -- missing end-of-block");
          }

          /* build code tables */
          this.lencode = new CodeTableView('lens', 9, this.lens.subarray(0, this.nlen));
          this.distcode = new CodeTableView('dists', 6, this.lens.subarray(this.nlen, this.nlen + this.ndist));
          mode = 19 /* LEN_ */;
          if (flush === 'trees') break inflation;
          //continue inflation;
        case 19 /* LEN_ */:
          mode = 20 /* LEN */;
          //continue inflation;
        case 20 /* LEN */:
          this.back = 0;
          var lcode = this.lencode;
          var here;
          for (;;) {
            here = BITS(lcode.bitWidth);
            if (lcode.bits[here] <= bits) break;
            if (!PULLBYTE()) break inflation;
          }
          if (lcode.op[here] && !(lcode.op[here] & 0xf0)) {
            var last_op = lcode.op[here], last_bits = lcode.bits[here], last_val = lcode.val[here];
            for (;;) {
              here = last_val + (BITS(last_bits + last_op) >> last_bits);
              if ((last_bits + lcode.bits[here]) <= bits) break;
              if (!PULLBYTE()) break inflation;
            }
            DROPBITS(last_bits);
            this.back += last_bits;
          }
          var here_bits = lcode.bits[here], here_op = lcode.op[here], here_val = lcode.val[here];
          DROPBITS(here_bits);
          this.back += here_bits;
          this.length = here_val;
          if (here_op === 0) {
            mode = 25 /* LIT */;
            continue inflation;
          }
          if (here_op & 32) {
            this.back = -1;
            mode = 11 /* TYPE */;
            continue inflation;
          }
          if (here_op & 64) {
            throw new Error("invalid literal/length code");
          }
          this.extra = here_op & 15;
          mode = 21 /* LENEXT */;
          //continue inflation;
        case 21 /* LENEXT */:
          if (this.extra > 0) {
            if (!NEEDBITS(this.extra)) break inflation;
            this.length += BITS(this.extra);
            DROPBITS(this.extra);
            this.back += this.extra;
          }
          this.was = this.length;
          mode = 22 /* DIST */;
          //continue inflation;
        case 22 /* DIST */:
          var here, dcode = this.distcode;
          for (;;) {
            here = BITS(dcode.bitWidth);
            if (dcode.bits[here] <= bits) break;
            if (!PULLBYTE()) break inflation;
          }
          if ((dcode.op[here] & 0xf0) === 0) {
            var last_val = dcode.val[here], last_bits = dcode.bits[here], last_op = dcode.op[here];
            for (;;) {
              here = last_val + (BITS(last_bits + last_op) >> last_bits);
              if ((last_bits + dcode.bits[here]) <= bits) break;
              if (!PULLBYTE()) break inflation;
            }
            DROPBITS(last_bits);
            this.back += last_bits;
          }
          var here_bits = dcode.bits[here], here_op = dcode.op[here], here_val = dcode.val[here];
          DROPBITS(here_bits);
          this.back += here_bits;
          if (here_op & 64) {
            throw new Error("invalid distance code");
          }
          this.offset = here_val;
          this.extra = here_op & 15;
          mode = 23 /* DISTEXT */;
          //continue inflation;
        case 23 /* DISTEXT */:
          if (this.extra) {
            if (!NEEDBITS(this.extra)) break inflation;
            this.offset += BITS(this.extra);
            DROPBITS(this.extra);
            this.back += this.extra;
          }
          // #ifdef INFLATE_STRICT
          if (this.offset > this.dmax) {
            throw new Error("invalid distance too far back");
          }
          // #endif
          mode = 24 /* MATCH */;
          console.log(out - put.length - this.offset, this.length);
          //continue inflation;
        case 24 /* MATCH */:
          if (put.length === 0) break inflation;
          var copy = out - put.length;
          var from;
          if (this.offset > copy) { // copy from window
            copy = this.offset - copy;
            if (copy > this.whave) {
              throw new Error("invalid distance too far back");
            }
            if (copy > this.wnext) {
              copy -= this.wnext;
              from = this.window.subarray(this.wsize - copy);
            }
            else {
              from = this.window.subarray(this.wnext - copy);
            }
            if (copy > this.length) copy = this.length;
          }
          else {
            // copy from output
            from = new Uint8Array(put.buffer, put.byteOffset - this.offset, this.offset);
            copy = this.length;
          }
          if (copy > put.length) copy = put.length;
          this.length -= copy;
          while (copy > from.length) {
            put.set(from);
            put = put.subarray(from.length);
            copy -= from.length;
          }
          put.set(from.subarray(0, copy));
          put = put.subarray(copy);
          if (this.length === 0) mode = 20 /* LEN */;
          continue inflation;
        case 25 /* LIT */:
          if (put.length === 0) break inflation;
          put[0] = this.length & 0xff;
          put = put.subarray(1);
          mode = 20 /* LEN */;
          continue inflation;
        case 26 /* CHECK */:
          if (this.wrap) {
            if (!NEEDBITS(32)) break inflation;
            out -= put.length;
            this.total_out += out;
            this.total += out;
            if (out > 0) {
              var checkBytes = new Uint8Array(put.buffer, put.byteOffset - out, out);
              this._update(checkBytes);
            }
            out = put.length;
            if ((this.flags ? hold : zutil.swap32(hold)) !== this.check) {
              throw new Error("incorrect data check");
            }
            hold = bits = 0;
          }
          mode = 27 /* LENGTH */;
          //continue inflation;
        case 27 /* LENGTH */:
          if (this.wrap && this.flags) {
            if (!NEEDBITS(32)) break inflation;
            if ((hold >>> 0) !== (this.total >>> 0)) {
              throw new Error("incorrect length check");
            }
            hold = bits = 0;
          }
          mode = 28 /* DONE */;
          //continue inflation;
        case 28 /* DONE */:
          ret = 'done';
          break inflation;
        default: throw new Error('unknown state');
      }
      // end of loop
      RESTORE();
      if (this.wsize > 0 || (out !== this.next_out.length
        && (flush !== 'finish' || !/^(check|length|done)$/.test(mode)))
      ) {
        this._updateWindow(this.next_out, out - this.next_out.length);
      }
      _in -= this.next_in.length;
      out -= this.next_out.length;
      this.total_in += _in;
      this.total_out += out;
      this.total += out;
      if (this.wrap && out > 0) {
        this._update(new Uint8Array(this.next_out.buffer, this.next_out.byteOffset - out, out));
      }
      this.data_type = this.bits
        + (this.last ? 64 : 0)
        + (mode === 'type' ? 128 : 0)
        + (mode === 'len_' || mode === 'copy_' ? 256 : 0);
      if (((!_in && !out) || flush === 'finish') && ret === 'more') {
        throw new Error('buffer error');
      }
      return ret;
    },
    _crc: function(bytes, length) {
      this.check = crc32(this.check, bytes, length);
    },
    _crc2: function(v) {
      this.check = zutil.crc32(this.check, new Uint8Array([
        v & 0xff,
        (v >> 8) & 0xff]));
    },
    _crc4: function(v) {
      this.check = zutil.crc32(this.check, new Uint8Array([
        v & 0xff,
        (v >> 8) & 0xff,
        (v >> 16) & 0xff,
        (v >> 24) & 0xff]));
    },
    _update: function(bytes) {
      this.check = (this.flags ? zutil.crc32 : zutil.adler32)(this.check, bytes);
    },
    _updateWindow: function(end, copy) {
      /* if it hasn't been done already, allocate space for the window */
      if (!this.window) {
        this.window = new Uint8Array(1 << this.wbits);
      }

      /* if window not in use yet, initialize */
      if (this.wsize == 0) {
        this.wsize = 1 << this.wbits;
        this.wnext = 0;
        this.whave = 0;
      }

      /* copy this.wsize or less output bytes into the circular window */
      if (copy >= this.wsize) {
        this.window.set(new Uint8Array(end.buffer, end.byteOffset - this.wsize, this.wsize));
        this.wnext = 0;
        this.whave = this.wsize;
      }
      else {
        var dist = Math.min(this.wsize - this.wnext, copy);
        this.window.set(new Uint8Array(end.buffer, end.byteOffset - copy, dist), this.wnext);
        copy -= dist;
        if (copy > 0) {
          this.window.set(new Uint8Array(end.buffer, end.byteOffset - copy, copy));
          this.wnext = copy;
          this.whave = this.wsize;
        }
        else {
          this.wnext += dist;
          if (this.wnext == this.wsize) this.wnext = 0;
          if (this.whave < this.wsize) this.whave += dist;
        }
      }
    },
  };
  
  function inflate(compressedBytes, noWrap) {
    var inflater = noWrap ? new InflateState(-15) : new InflateState();
    inflater.next_in = compressedBytes;
    var bufferList = [];
    var status;
    var allBytes = 0;

    do {
      var buffer = inflater.next_out = new Uint8Array(32 * 1024);
      status = inflater.inflate();
      if (inflater.next_out.byteLength !== 0) {
        buffer = buffer.subarray(0, inflater.next_out.byteOffset - buffer.byteOffset);
      }
      allBytes += buffer.byteLength;
      bufferList.push(buffer);
    } while (status !== 'done');

    allBytes = new Uint8Array(allBytes);
    for (var pos = 0; pos < allBytes.length; pos += bufferList.shift().byteLength) {
      allBytes.set(bufferList[0], pos);
    }
    return allBytes;
  }
  
  inflate.State = InflateState;
  
  return inflate;

});

if (0) define(['inflate'], function(inflate) {
  var lib = {
    load: function(name, parentRequire, onload, config) {
      onload(lib);
    },
    inflate: function (compressed) {
      return inflate(compressed);
    },
  };
  return lib;
});

define(function() {

  'use strict';
  
  function generateCodeTree(codeBitWidths) {
    var bitWidthCounts = new Array();
    for (var i = 0; i < codeBitWidths.length; i++) {
      var bitWidth = codeBitWidths[i];
      if (bitWidth === 0) continue;
      if (bitWidth >= bitWidthCounts.length) {
        var oldLength = bitWidthCounts.length;
        bitWidthCounts.length = bitWidth + 1;
        bitWidthCounts.fill(0, oldLength, bitWidth);
        bitWidthCounts[bitWidth] = 1;
      }
      else {
        bitWidthCounts[bitWidth]++;
      }
    }
    if (bitWidthCounts.length === 0) throw new Error('no codes');
    var nextCodeOfWidth = new Array(bitWidthCounts.length + 1);
    nextCodeOfWidth[0] = 0;
    for (var i = 1; i < nextCodeOfWidth.length; i++) {
      nextCodeOfWidth[i] = (nextCodeOfWidth[i-1] + bitWidthCounts[i-1]) << 1;
    }
    var minBitWidth = 1;
    while (!bitWidthCounts[minBitWidth]) minBitWidth++;
    var tree = new Array(1 << minBitWidth);
    tree.rootBits = minBitWidth;
    tree.maxBits = bitWidthCounts.length-1;
    for (var i = 0; i < codeBitWidths.length; i++) {
      var bitWidth = codeBitWidths[i];
      if (bitWidth === 0) continue;
      var code = nextCodeOfWidth[bitWidth]++;
      var rootCode = code >>> (bitWidth - minBitWidth);
      var rootIndex = 0;
      for (var b = 0; b < minBitWidth; b++) {
        rootIndex |= ((rootCode >>> b) & 1) << (minBitWidth-(b+1));
      }
      if (bitWidth === minBitWidth) {
        tree[rootIndex] = i;
        continue;
      }
      bitWidth -= minBitWidth;
      var branch = tree, i_branch = rootIndex;
      do {
        var descend = branch[i_branch];
        if (!descend) {
          descend = branch[i_branch] = new Array(2);
        }
        branch = descend;
        i_branch = (code >>> --bitWidth) & 1;
      } while (bitWidth > 0);
      branch[i_branch] = i;
    }
    return tree;
  }
  
  const FIXED_LIT_LEN_TREE = generateCodeTree(
    new Array(288)
    .fill(8)
    .fill(9, 144, 256)
    .fill(7, 256, 280));
  const FIXED_DIST_TREE = generateCodeTree(
    new Array(32)
    .fill(5));
  const BIT_WIDTH_PERMUTATION = new Uint8Array([
    16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  const BYTE_LITERALS = (function() {
    var a = new Array(256);
    for (var i = 0; i < 256; i++) {
      a[i] = new Uint8Array([i]);
    }
    return a;
  })();
  
  Uint8Array.prototype.readZBits = function(n) {
    while (this.bitCount < n) {
      this.bitBuf |= this.readUint8() << this.bitCount;
      this.bitCount += 8;
    }
    var v = this.bitBuf & ((1 << n) - 1);
    this.bitBuf >>>= n;
    this.bitCount -= n;
    return v;
  };
  Uint8Array.prototype.flushZBits = function() {
    this.bitBuf = this.bitCount = 0;
  };
  Uint8Array.prototype.readZTreeCode = function(tree) {
    var branch = tree, i_branch = this.readZBits(tree.rootBits);
    for (;;) {
      var descend = branch[i_branch];
      if (typeof descend === 'number') return descend;
      branch = descend;
      i_branch = this.readZBits(1);
    }
  };
  Uint8Array.prototype.readZTreeEncodedTree = function(codeCount, bitWidthTree) {
    var codeWidths = new Array(codeCount);
    var i_code = 0, widthCode;
    while (i_code < codeCount) {
      switch (widthCode = this.readZTreeCode(bitWidthTree)) {
        case 16:
          var repCount = 3 + this.readZBits(2);
          codeWidths.fill(codeWidths[i_code-1], i_code, i_code + repCount);
          i_code += repCount;
          continue;
        case 17:
          var repCount = 3 + this.readZBits(3);
          codeWidths.fill(0, i_code, i_code + repCount);
          i_code += repCount;
          continue;
        case 18:
          var repCount = 11 + this.readZBits(7);
          codeWidths.fill(0, i_code, i_code + repCount);
          i_code += repCount;
          continue;
        default:
          codeWidths[i_code++] = widthCode;
          continue;
      }
    }
    return generateCodeTree(codeWidths);
  };
  Uint8Array.prototype.decompressZParts = function() {
    var head = this.readUint16BE();
    if (head%31) throw new Error('invalid zlib stream');
    var compressionMethod = (head >> 8) & 15;
    if (compressionMethod !== 8) throw new Error('invalid deflate stream');
    var windowSize = 1 << ((head >> 12) + 7);
    if (windowSize > 32768) throw new Error('invalid window size');
    var hasPresetDictionary = !!(head & (1 << 5));
    var compressionLevel = (head >> 6) & 3; // fastest, fast, default, max
    if (hasPresetDictionary) {
      var presetAdler32 = this.readUint32BE();
      throw new Error('preset dictionary not supported');
    }
    var outputParts = [];
    var finalBlock, totalLength = 0;
    do {
      finalBlock = this.readZBits(1);
      var litLenTree, distTree;
      switch (this.readZBits(2)) {
        case 0:
          this.flushZBits();
          var len = this.readUint16BE();
          if (~len !== this.readInt16BE()) {
            throw new Error('corrupt data');
          }
          outputParts.push(this.readSubarray(len));
          totalLength += len;
          continue;
        case 1:
          litLenTree = FIXED_LIT_LEN_TREE;
          distTree = FIXED_DIST_TREE;
          break;
        case 2:
          var litLenCodes = 257 + this.readZBits(5);
          var distCodes = 1 + this.readZBits(5);
          var bitWidthCodes = 4 + this.readZBits(4);
          var bitWidthWidths = new Uint8Array(19);
          for (var i = 0; i < bitWidthCodes; i++) {
            bitWidthWidths[BIT_WIDTH_PERMUTATION[i]] = this.readZBits(3);
          }
          var bitWidthTree = generateCodeTree(bitWidthWidths);
          litLenTree = this.readZTreeEncodedTree(litLenCodes, bitWidthTree);
          distTree = this.readZTreeEncodedTree(distCodes, bitWidthTree);
          break;
        case 3: throw new Error('invalid block');
      }
      for (;;) {
        var code = this.readZTreeCode(litLenTree);
        if (code < 256) {
          outputParts.push(BYTE_LITERALS[code]);
          totalLength++;
          continue;
        }
        if (code === 256) {
          console.log('total:', totalLength);
          break;
        }
        var length;
        if (code < 265) {
          length = code - 254;
        }
        else if (code < 269) {
          length = 11 + ((code - 265) << 1) + this.readZBits(1);
        }
        else if (code < 273) {
          length = 19 + ((code - 269) << 2) + this.readZBits(2);
        }
        else if (code < 277) {
          length = 35 + ((code - 273) << 3) + this.readZBits(3);
        }
        else if (code < 281) {
          length = 67 + ((code - 277) << 4) + this.readZBits(4);
        }
        else if (code < 285) {
          length = 131 + ((code - 281) << 5) + this.readZBits(5);
        }
        else {
          length = 258;
        }
        code = this.readZTreeCode(distTree);
        var distance;
        if (code < 4) {
          distance = 1 + code;
        }
        else {
          var extraBits = (code-2) >>> 1;
          distance = (2 << extraBits) + 1 + ((code - 2*(extraBits+1)) << extraBits) + this.readZBits(extraBits);
        }
        console.log(totalLength, totalLength-distance, length);
        totalLength += length;
        continue;
        console.log(outputParts.reduce((a,b) => a + b.length, 0), length, distance);
        var start_i = outputParts.length-1;
        while (outputParts[start_i].length < distance) {
          distance -= outputParts[start_i--].length;
        }
        if (length <= distance) {
          if (length === outputParts[start_i].length) {
            outputParts.push(outputParts[start_i]);
            continue;
          }
          if (length === distance) {
            outputParts.push(outputParts[start_i].subarray(-distance));
          }
          else {
            outputParts.push(outputParts[start_i].subarray(-distance, length-distance));
          }
          continue;
        }
        var concatLength = outputParts[start_i].length;
        var offset = concatLength - distance;
        var end_i = start_i + 1;
        if (end_i < outputParts.length) do {
          concatLength += outputParts[end_i++].length;
          if (end_i === outputParts.length) {
            break;
          }
        } while (concatLength < length);
        var concat = new Uint8Array(concatLength);
        var write_i = start_i, writeOffset = 0;
        do {
          var part = outputParts[write_i++];
          concat.set(part, writeOffset);
          writeOffset += part.length;
        } while (write_i < end_i);
        var prelength = outputParts.reduce((a,b) => a + b.length, 0);
        outputParts.splice(start_i, end_i - start_i, concat);
        if (prelength !== outputParts.reduce((a,b) => a + b.length, 0)) {
          throw new Error('len changed');
        }
        if (length > (concat.length - offset)) {
          concat = concat.subarray(offset);
          var writeLength = length;
          do {
            outputParts.push(concat);
            writeLength -= concat.length;
          } while (writeLength >= concat.length);
          if (writeLength !== 0) {
            outputParts.push(concat.subarray(0, writeLength));
          }
        }
        else if (length < concat.length) {
          outputParts.push(concat.subarray(offset, offset+length));
        }
        else {
          outputParts.push(concat);
        }
      }
    } while (!finalBlock);
    this.flushZBits();
    outputParts.adler32 = this.readUint32BE();
    return outputParts;
  };
  
  var lib;
  
  return lib = {
    load: function(name, parentRequire, onload, config) {
      onload(lib);
    },
    inflate: function(bytes) {
      var parts = bytes.decompressZParts();
      if (parts.length === 1) return parts[0];
      var concat = new Uint8Array(parts.reduce(function(len, part) {
        return len + part.length;
      }, 0));
      var offset = 0;
      for (var i = 0; i < parts.length; i++) {
        concat.set(parts[i], offset);
        offset += parts[i].length;
      }
      return concat;
    },
  };
  
});
