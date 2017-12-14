define(['dataExtensions'], function(dataExtensions) {

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
  
  return bitmapTools;

});
