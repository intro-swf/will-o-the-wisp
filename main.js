
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
          var fillStyles = def.fillStyles, strokeStyles = def.strokeStyles;
          for (var i = 0; i < def.path.length; i++) {
            var segment = def.path[i];
            fillStyles = segment.fillStyles || fillStyles;
            strokeStyles = segment.strokeStyles || strokeStyles;
            var fill = fillStyles[segment.i_fill];
            if (typeof fill !== 'string') {
              if (fill.type === 'radialGradient' || fill.type === 'linearGradient') {
                fill = fill.stops[0].color;
              }
              else {
                fill = '#000';
              }
            }
            var stroke = strokeStyles[segment.i_stroke];
            var buf = [];
            for (var j = 0; j < segment.length; j++) {
              buf.push(segment[j].type + segment[j].values.join(' '));
            }
            var path = document.createSVGElement('path');
            path.setAttribute('d', buf.join(' '));
            if (fill !== '#000') {
              path.setAttribute('fill', fill);
            }
            if (stroke.width > 0 && stroke.stroke !== 'none' && stroke.stroke !== 'transparent') {
              path.setAttribute('stroke', stroke.stroke);
              path.setAttribute('stroke-width', stroke.width);
            }
            svg.appendChild(path);
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
