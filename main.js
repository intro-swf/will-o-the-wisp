
requirejs.config({
  waitSeconds: Infinity, // no timeout
});

require([
  'domReady!' // use domReady.js plugin to require DOM readiness
  ,'arrayExtensions'
  ,'SWFDecoderClient'
  ,'DisplayList'
], function(
  domReady
  ,arrayExtensions
  ,SWFDecoderClient
  ,DisplayList
) {
  
  'use strict';
  
  function createSVGElement(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
  }
  
  var slotTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  slotTemplate.idBase = 'slot';
  slotTemplate.style.display = 'none';
  slotTemplate.onclean = function() {
    this.style.display = 'none';
  };
  slotTemplate.addEventListener('display-list-instantiate', function(e) {
    var displayList = e.detail.displayList;
    var slot = e.detail.displayObject;
    displayList.addEventListener('clean', this.onclean.bind(slot));
  });

  var cxformTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  cxformTemplate.idBase = 'cxform';
  cxformTemplate.setAttribute('color-interpolation-filters', 'sRGB');
  var cxformMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
  cxformMatrix.setAttribute('values', '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
  cxformTemplate.appendChild(cxformMatrix);
  cxformTemplate.addEventListener('display-list-instantiate', function(e) {
    var displayList = e.detail.displayList;
    var cxform = e.detail.displayObject;
    var cxformMatrix = cxform.firstChild;
    var values = cxformMatrix.values.baseVal;
    cxform.mulR = values.getItem(0);
    cxform.addR = values.getItem(4);
    cxform.mulG = values.getItem(6);
    cxform.addG = values.getItem(9);
    cxform.mulB = values.getItem(12);
    cxform.addB = values.getItem(14);
    cxform.mulA = values.getItem(18);
    cxform.addA = values.getItem(19);
  });

  var clipPathTemplate = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
  clipPathTemplate.addEventListener('display-list-instantiate', function(e) {
    var displayList = e.detail.displayList;
    var clipPath = e.detail.displayObject;
    clipPath.displayList = new DisplayList(clipPath);
  });
  
  var client;
  
  // function called when it's time to look at the location hash
  // i.e. on page load and if/when the hash changes
  function init_hash() {
    const specifier = location.search.match(/^\?\/?([^\/]+)\/(.+)$/);
    if (!specifier) {
      return;
    }
    const item = specifier[1];
    const path = specifier[2];
    if (client) {
      client.close();
    }
    var movie = document.getElementById('movie');
    movie.appendChild(movie.defs = createSVGElement('defs'));
    movie.appendChild(movie.stage = createSVGElement('g'));
    var displayList = movie.stage.displayList = new DisplayList(movie.stage);
    var scrubber = document.getElementById('scrubber');
    client = new SWFDecoderClient;
    function drawFrame(n) {
      displayList.goToFrame(n);
    }
    client.onframeset = function onframeset(frameset) {
      var parts = frameset.bounds.split(/ /g);
      movie.setAttribute('viewBox', frameset.bounds);
      movie.setAttribute('width', (parts[2] - parts[0]) / 20);
      movie.setAttribute('height', (parts[3] - parts[1]) / 20);
      scrubber.max = frameset.count-1;
      scrubber.onchange = function(e) {
        var frame = +this.value;
        if (frame >= displayList.frames.length) {
          this.value = displayList.frames.length-1;
        }
        else {
          drawFrame(frame);
        }
      };
      console.log('frameset', frameset);
    };
    var templates = {};
    client.ondef = function(def) {
      movie.defs.appendChild(def);
    };
    client.onbutton = function(button) {
      var template = createSVGElement('g');
      template.idBase = button.id.replace(/^#/, '') + '_';
      template.setAttribute('class', 'button');
      template.setAttribute('tabindex', '0');
      template.style.display = 'none';
      template.onclean = function() {
        this.style.display = 'none';
      };
      template.addEventListener('display-list-instantiate', function(e) {
        var displayList = e.detail.displayList;
        var button = e.detail.displayObject;
        displayList.addEventListener('clean', this.onclean.bind(button));
      });
      templates[button.id] = template;
    };
    client.onframe = function onframe(def) {
      displayList.withFrame(function(frame) {
        for (var i_update = 0; i_update < def.updates.length; i_update++) {
          var update = def.updates[i_update];
          switch (update.type) {
            case 'insert':
            case 'replace':
              var displayObject;
              if (update.url in templates) {
                displayObject = frame.setDisplayObjectAt(update.order, templates[update.url]);
              }
              else {
                displayObject = frame.setDisplayObjectAt(update.order, slotTemplate);
                frame.set(displayObject, 'href', update.url);
              }
              break;
            case 'modify':
              break;
            case 'delete':
              frame.setDisplayObjectAt(update.order, null);
              break;
          }
        }
      });
      if (displayList.framePos === -1) {
        displayList.goToFrame(0);
      }
    };
    client.open('//cors.archive.org/cors/' + item + '/' + path);
  }
  
  init_hash();
  //window.addEventListener('hashchange', init_hash);
  
});
