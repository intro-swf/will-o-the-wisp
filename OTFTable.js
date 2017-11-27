define(function() {

  'use strict';
  
  function OTFTable(name, byteLength) {
    this.name = (name + '    ').slice(0, 4);
    this.buffer = new ArrayBuffer((byteLength + 3) & ~3);
    this.byteOffset = 0;
    this.byteLength = byteLength;
  }
  OTFTable.prototype = {
    getChecksum: function() {
      var checksum = 0;
      var dv = new DataView(this.buffer);
      for (var i = 0; i < dv.byteLength; i += 4) {
        checksum = (checksum + dv.getUint32(i, false)) >>> 0;
      }
      return checksum;
    },
  };
  function getBlobParts(tables) {
    tables = tables.slice().sort(function(a, b) {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
    var fileHeader = new DataView(new ArrayBuffer(12 + tables.length * 16));
    var maxLog2 = Math.floor(Math.log2(tables.length));
    var searchRange = (1 << maxLog2) * 16;
    var rangeShift = tables.length * 16 - searchRange;
    fileHeader.setUint32(0, 0x4F54544F /* OTTO */, false);
    fileHeader.setUint16(4, tables.length, false);
    fileHeader.setUint16(6, searchRange, false);
    fileHeader.setUint16(8, maxLog2, false);
    fileHeader.setUint16(10, rangeShift, false);
    var headerOffset = 12, bodyOffset = fileHeader.byteLength;
    var parts = [fileHeader];
    var masterChecksum = 0, fontHeader;
    for (var i = 0; i < tables.length; i++) {
      var table = tables[i];
      if (table instanceof OTFTable.FontHeader) fontHeader = table;
      var tableChecksum = table.getChecksum();
      masterChecksum = (masterChecksum + tableChecksum) >>> 0;
      fileHeader.setUint8(headerOffset + 0, table.name.charCodeAt(0));
      fileHeader.setUint8(headerOffset + 1, table.name.charCodeAt(1));
      fileHeader.setUint8(headerOffset + 2, table.name.charCodeAt(2));
      fileHeader.setUint8(headerOffset + 3, table.name.charCodeAt(3));
      fileHeader.setUint32(headerOffset + 4, tableChecksum, false);
      fileHeader.setUint32(headerOffset + 8, bodyOffset, false);
      fileHeader.setUint32(headerOffset + 12, table.byteLength, false);
      parts.push(table.buffer);
      headerOffset += 16;
      bodyOffset += table.buffer.byteLength;
    }
    masterChecksum = (masterChecksum + OTFTable.prototype.getChecksum.apply(fileHeader)) >>> 0;
    masterChecksum = (0xB1B0AFBA - masterChecksum) >>> 0;
    if (fontHeader) {
      fontHeader.masterChecksum.setUint32(0, masterChecksum, false);
    }
    return parts;
  }
  OTFTable.joinToBlob = function(tables) {
    return new Blob(
      getBlobParts(tables),
      {type: 'application/font-sfnt'});
  };
  OTFTable.joinToFile = function(tables, name) {
    return new File(
      getBlobParts(tables),
      name,
      {type: 'application/font-sfnt'});
  };

  OTFTable.CharacterGlyphMap = function OTFCharacterGlyphMap(info) {
    var map = {}, k = [];
    for (var i_glyph = 0; i_glyph < info.glyphs.length; i_glyph++) {
      var glyph = info.glyphs[i_glyph];
      var codePoint = glyph.char.codePointAt(0);
      map[codePoint] = i_glyph;
      k.push(codePoint);
    }
    k.sort(function(a, b) {
      return a - b;
    });
    var entries = [];
    for (var i = 0; i < k.length; i++) {
      var entry = {start:k[i], end:k[i], glyph:map[k[i]]};
      while (k[i]+1 === k[i+1] && map[k[i]+1] === map[k[i+1]]) {
        entry.end++;
        i++;
      }
      entries.push(entry);
    }
    var totalRange = k[k.length-1] + 1 - k[0];
    var format4SegCount = entries.length+1;
    var format4Len = 16 + format4SegCount * 8;
    var format6Len = 10 + totalRange * 2;
    OTFTable.call(this, 'cmap', 4 + 3*8 + format4Len + format6Len);
    var header = new DataView(this.buffer, 0, 4 + 3*8);
    var format4 = new DataView(this.buffer, header.byteOffset + header.byteLength, format4Len);
    var format6 = new DataView(this.buffer, format4.byteOffset + format4.byteLength, format6Len);
    header.setUint16(2, 3);
    header.setUint16(6, 3);
    header.setUint32(8, format4.byteOffset);
    header.setUint16(12, 1);
    header.setUint32(16, format6.byteOffset);
    header.setUint16(20, 3);
    header.setUint16(22, 1);
    header.setUint32(24, format4.byteOffset);
    format4.setUint16(0, 4);
    format4.setUint16(2, format4Len);
    format4.setUint16(6, format4SegCount*2);
    var maxLog2 = 1 << Math.floor(Math.log2(format4SegCount));
    var searchRange = 2 * maxLog2;
    format4.setUint16(8, searchRange);
    format4.setUint16(10, Math.log2(maxLog2));
    format4.setUint16(12, format4SegCount*2 - searchRange);
    var endCodes = new DataView(this.buffer, format4.byteOffset + 14, format4SegCount*2);
    var startCodes = new DataView(this.buffer, endCodes.byteOffset + endCodes.byteLength + 2, format4SegCount * 2);
    var idDeltas = new DataView(this.buffer, startCodes.byteOffset + startCodes.byteLength, format4SegCount * 2);
    for (var i = 0; i < entries.length; i++) {
      startCodes.setUint16(i*2, entries[i].start);
      endCodes.setUint16(i*2, entries[i].end);
      idDeltas.setInt16(i*2, entries[i].glyph - entries[i].start);
    }
    startCodes.setUint16(entries.length*2, 0xffff);
    endCodes.setUint16(entries.length*2, 0xffff);
    idDeltas.setInt16(entries.length*2, 1);
    format6.setUint16(0, 6);
    format6.setUint16(2, format6Len);
    format6.setUint16(6, k[0]);
    format6.setUint16(8, totalRange);
    var glyphIDs = new DataView(this.buffer, format6.byteOffset + 10, totalRange*2);
    for (var i = 0; i < k.length; i++) {
      glyphIDs.setUint16((k[i] - k[0])*2, map[k[i]]);
    }
    /*
    OTFTable.call(this, 'cmap', 4 + 8 + 16 + entries.length * 12);
    var dv = new DataView(this.buffer);
    dv.setUint16(2, 1, false); // encoding table count
    dv.setUint16(6, 6, false); // unicode full repertoire
    dv.setUint32(8, 12, false); // offset to next byte:
    dv.setUint16(12, 12, false); // segmented coverage
    dv.setUint32(16, 16 + entries.length * 12, false);
    dv.setUint32(24, entries.length, false);
    var offset = 28;
    for (var i = 0; i < entries.length; i++) {
      dv.setUint32(offset    , entries[i].start, false);
      dv.setUint32(offset + 4, entries[i].end,   false);
      dv.setUint32(offset + 8, entries[i].glyph, false);
      offset += 12;
    }
    */
  };
  OTFTable.CharacterGlyphMap.prototype = Object.create(OTFTable.prototype);

  OTFTable.FontHeader = function OTFFontHeader(info) {
    OTFTable.call(this, 'head', 54);
    var dv = new DataView(this.buffer);
    // <https://www.microsoft.com/typography/otspec/head.htm>
    dv.setUint16(0, 1, false);
    // 4: font revision as Fixed
    this.masterChecksum = new DataView(this.buffer, 8, 4);
    dv.setUint32(12, 0x5F0F3CF5, false); // magic number
    dv.setUint16(16, info.flags || 0, false);
    dv.setUint16(18, info.unitsPerEm, false); // 16 to 16384
    var created = info.createdAt || new Date;
    var modified = info.modifiedAt || created;
    dv.setUint32(24, (created - Date.UTC(4, 0)) / 1000, false);
    dv.setUint32(32, (modified - Date.UTC(4, 0)) / 1000, false);
    dv.setInt16(36, info.xMin, false);
    dv.setInt16(38, info.yMin, false);
    dv.setInt16(40, info.xMax, false);
    dv.setInt16(42, info.yMax, false);
    dv.setUint16(44, info.macStyle || 0, false);
    dv.setUint16(46, info.smallestReadablePixelSize, false);
    dv.setInt16(48, 2, false); // deprecated font direction hint
    dv.setInt16(50, !!info.longOffsets, false);
  };
  OTFTable.FontHeader.prototype = Object.create(OTFTable.prototype);

  OTFTable.HorizontalHeader = function OTFHorizontalHeader(info) {
    OTFTable.call(this, 'hhea', 36);
    var dv = new DataView(this.buffer);
    // <https://www.microsoft.com/typography/otspec/hhea.htm>
    dv.setUint16(0, 1, false);
    dv.setInt16(4, info.ascender, false);
    dv.setInt16(6, info.descender, false);
    dv.setInt16(8, info.lineGap, false);
    dv.setUint16(10, info.advanceWidthMax, false);
    dv.setInt16(12, info.minLeftSideBearing, false);
    dv.setInt16(14, info.minRightSideBearing, false);
    dv.setInt16(16, info.xMaxExtent, false);
    dv.setInt16(18, info.caretSlopeRise, false);
    dv.setInt16(20, info.caretSlopeRun, false);
    dv.setInt16(22, info.caretOffset, false);
    dv.setInt16(34, info.glyphs.length, false);
  };
  OTFTable.HorizontalHeader.prototype = Object.create(OTFTable.prototype);

  OTFTable.HorizontalMetrics = function OTFHorizontalMetrics(info) {
    OTFTable.call(this, 'hmtx', info.glyphs.length * 4);
    var dv = new DataView(this.buffer);
    // <https://www.microsoft.com/typography/otspec/hmtx.htm>
    for (var i = 0; i < info.glyphs.length; i++) {
      dv.setUint16(i*4, info.glyphs[i].advanceWidth, false);
      dv.setInt16(i*4 + 2, info.glyphs[i].leftSideBearing, false);
    }
  };
  OTFTable.HorizontalMetrics.prototype = Object.create(OTFTable.prototype);

  OTFTable.MaximumProfile = function OTFMaximumProfile(info) {
    OTFTable.call(this, 'maxp', 6);
    var dv = new DataView(this.buffer);
    // <https://www.microsoft.com/typography/otspec/maxp.htm>
    dv.setUint32(0, 0x00005000, false); // format v0.5
    dv.setUint16(4, info.glyphs.length, false);
  };
  OTFTable.MaximumProfile.prototype = Object.create(OTFTable.prototype);

  const encoder = ('TextEncoder' in self) ? new TextEncoder('utf-8') : {
    encode: function(str) {
      str = encodeURIComponent(str).replace(/%([0-9a-f]{2})/gi, function(_, c) {
        return String.fromCharCode(parseInt(c, 16));
      });
      var bytes = new Uint8Array(str.length);
      for (var i = 0; i < bytes.length; i++) {
        bytes[i] = str.charCodeAt(i);
      }
      return bytes;
    },
  };

  OTFTable.Naming = function OTFNamingTable(info) {
    var strings = info.strings.slice().sort(function(a, b) {
      return (a.platformId - b.platformId)
          || (a.encodingId - b.encodingId)
          || (a.languageId - b.languageId)
          || (a.nameId - b.nameId);
    });
    var storage = [];
    var offset = 0;
    for (var i = 0; i < strings.length; i++) {
      var data = encoder.encode(strings[i].text);
      data.offset = offset;
      offset += data.length;
      storage.push(data);
    }
    OTFTable.call(this, 'name', 6 + storage.length * 12 + offset);
    var dv = new DataView(this.buffer);
    var bytes = new Uint8Array(this.buffer, 6 + storage.length * 12);
    dv.setUint16(2, storage.length, false);
    dv.setUint16(4, 6 + storage.length * 12, false);
    for (var i = 0; i < strings.length; i++) {
      dv.setUint16(6 + i*8 + 0, strings[i].platformId, false);
      dv.setUint16(6 + i*8 + 2, strings[i].encodingId, false);
      dv.setUint16(6 + i*8 + 4, strings[i].languageId, false);
      dv.setUint16(6 + i*8 + 6, storage[i].length, false);
      bytes.set(storage[i], storage[i].offset);
    }
  };
  OTFTable.Naming.prototype = Object.create(OTFTable.prototype);

  OTFTable.MetricsForOS2 = function OTFMetricsForOS2(info) {
    OTFTable.call(this, 'OS/2', 98);
    var dv = new DataView(this.buffer);
    dv.setUint16(0, 5, false);
    dv.setInt16(2, info.xAvgCharWidth, false);
    dv.setUint16(4, info.usWeightClass, false);
    dv.setUint16(6, info.usWidthClass, false);
    dv.setUint16(8, info.fsType, false);
    dv.setInt16(10, info.ySubscriptXSize, false);
    dv.setInt16(12, info.ySubscriptYSize, false);
    dv.setInt16(14, info.ySubscriptXOffset, false);
    dv.setInt16(16, info.ySubscriptYOffset, false);
    dv.setInt16(18, info.ySuperscriptXSize, false);
    dv.setInt16(20, info.ySuperscriptYSize, false);
    dv.setInt16(22, info.ySuperscriptXOffset, false);
    dv.setInt16(24, info.ySuperscriptYOffset, false);
    dv.setInt16(26, info.yStrikeoutSize, false);
    dv.setInt16(28, info.yStrikeoutPosition, false);
    dv.setInt16(30, info.sFamilyClass, false);
    dv.setUint8(32, info.bFamilyType);
    dv.setUint8(33, info.bSerifStyle);
    dv.setUint8(34, info.bWeight);
    dv.setUint8(35, info.bProportion);
    dv.setUint8(36, info.bContrast);
    dv.setUint8(37, info.bStrokeVariation);
    dv.setUint8(38, info.bArmStyle);
    dv.setUint8(39, info.bLetterform);
    dv.setUint8(40, info.bMidline);
    dv.setUint8(41, info.bXHeight);
    dv.setUint32(42, info.ulUnicodeRange1, false);
    dv.setUint32(46, info.ulUnicodeRange2, false);
    dv.setUint32(50, info.ulUnicodeRange3, false);
    dv.setUint32(54, info.ulUnicodeRange4, false);
    dv.setUint8(58, info.vendor4CC.charCodeAt(0));
    dv.setUint8(59, info.vendor4CC.charCodeAt(1));
    dv.setUint8(60, info.vendor4CC.charCodeAt(2));
    dv.setUint8(61, info.vendor4CC.charCodeAt(3));
    dv.setUint16(62, info.fsSelection, false);
    dv.setUint16(64, info.usFirstCharIndex, false);
    dv.setUint16(66, info.usLastCharIndex, false);
    dv.setInt16(68, info.sTypoAscender, false);
    dv.setInt16(70, info.sTypoDescender, false);
    dv.setInt16(72, info.sTypoLineGap, false);
    dv.setUint16(74, info.usWinAscent, false);
    dv.setUint16(76, info.usWinDescent, false);
    dv.setUint32(78, info.ulCodePageRange1, false);
    dv.setUint32(82, info.ulCodePageRange2, false);
    dv.setInt16(86, info.sxHeight, false);
    dv.setInt16(88, info.sCapHeight, false);
    dv.setUint16(90, info.usDefaultChar, false);
    dv.setUint16(92, info.usMaxContext, false);
    dv.setUint16(94, info.usLowerOpticalPointSize, false);
    dv.setUint16(96, info.usUpperOpticalPointSize, false);
  };
  OTFTable.MetricsForOS2.prototype = Object.create(OTFTable.prototype);

  OTFTable.PostScript = function OTFPostScript(info) {
    OTFTable.call(this, 'post', 32);
    var dv = new DataView(this.buffer);
    // <https://www.microsoft.com/typography/otspec/post.htm>
    dv.setUint32(0, 0x00030000, false);
    dv.setUint32(4, info.italicAngle || 0, false); // fixed
    dv.setInt16(8, info.underlinePosition, false);
    dv.setInt16(10, info.underlineThickness, false);
    dv.setUint32(12, !!info.isMonospace, false);
  };
  OTFTable.PostScript.prototype = Object.create(OTFTable.prototype);

  const charStringOpcodes = {
    hstem: 0x01,
    vstem: 0x03,
    vmoveto: 0x04,
    rlineto: 0x05,
    hlineto: 0x06,
    vlineto: 0x07,
    rrcurveto: 0x08,
    callsubr: 0x0a,
    endchar: 0x0e,
    vsindex: 0x0f,
    blend: 0x10,
    hstemhm: 0x12,
    hintmask: 0x13,
    cntrmask: 0x14,
    rmoveto: 0x15,
    hmoveto: 0x16,
    vstemhm: 0x17,
    rcurveline: 0x18,
    rlinecurve: 0x19,
    vvcurveto: 0x1a,
    hhcurveto: 0x1b,
    callgsubr: 0x1c,
    vhcurveto: 0x1e,
    hvcurveto: 0x1f,
    hflex: 0x0c22,
    flex: 0x0c23,
    hflex1: 0x0c24,
    flex1: 0x0c25,
  };

  OTFTable.encodeCharString = function encodeCharString(sExpr) {
    var output = [];
    function encNumber(n) {
      if (n !== (n|0)) {
        output.push(255, (n >>> 8) & 0xff, n & 0xff, (n * 0x100) & 0xff, (n * 0x10000) & 0xff);
      }
      else if (n >= -107 && n <= 107) {
        output.push(n + 139);
      }
      else if (n >= 108 && n <= 1131) {
        n -= 108;
        output.push(247 + (n >> 8), n & 0xff);
      }
      else if (n >= -1131 && n <= -108) {
        n = -n - 108;
        output.push(251 + (n >> 8), n & 0xff);
      }
      else if (n >= -32768 && n <= 32767) {
        output.push(28, (n >> 8) & 0xff, n & 0xff);
      }
      else {
        throw new Error('out of range');
      }
    }
    function encOp(op) {
      for (var i = 1; i < op.length; i++) {
        if (typeof op[i] === 'number') {
          encNumber(op[i]);
        }
        else encOp(op[i]);
      }
      if (!(op[0] in charStringOpcodes)) {
        throw new Error('invalid op: ' + op[0]);
      }
      var opcode = charStringOpcodes[op[0]];
      if (opcode >= 0x100) {
        output.push(opcode >>> 8, opcode & 0xff);
      }
      else {
        output.push(opcode);
      }
    }
    for (var i = 0; i < sExpr.length; i++) {
      encOp(sExpr[i]);
    }
    output.push(charStringOpcodes.endchar);
    return new Uint8Array(output);
  };

  const dictOpcodes = {
    BlueValues: 0x06,
    OtherBlues: 0x07,
    FamilyBlues: 0x08,
    FamilyOtherBlues: 0x09,
    StdHW: 0x0a,
    StdVW: 0x0b,
    CharStrings: 0x11,
    Private: 0x12,
    Subrs: 0x13,
    vsindex: 0x16,
    blend: 0x17,
    vstore: 0x18,
    BCD: 0x1e,
    CharstringType: 0x0c06,
    FontMatrix: 0x0c07,
    BlueScale: 0x0c09,
    BlueShift: 0x0c0a,
    BlueFuzz: 0x0c0b,
    StemSnapH: 0x0c0c,
    StemSnapV: 0x0c0d,
    LanguageGroup: 0x0c11,
    ExpansionFactor: 0x0c12,
    ROS: 0x0c1e,
    FDArray: 0x0c24,
    FDSelect: 0x0c25,
  };

  OTFTable.encodeDict = function encodeDict(sExpr) {
    var output = [];
    var placeholders = Object.create(null);

    function encNumber(n) {
      if (n !== (n|0)) {
        n = n.toString().replace(/e-/i, 'c')
          .replace(/e\+?/i, 'b')
          .replace(/^-/, 'e')
          .replace('.', 'a');
        n += (n.length % 2) ? 'f' : 'ff';
        output.push(30);
        for (var i = 0; i < n.length; i += 2) {
          output.push(parseInt(n.slice(i, i+2), 16));
        }
      }
      else if (n >= -107 && n <= 107) {
        output.push(n + 139);
      }
      else if (n >= 108 && n <= 1131) {
        n -= 108;
        output.push(247 + (n >> 8), n & 0xff);
      }
      else if (n >= -1131 && n <= -108) {
        n = -n - 108;
        output.push(251 + (n >> 8), n & 0xff);
      }
      else if (n >= -32768 && n <= 32767) {
        output.push(28, (n >> 8) & 0xff, n & 0xff);
      }
      else {
        output.push(29, (n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff);
      }
    }

    function encOp(op) {
      if (op[0] === '@') {
        placeholders[op[1]] = output.push(29);
        output.push(0, 0, 0, 0);
        return;
      }
      for (var i = 1; i < op.length; i++) {
        if (typeof op[i] === 'number') {
          encNumber(op[i]);
        }
        else {
          encOp(op[i]);
        }
      }
      if (!(op[0] in dictOpcodes)) {
        throw new Error('unknown opcode ' + op[0]);
      }
      var opcode = dictOpcodes[op[0]];
      if (opcode >= 0x100) {
        output.push(opcode >> 8, opcode & 0xff);
      }
      else {
        output.push(opcode);
      }
    }

    for (var i = 0; i < sExpr.length; i++) {
      encOp(sExpr[i]);
    }

    output = new Uint8Array(output);
    for (var placeholder in placeholders) {
      output[placeholder] = new DataView(
        output.buffer,
        output.byteOffset + placeholders[placeholder],
        4);
    }
    return output;
  };

  function getOffSize(maxOffset) {
    if (maxOffset < 0x100) return 1;
    if (maxOffset < 0x10000) return 2;
    if (maxOffset < 0x1000000) return 3;
    return 4;
  }

  OTFTable.encodeIndex = function(byteArrays) {
    if (byteArrays.length === 0) return new Uint8Array(2);
    var dataLen = 0;
    for (var i = 0; i < byteArrays.length; i++) {
      dataLen += byteArrays[i].length;
    }
    var endOffset = 1 + dataLen;
    var offSize = getOffSize(endOffset);
    var headerLen = 3;
    var offsetTableLen = offSize * (byteArrays.length + 1);
    var buffer = new ArrayBuffer(headerLen + offsetTableLen + dataLen);
    var header = new DataView(buffer, 0, 3);
    var entries = new Array(byteArrays.length);
    header.setUint16(0, byteArrays.length);
    header.setUint8(2, offSize);
    var offset = 1;
    switch (offSize) {
      case 1:
        var offsets = new Uint8Array(buffer, header.byteLength, byteArrays.length+1);
        var data = new Uint8Array(buffer, offsets.byteOffset + offsets.byteLength - 1);
        for (var i = 0; i < byteArrays.length; i++) {
          offsets[i] = offset;
          entries[i] = data.subarray(offset, offset + byteArrays[i].length);
          entries[i].set(byteArrays[i]);
          offset += byteArrays[i].length;
        }
        offsets[byteArrays.length] = endOffset;
        break;
      case 2:
        var offsets = new DataView(buffer, header.byteLength, 2*(byteArrays.length+1));
        var data = new Uint8Array(buffer, offsets.byteOffset + offsets.byteLength - 1);
        for (var i = 0; i < byteArrays.length; i++) {
          offsets.setUint16(2*i, offset);
          entries[i] = data.subarray(offset, offset + byteArrays[i].length);
          entries[i].set(byteArrays[i]);
          offset += byteArrays[i].length;
        }
        offsets.setUint16(2*byteArrays.length, endOffset);
        break;
      case 3:
        var offsets = new DataView(buffer, header.byteLength, 3*(byteArrays.length+1));
        var data = new Uint8Array(buffer, offsets.byteOffset + offsets.byteLength - 1);
        for (var i = 0; i < byteArrays.length; i++) {
          offsets.setUint32(3*i, offset << 8);
          entries[i] = data.subarray(offset, offset + byteArrays[i].length);
          entries[i].set(byteArrays[i]);
          offset += byteArrays[i].length;
        }
        offsets.setUint8(3*byteArrays.length, endOffset >>> 16);
        offsets.setUint16(3*byteArrays.length + 1, endOffset & 0xffff);
        break;
      case 4:
        var offsets = new DataView(buffer, header.byteLength, 4*(byteArrays.length+1));
        var data = new Uint8Array(buffer, offsets.byteOffset + offsets.byteLength - 1);
        for (var i = 0; i < byteArrays.length; i++) {
          offsets.setUint32(4*i, offset, false);
          entries[i] = data.subarray(offset, offset + byteArrays[i].length);
          entries[i].set(byteArrays[i]);
          offset += byteArrays[i].length;
        }
        offsets.setUint32(4*byteArrays.length, endOffset);
        break;
    }
    var bytes = new Uint8Array(buffer);
    bytes.entries = entries;
    return bytes;
  };
  
  OTFTable.CompactFontFormat = function OTFCompactFontFormat(info) {
    var major = 1, minor = 0, headerSize = 4;
    
    var nameIndex = OTFTable.encodeIndex([
      encoder.encode('CIDFont'),
    ]);
    nameIndex.offset = headerSize;
    
    var strings = [];
    function getStringID(str) {
      // SIDs 0-381 are standard strings, so the first
      // entry in the string index is SID 382
      return strings.push(encoder.encode(str)) + 381;
    }
    
    var topDict = OTFTable.encodeDict([
      ['ROS', // registry, ordering, supplement
        getStringID('wotw'),
        getStringID('arbitrary'),
        0,
      ],
      ['FontMatrix', 1/info.unitsPerEm, 0, 0, 1/info.unitsPerEm, 0, 0],
      // 2 is the default for CharstringType, but:
      // <https://www.microsoft.com/typography/otspec/cff.htm>
      // ...says: "must specify"
      ['CharstringType', 2],
      ['FDArray', ['@','fontDictsAt']],
      ['FDSelect', ['@','fdSelectAt']],
      ['CharStrings', ['@','charStringsAt']],
    ]);
    var topDictIndex = OTFTable.encodeIndex([
      // .entries[0], overwritten later after topDict's placeholders are updated
      topDict,
    ]);
    topDictIndex.offset = nameIndex.offset + nameIndex.byteLength;
    
    var stringIndex = OTFTable.encodeIndex(strings);
    stringIndex.offset = topDictIndex.offset + topDictIndex.byteLength;

    var globalSubrIndex = OTFTable.encodeIndex([ ]);
    globalSubrIndex.offset = stringIndex.offset + stringIndex.byteLength;
    
    var fdSelect = new DataView(new ArrayBuffer(8));
    fdSelect.setUint8(0, 3);
    fdSelect.setUint16(1, 1);
    //fdSelect.setUint16(3, 0);
    //fdSelect.setUint8(5, 0);
    fdSelect.setUint16(6, info.glyphs.length);
    fdSelect = new Uint8Array(fdSelect.buffer);
    fdSelect.offset = globalSubrIndex.offset + globalSubrIndex.byteLength;

    var charStringIndex = OTFTable.encodeIndex(
      info.glyphs.map(function(glyph) {
        return OTFTable.encodeCharString(glyph.charString);
      })
    );
    charStringIndex.offset = fdSelect.offset + fdSelect.byteLength;
    
    var privateDict = OTFTable.encodeDict([ ]);
    privateDict.offset = charStringIndex.offset + charStringIndex.byteLength;

    var fontDictIndex = OTFTable.encodeIndex([
      OTFTable.encodeDict([
        ['Private', privateDict.byteLength, privateDict.offset],
      ]),
    ]);
    fontDictIndex.offset = privateDict.offset + privateDict.byteLength;

    topDict.fontDictsAt.setUint32(0, fontDictIndex.offset);
    topDict.fdSelectAt.setUint32(0, fdSelect.offset);
    topDict.charStringsAt.setUint32(0, charStringIndex.offset);
    topDictIndex.entries[0].set(topDict);

    OTFTable.call(this, 'CFF', fontDictIndex.offset + fontDictIndex.byteLength);
    
    var bytes = new Uint8Array(this.buffer);

    bytes[0] = major;
    bytes[1] = minor;
    bytes[2] = headerSize;
    bytes[3] = getOffSize(bytes.length);
    bytes.set(nameIndex, nameIndex.offset);
    bytes.set(topDictIndex, topDictIndex.offset);
    bytes.set(stringIndex, stringIndex.offset);
    bytes.set(globalSubrIndex, globalSubrIndex.offset);
    bytes.set(charStringIndex, charStringIndex.offset);
    bytes.set(fontDictIndex, fontDictIndex.offset);
    bytes.set(privateDict, privateDict.offset);
  };
  OTFTable.CompactFontFormat.prototype = Object.create(OTFTable.prototype);

  OTFTable.SbitLineMetricsView = function SbitLineMetricsView(buffer, byteOffset, byteLength) {
    this.sbytes = new Int8Array(buffer, byteOffset, byteLength);
  };
  OTFTable.SbitLineMetricsView.prototype = {
    get ascender()   { return this.sbytes[0]; },
    set ascender(v)  { this.sbytes[0] = v; },
    get descender()  { return this.sbytes[1]; },
    set descender(v) { this.sbytes[1] = v; },  
    get widthMax()   { return this.sbytes[2] & 0xff; },
    set widthMax(v)  { this.sbytes[2] = v; },
    get caretSlopeNumerator()    { return this.sbytes[3]; },
    set caretSlopeNumerator(v)   { this.sbytes[3] = v; },
    get caretSlopeDenominator()  { return this.sbytes[4]; },
    set caretSlopeDenominator(v) { this.sbytes[4] = v; },
    get caretOffset()   { return this.sbytes[5]; },
    set caretOffset(v)  { this.sbytes[5] = v; },
    get minOriginSB()   { return this.sbytes[6]; },
    set minOriginSB(v)  { this.sbytes[6] = v; },
    get minAdvanceSB()  { return this.sbytes[7]; },
    set minAdvanceSB(v) { this.sbytes[7] = v; },
    get maxBeforeBL()   { return this.sbytes[8]; },
    set maxBeforeBL(v)  { this.sbytes[8] = v; },
    get minAfterBL()    { return this.sbytes[9]; },
    set minAfterBL(v)   { this.sbytes[9] = v; },
  };
  OTFTable.SbitLineMetricsView.byteLength = 12;

  OTFTable.EmbeddedBitmapLocation = function OTFEmbeddedBitmapLocationTable(info) {
    var strikeRecordLength = (
      16
      + OTFTable.SbitLineMetricsView.byteLength * 2
      + 8);
    var indexSubTableArrayLength = 8;
    var size = (
      8
      + info.strikes.length * strikeRecordLength);
    OTFTable.call(this, 'EBLC', size);
  };
  OTFTable.EmbeddedBitmapLocation.prototype = Object.create(OTFTable.prototype);

  OTFTable.EmbeddedBitmapScaling = function OTFEmbeddedBitmapScalingTable(info) {
    OTFTable.call(
      this, 'EBSC',
      8 + (OTFTable.SbitLineMetricsView.byteLength * 2 + 4) * info.strikes.length);
  };
  OTFTable.EmbeddedBitmapScaling.prototype = Object.create(OTFTable.prototype);

  OTFTable.EmbeddedBitmapData = function OTFEmbeddedBitmapDataTable(info) {
  };
  OTFTable.EmbeddedBitmapData.prototype = Object.create(OTFTable.prototype);

  return OTFTable;

});
