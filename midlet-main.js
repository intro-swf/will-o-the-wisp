
requirejs.config({
  timeout: Infinity,
});

require(['java', 'z'], function(java, z) {
  
  const utf8 = new TextDecoder('utf-8');
  
  function loadFiles(files, containerFilename) {
    var manifest = files['META-INF/MANIFEST.MF'];
    if (!manifest) {
      for (var k in files) {
        if (k.toUpperCase() === 'META-INF/MANIFEST.MF') {
          manifest = files[k];
          break;
        }
      }
      if (!manifest) {
        throw new Error('manifest not found');
      }
    }
    manifest = utf8.decode(manifest);
    console.log(manifest);
    manifest = java.parseManifestSections(manifest);
    console.log(manifest);
    var midlets = [];
    for (var i = 1; ; i++) {
      var midlet = manifest[0]['midlet-' + i];
      if (!midlet) break;
      var info = midlet.trim().split(/\s*,\s*/g);
      if (info.length !== 3) {
        throw new Error('invalid MIDlet');
      }
      midlets.push({name:info[0], icon:info[1], className:info[2]});
    }
    if (midlets.length === 0) {
      throw new Error('no midlets found');
    }
    else if (midlets.length > 1) {
      console.warn(midlets.length + ' midlets defined, ignoring all but the first');
    }
    var midlet = midlets[0];
    var icon = (midlet.icon || manifest[0]['midlet-icon'] || '').replace(/^\//, '');
    var title = midlet.name;
    if ('midlet-version' in manifest[0]) {
      title += ' ' + manifest[0]['midlet-version'];
    }
    document.title = title;
    if (icon) {
      var bytes = files[icon];
      if (!bytes) throw new Error('icon not found: ' + icon);
      var blob = new File([bytes], icon, {type:'image/png'});
      var favicon = document.createElement('LINK');
      favicon.setAttribute('rel', 'icon');
      favicon.setAttribute('type', 'image/png');
      favicon.setAttribute('href', URL.createObjectURL(blob));
      document.head.appendChild(favicon);
    }
    console.log(midlets);
    console.log(files);
    return;
    var classes = {};
    for (var filename in files) {
      if (/\.class$/i.test(filename)) {
        var bytes = files[filename];
        var classDef = new java.ClassView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        if (!classDef.hasValidSignature) {
          console.error('invalid class file: ' + filename);
          continue;
        }
        classes[classDef.name] = classDef;
      }
    }
    var refs = [];
    for (var className in classes) {
      var constants = classes[className].constants;
      for (var i = 0; i < constants.length; i++) {
        var c = constants[i];
        if (!c) continue;
        if (/Ref$/.test(c.type)) {
          var refClass = constants[constants[c.classIndex].nameIndex];
          if (!(refClass in classes)) {
            var nameAndType = constants[c.nameAndTypeIndex];
            var refMember = constants[nameAndType.nameIndex];
            var refType = constants[nameAndType.descriptorIndex];
            var ref = containerFilename + ' ' + refClass + ' ' + refMember + ' ' + refType;
            if (refs.indexOf(ref) === -1) refs.push(ref);
          }
        }
      }
    }
    console.log(refs.sort().join('\n'));
  }
  
  var xhr = new XMLHttpRequest;
  xhr.responseType = 'arraybuffer';
  var path = location.search.match(/^\??\/?([^\/]+\/[^\/].*?)\/?$/);
  path = path ? path[1] : 'misc_midlet/DoomRPG_s60v2-N70.jar';
  xhr.open('GET', '//cors.archive.org/cors/' + path);
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
        case 8:
          try {
            uncompressed = z.inflateRaw(compressed);
          }
          catch (e) {
            console.error('failed to decode '+filename, e);
            continue;
          }
          break;
      }
      if (uncompressed.length !== uncompressedLen) {
        console.error('failed to decode '+filename+': length mismatch');
        continue;
      }
      files[filename] = uncompressed;
    }
    loadFiles(files, path.replace(/^.*\//, ''));
  };
  xhr.send();
});
