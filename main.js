
requirejs.config({
  waitSeconds: Infinity, // no timeout
});

require([
  'domReady!' // use domReady.js plugin to require DOM readiness
  ,'SWFReader'
],
function(
  domReady // unused value
  ,SWFReader
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

    var reader = new SWFReader({
      onunhandledtag: function(id, data) {
        console.log('unhandled', id, data);
      },
      onjpegtables: function(tables) {
        jpegTables = tables.slice(0, -2);
      },
      ondefine: function(id, type, def) {
        if (type === 'bitmap') {
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
          if (def.hardEdges) def.setAttribute('class', 'hard-edges');
          document.body.appendChild(img);
        }
        else if (type === 'shape') {
          var svg = document.createSVGElement('svg');
          svg.setAttribute('id', 'shape' + id);
          svg.setAttribute('viewBox', [def.bounds.left, def.bounds.top, def.bounds.width, def.bounds.height].join(' '));
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
                    }
                    break;
                }
              }
              svg.appendChild(el);
            }
          }
          document.body.appendChild(svg);
        }
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
    var specifier = location.hash.match(/^#\/?([^\/]+)\/([^\/]+)$/);
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
  
});
