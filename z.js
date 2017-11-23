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
      var rootIndex = code >>> (bitWidth - minBitWidth);
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
  });
  
  Uint8Array.prototype.readZBits = function(n) {
    if (this.bitCount < n) {
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
    var finalBlock;
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
          continue;
        }
        if (code === 256) break;
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
        var start_i = outputParts.length-1;
        while (outputParts[start_i].length < distance) {
          start_i--;
          distance -= outputParts[start_i].length;
        }
        if (length <= distance) {
          if (length === outputParts[start_i].length) {
            outputParts.push(outputParts[start_i]);
            continue;
          }
          outputParts.push(outputParts[start_i].subarray(-distance, length-distance));
          continue;
        }
        var concatLength = outputParts[start_i].length;
        var offset = concatLength - distance;
        var end_i = start_i + 1;
        do {
          concatLength += outputParts[end_i++].length;
        } while (concatLength < length);
        var concat = new Uint8Array(concatLength);
        outputParts.push(concat.subarray(offset, offset+length));
        var write_i = start_i, writeOffset = 0;
        do {
          var part = outputParts[write_i++];
          concat.set(part, writeOffset);
          writeOffset += part.length;
        } while (write_i < end_i);
        outputParts.splice(start_i, end_i - start_i, concat);
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
      var concat = new Uint8Array(parts.reduce(function(part, len) {
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
