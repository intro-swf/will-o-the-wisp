
requirejs.config({
  waitSeconds: Infinity, // no timeout
});

require([
  'domReady!', // use domReady.js plugin to require DOM readiness
],
function(
  domReady // unused value
){
  
  'use strict';
  
  // function called on a blob containing swf data
  function init_blob(blob) {
    console.log(blob.size);
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
      init_blob(this.result);
    };
    xhr.send();
  }
  
  init_hash();
  window.addEventListener('hashchange', init_hash);
  
});
