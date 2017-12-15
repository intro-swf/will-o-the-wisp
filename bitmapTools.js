define(['dataExtensions', 'z'], function(dataExtensions, z) {

  'use strict';
  
  const MARKER_TEM = 0xFF01
    ,MARKER_SOF0 = 0xFFC0
    ,MARKER_SOF1 = 0xFFC1
    ,MARKER_SOF2 = 0xFFC2
    ,MARKER_SOF3 = 0xFFC3
    ,MARKER_DHT = 0xFFC4
    ,MARKER_SOF5 = 0xFFC5
    ,MARKER_SOF6 = 0xFFC6
    ,MARKER_SOF7 = 0xFFC7
    ,MARKER_JPG = 0xFFC8
    ,MARKER_SOF9 = 0xFFC9
    ,MARKER_SOF10 = 0xFFCA
    ,MARKER_SOF11 = 0xFFCB
    ,MARKER_DAC = 0xFFCC
    ,MARKER_SOF13 = 0xFFCD
    ,MARKER_SOF14 = 0xFFCE
    ,MARKER_SOF15 = 0xFFCF
    ,MARKER_RST0 = 0xFFD0
    ,MARKER_RST1 = 0xFFD1
    ,MARKER_RST2 = 0xFFD2
    ,MARKER_RST3 = 0xFFD3
    ,MARKER_RST4 = 0xFFD4
    ,MARKER_RST5 = 0xFFD5
    ,MARKER_RST6 = 0xFFD6
    ,MARKER_RST7 = 0xFFD7
    ,MARKER_SOI = 0xFFD8
    ,MARKER_EOI = 0xFFD9
    ,MARKER_SOS = 0xFFDA
    ,MARKER_DQT = 0xFFDB
    ,MARKER_DNL = 0xFFDC
    ,MARKER_DRI = 0xFFDD
    ,MARKER_DXP = 0xFFDE
    ,MARKER_EXP = 0xFFDF
    ,MARKER_APP0 = 0xFFE0
    ,MARKER_APP15 = 0xFFEF
    ,MARKER_JPG0 = 0xFFF0
    ,MARKER_JPG13 = 0xFFFD
    ,MARKER_COM = 0xFFFE
  ;
  
  Uint8Array.prototype.readJPEGInfo = function() {
    var data = this.subarray(this.offset);
    if (data.readUint16BE() !== MARKER_SOI) throw new Error('invalid JPEG data');
    var marker;
    var info = {};
    markerLoop: for (;;) switch (marker = data.readUint16BE()) {
      case MARKER_EOI: break markerLoop;
      
      case MARKER_TEM:
      case MARKER_RST0:
      case MARKER_RST1:
      case MARKER_RST2:
      case MARKER_RST3:
      case MARKER_RST4:
      case MARKER_RST5:
      case MARKER_RST6:
      case MARKER_RST7:
        // no data
        continue;
      
      case MARKER_SOF0:
      case MARKER_SOF1:
        var len = data.readUint16BE() - 2;
        if (len < 0) throw new Error('invalid JPEG data');
        if ((data.offset + len) >= data.length) {
          throw new Error('unexpected end of JPEG data');
        }
        var startOfFrame = data.readSubarray(len);
        var bitsPerSample = startOfFrame.readUint8();
        info.height = startOfFrame.readUint16BE();
        info.width = startOfFrame.readUint16BE();
        continue;
       
      case MARKER_DHT:
        info.hasHuffmanTables = true;
        var len = data.readUint16BE() - 2;
        if (len < 0) throw new Error('invalid JPEG data');
        if ((data.offset += len) >= data.length) {
          throw new Error('unexpected end of JPEG data');
        }
        continue;
      
      case MARKER_SOS:
        var len = data.readUint16BE() - 2;
        if (len < 0) throw new Error('invalid JPEG data');
        if ((data.offset += len) >= data.length) {
          throw new Error('unexpected end of JPEG data');
        }
        for (;;) {
          if (data.readUint8() !== 0xFF) continue;
          var marker = data.readUint8();
          if (marker === 0 || (marker >= 0xD0 && marker <= 0xD7)) {
            continue;
          }
          data.offset -= 2;
          break;
        }
        continue;
      
      default:
        if (marker&0xFF00 !== 0xFF00) {
          throw new Error('invalid JPEG data');
        }
        var len = data.readUint16BE() - 2;
        if (len < 0) throw new Error('invalid JPEG data');
        if ((data.offset += len) >= data.length) {
          throw new Error('unexpected end of JPEG data');
        }
        continue;
    }
    info.data = data.subarray(0, data.offset);
    this.offset += info.data.length;
    return info;
  };
  
  var bitmapTools = {};
  
  bitmapTools.jpegJoin = function(jpeg1, jpeg2) {
    if (jpeg1 instanceof Blob) jpeg1 = jpeg1.slice(0, -2);
    else jpeg1 = jpeg1.subarray(0, -2);
    if (jpeg2 instanceof Blob) jpeg2 = jpeg2.slice(2);
    else jpeg2 = jpeg2.subarray(2);
    return new Blob([jpeg1, jpeg2], {type:'image/jpeg'});
  };
  
  bitmapTools.makeBitmapBlob = function makeBitmapBlob(def) {
    switch (def.bpp) {
      case 1: case 2: case 4: case 8:
        if (!def.palette) {
          throw new Error('palette must be defined at ' + def.bpp + 'bpp');
        }
        break;
      case 16: case 24: case 32:
        if (def.palette) {
          throw new Error('palette cannot be defined for ' + def.bpp + 'bpp');
        }
        break;
      default:
        throw new Error('invalid bpp value');
    }
    
    var parts = [new Uint8Array([0x89]), 'PNG\r\n\x1A\n'];

    function chunk(name, buf) {
      var info = new ArrayBuffer(8);
      var lenDV = new DataView(info, 0, 4);
      var crcDV = new DataView(info, 4, 4);
      var crc = new Uint8Array([
        name.charCodeAt(0),
        name.charCodeAt(1),
        name.charCodeAt(2),
        name.charCodeAt(3),
      ]).getCRC32();
      if (typeof buf.byteLength === 'number') {
        lenDV.setUint32(0, buf.byteLength);
        if (!(buf instanceof Uint8Array)) {
          buf = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
        }
        crcDV.setUint32(0, buf.getCRC32(crc));
        parts.push(lenDV, name, buf, crcDV);
      }
      else {
        var len = 0;
        parts.push(lenDV, name);
        for (var i = 0; i < buf.length; i++) {
          var part = buf[i];
          len += buf[i].byteLength;
          if (!(part instanceof Uint8Array)) {
            part = new Uint8Array(part.buffer, part.byteOffset, part.byteLength);
          }
          crc = part.getCRC32(crc);
          parts.push(part);
        }
        lenDV.setUint32(0, len);
        crcDV.setUint32(0, crc);
        parts.push(crcDV);
      }
    }

    const rows = def.rows;
    
    {
      var IHDR = new DataView(new ArrayBuffer(13));
      var width = ('width' in def) ? def.width : rows[0].length * 8 / def.bpp;
      var height = rows.length;
      IHDR.setUint32(0, width);
      IHDR.setUint32(4, height);
      IHDR.setUint8(8, def.palette ? def.bpp : 8);
      IHDR.setUint8(9,
        (def.palette ? 1 : 0)
        | 2 // color used
        | (def.bpp === 32 && !def.ignoreAlpha ? 4 : 0) // tRNS not represented here
      );
      chunk('IHDR', IHDR);
    }

    if (def.palette) {
      const palette = def.palette;
      var PLTE = new Uint8Array(3 * palette.length);
      var tRNS = new Uint8Array(palette.length);
      var palbytes = new Uint8Array(palette.buffer, palette.byteOffset, palette.byteLength);
      var top_tRNS = -1;
      for (var i = 0; i < palette.length; i++) {
        PLTE[i*3 + 0] = palbytes[i*4 + 0];
        PLTE[i*3 + 1] = palbytes[i*4 + 1];
        PLTE[i*3 + 2] = palbytes[i*4 + 2];
        if ((tRNS[i] = palbytes[i*4 + 3]) !== 0xff) {
          top_tRNS = i;
        }
      }
      chunk('PLTE', PLTE);
      if (top_tRNS >= 0) {
        chunk('tRNS', tRNS.subarray(0, top_tRNS + 1));
      }
    }

    {
      // all rows must be prepended with filter byte
      var rowBytes = 1 + rows[0].length;
      var IDAT = new Uint8Array(rows.length * rowBytes);
      for (var i = 0; i < rows.length; i++) {
        IDAT.set(rows[i], i*rowBytes + 1);
      }
      IDAT = IDAT.toZStoredParts();
      chunk('IDAT', IDAT);
    }

    chunk('IEND', new Uint8Array(0));
    return new Blob(parts, {type:'image/png'});
  };
  
  return bitmapTools;

});
