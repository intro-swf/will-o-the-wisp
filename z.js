define(['dataExtensions!'], function(dataExtensions) {

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
  
  Object.assign(Uint8Array.prototype, {
    readZTreeCode: function(tree) {
      var branch = tree, i_branch = this.readLowBits(tree.rootBits);
      for (;;) {
        var descend = branch[i_branch];
        if (typeof descend === 'number') return descend;
        branch = descend;
        i_branch = this.readLowBits(1);
      }
    },
    readZTreeEncodedTree: function(codeCount, bitWidthTree) {
      var codeWidths = new Array(codeCount);
      var i_code = 0, widthCode;
      while (i_code < codeCount) {
        switch (widthCode = this.readZTreeCode(bitWidthTree)) {
          case 16:
            var repCount = 3 + this.readLowBits(2);
            codeWidths.fill(codeWidths[i_code-1], i_code, i_code + repCount);
            i_code += repCount;
            continue;
          case 17:
            var repCount = 3 + this.readLowBits(3);
            codeWidths.fill(0, i_code, i_code + repCount);
            i_code += repCount;
            continue;
          case 18:
            var repCount = 11 + this.readLowBits(7);
            codeWidths.fill(0, i_code, i_code + repCount);
            i_code += repCount;
            continue;
          default:
            codeWidths[i_code++] = widthCode;
            continue;
        }
      }
      return generateCodeTree(codeWidths);
    },
    decompressZParts: function() {
      var head = this.readUint16BE();
      if (head%31) throw new Error('invalid zlib stream');
      var compressionMethod = (head >> 8) & 15;
      if (compressionMethod !== 8) throw new Error('invalid deflate stream');
      const windowSize = 1 << ((head >> 12) + 8);
      if (windowSize > 32768) throw new Error('invalid window size');
      var hasPresetDictionary = !!(head & (1 << 5));
      var compressionLevel = (head >> 6) & 3; // fastest, fast, default, max
      if (hasPresetDictionary) {
        var presetAdler32 = this.readUint32BE();
        throw new Error('preset dictionary not supported');
      }
      var result = this.decompressZPartsRaw(windowSize);
      result.adler32 = this.readUint32BE();
      return result;
    },
    decompressZPartsRaw: function(windowSize) {
      var window = new Uint8Array(windowSize * 2);
      var windowHalf2 = window.subarray(windowSize);
      var outputParts = [];
      blockLoop: for (;;) {
        var isFinalBlock = this.readLowBits(1);
        var litLenTree, distTree;
        switch (this.readLowBits(2)) {
          case 0:
            this.flushBits();
            var len = this.readUint16LE();
            if (~len !== this.readInt16LE()) {
              throw new Error('corrupt data');
            }
            var part = this.readSubarray(len);
            outputParts.push(part);
            if (isFinalBlock) {
              break blockLoop;
            }
            var moveBytes = windowSize - part.length;
            if (moveBytes <= 0) {
              part = part.subarray(-windowSize);
              window.set(part, windowSize - part.length);
              continue;
            }
            window.set(new Uint8Array(window.subarray(windowSize - moveBytes, windowSize)));
            window.set(part, moveBytes);
            continue;
          case 1:
            litLenTree = FIXED_LIT_LEN_TREE;
            distTree = FIXED_DIST_TREE;
            break;
          case 2:
            var litLenCodes = 257 + this.readLowBits(5);
            var distCodes = 1 + this.readLowBits(5);
            var bitWidthCodes = 4 + this.readLowBits(4);
            var bitWidthWidths = new Uint8Array(19);
            for (var i = 0; i < bitWidthCodes; i++) {
              bitWidthWidths[BIT_WIDTH_PERMUTATION[i]] = this.readLowBits(3);
            }
            var bitWidthTree = generateCodeTree(bitWidthWidths);
            litLenTree = this.readZTreeEncodedTree(litLenCodes, bitWidthTree);
            distTree = this.readZTreeEncodedTree(distCodes, bitWidthTree);
            break;
          case 3: throw new Error('invalid block');
        }
        var wpos = windowSize;
        codeLoop: for (;;) {
          var code = this.readZTreeCode(litLenTree);
          if (code < 256) {
            window[wpos++] = code;
            if (wpos === windowSize*2) {
              outputParts.push(new Uint8Array(windowHalf2));
              window.set(windowHalf2);
              wpos = windowSize;
            }
            continue codeLoop;
          }
          if (code === 256) {
            if (isFinalBlock) {
              outputParts.push(window.subarray(windowSize, wpos));
              break blockLoop;
            }
            var moveBytes = new Uint8Array(window.subarray(wpos - windowSize, windowSize));
            var section = new Uint8Array(window.subarray(windowSize, wpos));
            window.set(moveBytes);
            window.set(section, moveBytes.length);
            outputParts.push(section);
            continue blockLoop;
          }
          var length;
          if (code < 265) {
            length = code - 254;
          }
          else if (code < 269) {
            length = 11 + ((code - 265) << 1) + this.readLowBits(1);
          }
          else if (code < 273) {
            length = 19 + ((code - 269) << 2) + this.readLowBits(2);
          }
          else if (code < 277) {
            length = 35 + ((code - 273) << 3) + this.readLowBits(3);
          }
          else if (code < 281) {
            length = 67 + ((code - 277) << 4) + this.readLowBits(4);
          }
          else if (code < 285) {
            length = 131 + ((code - 281) << 5) + this.readLowBits(5);
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
            distance = (2 << extraBits) + 1 + ((code - 2*(extraBits+1)) << extraBits) + this.readLowBits(extraBits);
          }
          var left = windowSize*2 - wpos;
          if (length >= left) {
            length -= left;
            do {
              window[wpos] = window[wpos - distance];
              wpos++;
            } while (--left);
            outputParts.push(new Uint8Array(windowHalf2));
            window.set(windowHalf2);
            wpos = windowSize;
            if (length === 0) continue codeLoop;
          }
          do {
            window[wpos] = window[wpos - distance];
            wpos++;
          } while (--length);
        }
      }
      this.flushBits();
      return outputParts;
    },
    toZStoredParts: function() {
      var blockCount = Math.ceil(this.length / 0xFFFF);
      var buf = new ArrayBuffer(2 + 4 + 5*blockCount);
      var head = new DataView(buf, 0, 2);
      var adler = new DataView(buf, 2, 4);
      head.setUint16(0, 0x78DA);
      var parts = [head];
      for (var i = 0; i < blockCount; i++) {
        var block = this.subarray(0xFFFF*i, 0xFFFF*(i+1));
        var blockHead = new DataView(buf, 2 + 4 + i*5, 5);
        if (i+1 === blockCount) blockHead.setUint8(0, 1);
        blockHead.setUint16(1, block.length, true);
        blockHead.setUint16(3, ~block.length, true);
        parts.push(blockHead, block);
      }
      adler.setUint32(0, this.getAdler32());
      parts.push(adler);
      return parts;
    },
  });
  
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
    inflateRaw: function(bytes) {
      var parts = bytes.decompressZPartsRaw(32768);
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
