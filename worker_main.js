
importScripts('require.js');

require(['ChunkReader'], function(ChunkReader) {

  var mainReader = new ChunkReader;
  self.addEventListener('rawchunk', function onrawchunk(e) {
    mainReader.append(e.detail);
  });
  
  mainReader.gotBytes(8).then(function(bytes) {
    var reader = mainReader;
    switch (String.fromCharCode(bytes[0], bytes[1], bytes[2])) {
      case 'CWS': reader = reader.makeInflateReader(); break;
      case 'FWS': break;
      default: throw new Error('invalid header');
    }
    var version = bytes[3];
    var uncompressedFileSize = new DataView(bytes.buffer, bytes.byteOffset+4, 4).getUint32(0, true);
    var frameBounds, framesPerSecond, frameCount;
    return reader.gotSWFRect().then(function(rect) {
      frameBounds = rect;
      return reader.gotUint16LE();
    })
    .then(function(fps) {
      framesPerSecond = fps / 0x100;
      return reader.getUint16LE();
    })
    .then(function(count) {
      frameCount = count;
      postMessage(JSON.stringify(['init', {
        version: version,
        frameBounds: frameBounds,
        frameCount: frameCount,
        framesPerSecond: framesPerSecond,
      }]));
    });
  });

  self.onmessage = function(e) {
    this.onmessage = null; // one-shot worker
    var message = e.data;
    if (typeof message === 'string') {
      var url = message;
      if ('Response' in self && 'body' in Response.prototype) {
        fetch(url).then(function(response) {
          var reader = response.body.getReader();
          function onchunk(chunk) {
            if (chunk.done) {
              self.close();
              return;
            }
            self.dispatchEvent(new CustomEvent('rawchunk', {detail:chunk.value}));
            reader.read().then(onchunk);
          }
          return reader.read().then(onchunk);
        });
      }
      else {
        var xhr = new XMLHttpRequest;
        xhr.open('GET', url, false);
        xhr.responseType = 'moz-chunked-arraybuffer';
        if (xhr.responseType === 'moz-chunked-arraybuffer') {
          xhr.onprogress = function(e) {
            self.dispatchEvent(new CustomEvent('rawchunk', {detail:new Uint8Array(this.response)}));
          };
          xhr.onload = function(e) {
            self.close();
          };
        }
        else {
          xhr.responseType = 'arraybuffer';
          xhr.onload = function(e) {
            self.dispatchEvent(new CustomEvent('rawchunk', {detail:new Uint8Array(this.response)}));
            self.close();
          };
        }
        xhr.send();
      }
    }
    else {
      throw new Error('unsupported source type');
    }
  };

});
