
requirejs.config({
  timeout: Infinity,
});

require(['java', 'z'], function(java, z) {
  var xhr = new XMLHttpRequest;
  xhr.responseType = 'arraybuffer';
  xhr.open('GET', '//cors.archive.org/cors/misc_midlet/DoomRPG_s60v2-N70.jar');
  xhr.onload = function(e) {
    var jar = new Uint8Array(this.response);
    var dv = new DataView(this.response);
    var pos = 0;
    while (pos < jar.length) {
      if (dv.getUint32(pos, true) !== 0x04034b50) break;
      var compressionMethod = dv.getUint16(pos + 8, true);
      var compressedLen = dv.getUint32(pos + 18, true);
      var filenameLen = dv.getUint16(pos + 26, true);
      var extraLen = dv.getUint16(pos + 28, true);
      pos += 30;
      var filename = jar.subarray(pos, pos + filenameLen);
      pos += filenameLen;
      var extra = jar.subarray(pos, pos + extraLen);
      pos += extraLen;
      var compressed = jar.subarray(pos, pos + compressedLen);
      pos += compressedLen;
      filename = String.fromCharCode.apply(null, filename);
      console.log(filename, compressionMethod, compressedLen);
    }
  };
  xhr.send();
});
