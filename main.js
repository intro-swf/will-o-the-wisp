
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
  
  // function called on a Uint8Array containing swf data
  function init_bytes(bytes) {
    var reader = new SWFReader({
      ondefine: function(id, type, def) {
        if (type === 'shape') {
          var svg = document.createSVGElement('svg');
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
                el.setAttribute('stroke', stroke.color);
                el.setAttribute('stroke-width', stroke.width);
              }
              else {
                var fill = monoPaths[i].fillStyles[path.i_fill];
                if (typeof fill !== 'string') {
                  if (fill.type === 'gradient') {
                    fill = fill.stops[0].color;
                  }
                  else fill = '#000';
                }
                el.setAttribute('fill', fill);
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
