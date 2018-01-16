
requirejs.config({
  timeout: Infinity,
});

require(['java', 'z'], function(java, z) {
  
  function loadFiles(files) {
    var classes = {};
    for (var filename in files) {
      if (/\.class$/i.test(filename)) {
        var classDef = new java.ClassView(files[filename]);
        if (!classDef.hasValidSignature) {
          throw new Error('invalid class file: ' + filename);
        }
        classes[classDef.name] = classDef;
      }
    }
    console.log(classes);
  }
  
  var xhr = new XMLHttpRequest;
  xhr.responseType = 'arraybuffer';
  xhr.open('GET', '//cors.archive.org/cors/misc_midlet/DoomRPG_s60v2-N70.jar');
  xhr.onload = function(e) {
    var jar = new Uint8Array(this.response);
    var dv = new DataView(this.response);
    var pos = 0;
    var files = {};
    while (pos < jar.length) {
      if (dv.getUint32(pos, true) !== 0x04034b50) break;
      var flags = dv.getUint16(pos + 6, true);
      var compressionMethod = dv.getUint16(pos + 8, true);
      var compressedLen = dv.getUint32(pos + 18, true);
      var uncompressedLen = dv.getUint32(pos + 22, true);
      var filenameLen = dv.getUint16(pos + 26, true);
      var extraLen = dv.getUint16(pos + 28, true);
      pos += 30;
      var filename = jar.subarray(pos, pos + filenameLen);
      pos += filenameLen;
      var extra = jar.subarray(pos, pos + extraLen);
      pos += extraLen;
      var compressed;
      if (flags & 8) {
        var startPos = pos;
        while (dv.getUint32(pos, true) !== 0x08074b50) {
          if (++pos >= jar.length) throw new Error('headerless data descriptor not supported');
        }
        compressedLen = dv.getUint32(pos + 8, true);
        uncompressedLen = dv.getUint32(pos + 12, true);
        compressed = jar.subarray(startPos, startPos + compressedLen);
        pos += 16;
      }
      else {
        compressed = jar.subarray(pos, pos + compressedLen);
        pos += compressedLen;
      }
      filename = String.fromCharCode.apply(null, filename);
      if (/\/$/.test(filename)) continue;
      var uncompressed;
      switch (compressionMethod) {
        case 0: uncompressed = compressed; break;
        case 8: uncompressed = z.inflateRaw(compressed); break;
      }
      if (uncompressed.length !== uncompressedLen) throw new Error('bad decompression');
      files[filename] = uncompressed;
    }
    loadFiles(files);
  };
  xhr.send();
});
