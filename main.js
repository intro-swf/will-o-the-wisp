
requirejs.config({
  waitSeconds: Infinity, // no timeout
});

if (0) require([
  'domReady!' // use domReady.js plugin to require DOM readiness
  ,'SWFReader'
  ,'OTFTable'
],
function(
  domReady // unused value
  ,SWFReader
  ,OTFTable
){
  
  'use strict';
  
  document.createSVGElement = function(name) {
    return this.createElementNS('http://www.w3.org/2000/svg', name);
  };
  
  var nextGradID = 1;
  var nextClip = 1;
  
  // function called on a Uint8Array containing swf data
  function init_bytes(bytes) {
    var jpegTables;
    var bitmapURLs = {};
    var fonts = {};
    
    function make_font(font, id) {
      var strings = [];
      strings.push({platformId:0, encodingId:0, languageId:0, nameId:1, text:'Anon'});
      if (font.bold) {
        if (font.italic) {
          strings.push({platformId:0, encodingId:0, languageId:0, nameId:2, text:'Bold Italic'});
        }
        else {
          strings.push({platformId:0, encodingId:0, languageId:0, nameId:2, text:'Bold'});
        }
      }
      else if (font.italic) {
        strings.push({platformId:0, encodingId:0, languageId:0, nameId:2, text:'Italic'});
      }
      else {
        strings.push({platformId:0, encodingId:0, languageId:0, nameId:2, text:'Regular'});
      }
      var info = {
        flags: (
          1 // y value of 0 specifies baseline
          | 8 // integer math
        ),
        unitsPerEm: 1024,
        xMin: 0, yMin: 0,
        xMax: 1024, yMax: 1024,
        macStyle: (font.bold?1:0) | (font.italic?2:0),
        smallestReadablePixelSize: 1, // not sure
        longOffsets: false,
        
        ascender: 1024,
        descender: 0,
        lineGap: 0,
        advanceWidthMax: 1024,
        minLeftSideBearing: 0,
        minRightSideBearing: 0,
        xMaxExtent: 1024,
        caretSlopeRise: 1,
        caretSlopeRun: 0,
        caretOffset: 0,
        
        glyphs: new Array(font.glyphs.length),
        
        strings: strings,
        
        xAvgCharWidth: 1024,
        usWeightClass: font.bold ? 700 : 500,
        usWidthClass: 5,
        fsType: 0,
        ySubscriptXSize: 512,
        ySubscriptYSize: 512,
        ySubscriptXOffset: 0,
        ySubscriptYOffset: 0,
        ySuperscriptXSize: 512,
        ySuperscriptYSize: 512,
        ySuperscriptXOffset: 0,
        ySuperscriptYOffset: 512,
        yStrikeoutSize: 64,
        yStrikeoutPosition: 256,
        sFamilyClass: 0,
        // all PANOSE set to 0
        ulUnicodeRange1: 3, // 0x00-0xFF
        ulUnicodeRange2: 0,
        ulUnicodeRange3: 0,
        ulUnicodeRange4: 0,
        vendor4CC: 'wotw',
        fsSelection: (font.italic?1:0) | (font.bold?1<<5:0),
        usFirstCharIndex: 0x20,
        usLastCharIndex: 0xFFFF,
        sTypoAscender: 1024,
        sTypoDescender: 0,
        sTypoLineGap: 0,
        usWinAscent: 1024,
        usWinDescent: 0,
        ulCodePageRange1: 1, // Latin-1
        ulCodePageRange2: 0,
        sxHeight: 0,
        sCapHeight: 0,
        usDefaultChar: 0,
        usBreakChar: 0x20,
        usMaxContext: 1,
        usLowerOpticalPointSize: 1,
        usUpperOpticalPointSize: 0xFFFF,
        
        underlinePosition: 0,
        underlineThickness: 16,
        isMonospace: 1,
      };
      for (var i_glyph = 0; i_glyph < font.glyphs.length; i_glyph++) {
        var glyph = font.glyphs[i_glyph];
        info.glyphs[i_glyph] = {
          char: glyph.char || String.fromCodePoint(33 + i_glyph),
          charString: glyph.path.toCFF2Path(),
          advanceWidth: 1024,
          leftSideBearing: 0,
        };
      }
      info.glyphs.splice(0, 0, {
        char: '\0',
        charString: [],
        advanceWidth: 1024,
        leftSideBearing: 0,
      });
      var otf = OTFTable.joinToFile([
        new OTFTable.CharacterGlyphMap(info),
        new OTFTable.FontHeader(info),
        new OTFTable.HorizontalHeader(info),
        new OTFTable.HorizontalMetrics(info),
        new OTFTable.MaximumProfile(info),
        new OTFTable.Naming(info),
        new OTFTable.MetricsForOS2(info),
        new OTFTable.PostScript(info),
        new OTFTable.CompactFontFormat(info),
      ], 'font.otf');
      var style = document.createElement('STYLE');
      style.textContent = [
        '@font-face {',
          'font-family: "_'+id+'";',
          'font-weight: '+(font.bold?'bold':'normal')+';',
          'font-style: '+(font.italic?'italic':'normal')+';',
          'src: url("'+URL.createObjectURL(otf)+'") format("opentype");',
        '}',
      ].join(' ');
      document.head.appendChild(style);
      return '"_' + id + '"';
    }

    var reader = new SWFReader({
      onunhandledtag: function(id, data) {
        console.log('unhandled', id, data);
      },
      onjpegtables: function(tables) {
        jpegTables = tables.slice(0, -2);
      },
      onopen: function(what) {
        switch (what) {
          case 'movie':
            this.streamTarget = this;
            break;
          case 'sprite':
            this.streamTarget = this.currentSprite = {};
            break;
        }
      },
      onclose: function(what) {
        switch (what) {
          case 'movie':
            if (this.stream) {
              this.onclosestream();
            }
            break;
          case 'sprite':
            if (this.currentSprite.stream) {
              this.onclosestream();
            }
            this.streamTarget = this;
            break;
        }
      },
      oninitstream: function(stream) {
        var target = this.streamTarget;
        if (target.stream) this.onclosestream();
        target.stream = stream;
        var audioEl = target.streamAudioEl = document.createElement('AUDIO');
        audioEl.controls = true;
        document.body.appendChild(audioEl);
        switch (stream.format) {
          case 'mp3':
            target.whenSourceBufferAvailable = new Promise(function(resolve, reject) {
              var mediaSource = new MediaSource;
              mediaSource.onsourceopen = function(e) {
                if (stream.format === 'mp3') {
                  var sourceBuffer = this.addSourceBuffer('audio/mpeg');
                  sourceBuffer.mediaSource = this;
                  resolve(sourceBuffer);
                }
              };
              audioEl.src = URL.createObjectURL(mediaSource);
            });
            break;
          case 'adpcm':
            target.streamParts = [];
            break;
        }
      },
      onencodedstream: function(bytes, extra) {
        var target = this.streamTarget;
        target.whenSourceBufferAvailable = target.whenSourceBufferAvailable.then(function(sourceBuffer) {
          return new Promise(function(resolve, reject) {
            sourceBuffer.addEventListener('updateend', function onupdateend() {
              this.removeEventListener('updateend', onupdateend);
              resolve(this);
            });
            sourceBuffer.appendBuffer(bytes);
          });
        });
      },
      ondecodedstream: function(wav) {
        this.streamTarget.streamParts.push(wav);
      },
      onclosestream: function() {
        var target = this.streamTarget;
        delete this.streamTarget;
        if (target.whenSourceBufferAvailable) {
          target.whenSourceBufferAvailable.then(function(sourceBuffer) {
            sourceBuffer.mediaSource.endOfStream();
          });
          delete target.whenSourceBufferAvailable;
        }
        else if (target.streamParts && target.streamParts.length > 0) {
          var totalSizeSlot = new DataView(new ArrayBuffer(4));
          var dataSizeSlot = new DataView(new ArrayBuffer(4));
          var parts = [
            'RIFF', totalSizeSlot, 'WAVE',
            'fmt ', target.streamParts[0].slice(16, 36),
            'data', dataSizeSlot,
          ];
          var dataSize = 0;
          for (var i = 0; i < target.streamParts.length; i++) {
            var part = target.streamParts[i].slice(44);
            dataSize += part.size;
            parts.push(part);
          }
          totalSizeSlot.setUint32(0, 36 + dataSize, true);
          dataSizeSlot.setUint32(0, dataSize, true);
          target.streamAudioEl.src = URL.createObjectURL(new Blob(parts, {type:'audio/x-wav'}));
        }
      },
      ondefine: function(id, type, def) {
        switch (type) {
          case 'bitmap':
            if (def.type === 'image/jpeg; encoding-tables=no') {
              if (!jpegTables) {
                throw new Error('no jpeg tables found')
              }
              def = new File([jpegTables, def.slice(2)], id+'.jpg', {type:'image/jpeg'});
            }
            var url = URL.createObjectURL(def);
            bitmapURLs[id] = url;
            var img = document.createElement('IMG');
            img.src = url;
            if (def.hardEdges) img.setAttribute('class', 'hard-edges');
            document.body.appendChild(img);
            break;
          case 'shape':
            var svg = document.createSVGElement('svg');
            svg.setAttribute('id', 'shape' + id);
            svg.setAttribute('viewBox', [def.bounds.left, def.bounds.top, def.bounds.width, def.bounds.height].join(' '));
            if (def.morphTo && !def.bounds.isEqualTo(def.morphTo.bounds)) {
              var animate = document.createSVGElement('animate');
              animate.setAttribute('attributeName', 'viewBox');
              var fromBox = def.bounds;
              var toBox = def.morphTo.bounds;
              animate.setAttribute('from', [fromBox.left, fromBox.top, fromBox.width, fromBox.height].join(' '));
              animate.setAttribute('to', [toBox.left, toBox.top, toBox.width, toBox.height].join(' '));
              animate.setAttribute('dur', '5s');
              animate.setAttribute('repeatCount', 'indefinite');
              svg.appendChild(animate);
            }
            svg.setAttribute('width', def.bounds.width/20);
            svg.setAttribute('height', def.bounds.height/20);
            var monoPaths = def.path.toMonoPaths();
            for (var i = 0; i < monoPaths.length; i++) {
              for (var j = 0; j < monoPaths[i].paths.length; j++) {
                var el = document.createSVGElement('path');
                var path = monoPaths[i].paths[j];
                el.setAttribute('d', path.map(v => v.type + v.values.join(' ')).join(''));
                if (path.mode === 'stroke') {
                  el.setAttribute('fill', 'none');
                  var stroke = monoPaths[i].strokeStyles[path.i_stroke];
                  el.setAttribute('stroke', stroke.color.solidColor);
                  if (stroke.color.opacity !== 1) {
                    el.setAttribute('stroke-opacity', stroke.color.opacity);
                  }
                  el.setAttribute('stroke-width', stroke.width);
                }
                else {
                  var fill = monoPaths[i].fillStyles[path.i_fill];
                  switch (fill.type) {
                    case 'color':
                      el.setAttribute('fill', fill.solidColor);
                      if (fill.opacity !== 1) {
                        el.setAttribute('fill-opacity', fill.opacity);
                      }
                      if (def.morphTo && !fill.isEqualTo(def.morphTo.path.fillStyles[path.i_fill])) {
                        var toFill = def.morphTo.path.fillStyles[path.i_fill];
                        var animate = document.createSVGElement('animate');
                        animate.setAttribute('attributeName', 'fill');
                        animate.setAttribute('from', fill.solidColor);
                        animate.setAttribute('to', toFill.solidColor);
                        animate.setAttribute('dur', '5s');
                        animate.setAttribute('repeatCount', 'indefinite');
                        el.appendChild(animate);
                        var animate = document.createSVGElement('animate');
                        animate.setAttribute('attributeName', 'fill-opacity');
                        animate.setAttribute('from', fill.opacity);
                        animate.setAttribute('to', toFill.opacity);
                        animate.setAttribute('dur', '5s');
                        animate.setAttribute('repeatCount', 'indefinite');
                        el.appendChild(animate);
                      }
                      break;
                    case 'gradient':
                      var grad = document.createSVGElement(fill.mode + 'Gradient');
                      grad.setAttribute('id', 'grad' + nextGradID++);
                      grad.setAttribute('gradientUnits', 'userSpaceOnUse');
                      if (fill.mode === 'radial') {
                        grad.setAttribute('r', 16384);
                        grad.setAttribute('cx', 0);
                        grad.setAttribute('cy', 0);
                      }
                      else {
                        grad.setAttribute('x1', -16384);
                        grad.setAttribute('x2', 16384);
                      }
                      grad.setAttribute('gradientTransform', fill.matrix.toString());
                      for (var i_stop = 0; i_stop < fill.stops.length; i_stop++) {
                        var stop = fill.stops[i_stop];
                        var stopEl = document.createSVGElement('stop');
                        stopEl.setAttribute('offset', stop.ratio);
                        stopEl.setAttribute('stop-color', stop.color.solidColor);
                        if (stop.color.opacity !== 1) {
                          stopEl.setAttribute('stop-opacity', stop.color.opacity);
                        }
                        grad.appendChild(stopEl);
                      }
                      svg.appendChild(grad);
                      el.setAttribute('fill', 'url("#' + grad.getAttribute('id') + '")');
                      break;
                    case 'bitmap':
                      if (fill.mode === 'clipped') {
                        var clip = document.createSVGElement('clipPath');
                        clip.setAttribute('id', 'clip' + nextClip++);
                        clip.appendChild(el);
                        el = clip;
                        var img = document.createSVGElement('image');
                        if (!(fill.bitmapID in bitmapURLs)) {
                          throw new Error('no bitmap url found');
                        }
                        img.setAttribute('href', bitmapURLs[fill.bitmapID]);
                        img.setAttribute('transform', fill.matrix.toString());
                        img.setAttribute('clip-path', 'url("#' + clip.getAttribute('id') + '")');
                        svg.appendChild(img);
                      }
                      else {
                        console.log('TODO: tiled bitmaps');
                        // just draw clipped for now
                        var clip = document.createSVGElement('clipPath');
                        clip.setAttribute('id', 'clip' + nextClip++);
                        clip.appendChild(el);
                        el = clip;
                        var img = document.createSVGElement('image');
                        if (!(fill.bitmapID in bitmapURLs)) {
                          throw new Error('no bitmap url found');
                        }
                        img.setAttribute('href', bitmapURLs[fill.bitmapID]);
                        img.setAttribute('transform', fill.matrix.toString());
                        img.setAttribute('clip-path', 'url("#' + clip.getAttribute('id') + '")');
                        svg.appendChild(img);
                      }
                      break;
                  }
                }
                svg.appendChild(el);
              }
            }
            document.body.appendChild(svg);
            break;
          case 'sound':
            var audio = document.createElement('AUDIO');
            audio.src = URL.createObjectURL(def.file);
            audio.controls = true;
            document.body.appendChild(audio);
            break;
          case 'font':
            fonts[id] = def;
            break;
          case 'text':
            var svg = document.createSVGElement('svg');
            svg.setAttribute('id', 'text' + id);
            svg.setAttribute('viewBox', [def.bounds.left, def.bounds.top, def.bounds.width, def.bounds.height].join(' '));
            svg.setAttribute('width', def.bounds.width/20);
            svg.setAttribute('height', def.bounds.height/20);
            var text = document.createSVGElement('text');
            text.setAttribute('style', 'white-space:pre');
            text.setAttribute('xml:space', 'preserve');
            /*
            if (!def.matrix.isIdentity) {
              text.setAttribute('transform', def.matrix.toString());
            }
            */
            var font, color = new SWFReader.Color, lastX = 0, lastY = 0, fontSize;
            for (var i_segment = 0; i_segment < def.segments.length; i_segment++) {
              var segment = def.segments[i_segment];
              color = segment.color || color;
              if ('fontID' in segment) {
                font = fonts[segment.fontID];
                font.family = font.family || make_font(font, segment.fontID);
                fontSize = segment.fontHeight;
              }
              var tspan = document.createSVGElement('tspan');
              tspan.setAttribute('font-family', font.family);
              tspan.setAttribute('font-size', fontSize);
              if (font.bold) tspan.setAttribute('font-weight', 'bold');
              if (font.italic) tspan.setAttribute('font-style', 'italic');
              if ('dx' in segment) lastX = def.bounds.left + segment.dx;
              var x = [lastX];
              for (var i_advance = 0; i_advance < segment.advance.length; i_advance++) {
                x.push(lastX += segment.advance[i_advance]);
              }
              x.pop();
              tspan.setAttribute('x', x.join(' '));
              if ('dy' in segment) lastY = def.bounds.top + segment.dy;
              tspan.setAttribute('y', lastY);
              if (color.solidColor !== '#000') {
                tspan.setAttribute('fill', color.solidColor);
              }
              if (color.opacity !== 1) {
                tspan.setAttribute('fill-opacity', color.opacity);
              }
              var textContent = [];
              for (var i_glyph = 0; i_glyph < segment.glyphs.length; i_glyph++) {
                var glyphNumber = segment.glyphs[i_glyph];
                var glyph = font.glyphs[glyphNumber];
                textContent.push(glyph.char || String.fromCodePoint(33 + glyphNumber));
              }
              tspan.textContent = textContent.join('');
              text.appendChild(tspan);
            }
            svg.appendChild(text);
            document.body.appendChild(svg);
            break;
          default:
            console.log(type, id, def);
            break;
        }
      },
      onupdate: function(id, patch) {
        if (id in fonts) {
          var font = fonts[id];
          if ('glyphs' in patch) {
            var glyphPatches = patch.glyphs;
            delete patch.glyphs;
            for (var i = 0; i < glyphPatches.length; i++) {
              Object.assign(font.glyphs[i], glyphPatches[i]);
            }
          }
          Object.assign(font, patch);
        }
        else {
          console.log('update', id, patch);
        }
      },
      ondisplaylistaction: function(depth, action, settings) {
        console.log(action, depth, settings);
      },
    });
    reader.read(bytes);
  }
  
  // function called on a blob containing swf data
  function init_blob(blob) {
    var fr = new FileReader;
    fr.onload = function(e) {
      init_bytes(new Uint8Array(this.result));
    };
    fr.readAsArrayBuffer(blob);
  }
  
  // function called when it's time to look at the location hash
  // i.e. on page load and if/when the hash changes
  function init_hash() {
    var specifier = location.hash.match(/^#\/?([^\/]+)\/(.+)$/);
    if (!specifier) {
      return;
    }
    var item = specifier[1];
    var filename = specifier[2];
    var xhr = new XMLHttpRequest;
    xhr.open('GET', '//cors.archive.org/cors/' + item + '/' + filename);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
      init_blob(this.response);
    };
    xhr.send();
  }
  
  init_hash();
  window.addEventListener('hashchange', init_hash);
  
})
else require([
  'domReady!' // use domReady.js plugin to require DOM readiness
  ,'SWFDecoderClient'
], function(
  _ // domReady
  ,SWFDecoderClient
) {
  
  'use strict';
  
  var client;
  
  // function called when it's time to look at the location hash
  // i.e. on page load and if/when the hash changes
  function init_hash() {
    const specifier = location.hash.match(/^#\/?([^\/]+)\/(.+)$/);
    if (!specifier) {
      return;
    }
    const item = specifier[1];
    const path = specifier[2];
    if (client) {
      client.close();
    }
    var movie = document.getElementById('movie');
    client = new SWFDecoderClient;
    client.onframeset = function onframeset(frameset) {
      var parts = frameset.bounds.split(/ /g);
      movie.setAttribute('viewBox', frameset.bounds);
      movie.setAttribute('width', (parts[2] - parts[0]) / 20);
      movie.setAttribute('height', (parts[3] - parts[1]) / 20);
      console.log('frameset', frameset);
    };
    client.onframe = function onframe(frame) {
      console.log('frame', frame);
    };
    client.open('//cors.archive.org/cors/' + item + '/' + path);
  }
  
  init_hash();
  window.addEventListener('hashchange', init_hash);
  
});
