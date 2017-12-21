
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
    displayList.container.addEventListener('clean', this.onclean.bind(slot));
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
  
  function getTransformMatrix(transform) {
    var tempEl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tempEl.setAttribute('transform', transform);
    return tempEl.transform.baseVal.consolidate().matrix;
  }
  
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
    movie.container = document.getElementById('movie-container');
    movie.appendChild(movie.defs = createSVGElement('defs'));
    movie.appendChild(movie.stage = createSVGElement('g'));
    var displayList = movie.stage.displayList = new DisplayList(movie.stage);
    var scrubber = document.getElementById('scrubber');
    client = new SWFDecoderClient;
    function drawFrame(n) {
      displayList.goToFrame(n);
    }
    var animFrameId = null;
    function doAnimFrame() {
      animFrameId = null;
      drawFrame(+scrubber.value);
    }
    client.onframeset = function onframeset(frameset) {
      var parts = frameset.bounds.split(/ /g);
      movie.setAttribute('viewBox', frameset.bounds);
      movie.container.setAttribute('viewBox', frameset.bounds);
      movie.setAttribute('width', parts[2] - parts[0]);
      movie.setAttribute('height', parts[3] - parts[1]);
      scrubber.max = frameset.count-1;
      scrubber.onchange = function(e) {
        var frame = +this.value;
        if (frame >= displayList.frames.length) {
          this.value = displayList.frames.length-1;
        }
        else if (animFrameId === null) {
          animFrameId = requestAnimationFrame(doAnimFrame);
        }
      };
      console.log('frameset', frameset);
    };
    var templates = {};
    client.ondef = function(def) {
      movie.defs.appendChild(def);
    };
    function doUpdate(frame, update) {
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
          if ('transform' in update.settings) {
            frame.set(displayObject, 'transform', getTransformMatrix(update.settings.transform));
          }
          else if (update.type === 'insert') {
            frame.set(displayObject, 'transform', getTransformMatrix('translate(0,0)'));
          }
          if ('class' in update.settings) {
            frame.set(displayObject, 'className', update.settings['class']);
          }
          if ('colorTransform' in update.settings) {
            var ct = update.settings.colorTransform.split(/ /g).map(parseFloat);
            if (ct[0] !== 1 || ct[4] !== 0
             || ct[6] !== 1 || ct[9] !== 0
             || ct[12] !== 1 || ct[14] !== 0
             || ct[19] !== 0) {
              var cxform = frame.displayList.getDisplayObject(update.order, cxformTemplate);
              frame.set(cxform, 'mulR', ct[0]);
              frame.set(cxform, 'addR', ct[4]);
              frame.set(cxform, 'mulG', ct[6]);
              frame.set(cxform, 'addG', ct[9]);
              frame.set(cxform, 'mulB', ct[12]);
              frame.set(cxform, 'addB', ct[14]);
              frame.set(cxform, 'addA', ct[19]);
              frame.set(displayObject, 'filter', 'url(#' + cxform.getAttribute('id') + ')');
            }
            else {
              frame.set(displayObject, 'filter', '');
            }
            frame.set(displayObject, 'opacity', ct[18] === 1 ? '' : ct[18]);
          }
          else if (update.type === 'insert') {
            frame.set(displayObject, 'opacity', '');
            frame.set(displayObject, 'filter', '');
          }
          break;
        case 'modify':
          var displayObject = frame.getDisplayObjectAt(update.order);
          if ('transform' in update.settings) {
            frame.set(displayObject, 'transform', getTransformMatrix(update.settings.transform));
          }
          if ('colorTransform' in update.settings) {
            var ct = update.settings.colorTransform.split(/ /g).map(parseFloat);
            if (ct[0] !== 1 || ct[4] !== 0
             || ct[6] !== 1 || ct[9] !== 0
             || ct[12] !== 1 || ct[14] !== 0
             || ct[19] !== 0) {
              var cxform = frame.displayList.getDisplayObject(update.order, cxformTemplate);
              frame.set(cxform, 'mulR', ct[0]);
              frame.set(cxform, 'addR', ct[4]);
              frame.set(cxform, 'mulG', ct[6]);
              frame.set(cxform, 'addG', ct[9]);
              frame.set(cxform, 'mulB', ct[12]);
              frame.set(cxform, 'addB', ct[14]);
              frame.set(cxform, 'addA', ct[19]);
              frame.set(displayObject, 'filter', 'url(#' + cxform.getAttribute('id') + ')');
            }
            else {
              frame.set(displayObject, 'filter', '');
            }
            frame.set(displayObject, 'opacity', ct[18] === 1 ? '' : ct[18]);
          }
          if ('class' in update.settings) {
            frame.set(displayObject, 'className', update.settings['class']);
          }
          break;
        case 'delete':
          frame.setDisplayObjectAt(update.order, null);
          break;
      }
    }
    client.onframe = function onframe(def) {
      displayList.withFrame(function(frame) {
        for (var i_update = 0; i_update < def.updates.length; i_update++) {
          doUpdate(frame, def.updates[i_update]);
        }
      });
      if (def.count > 1) {
        displayList.emptyFrames(def.count - 1);
      }
      if (displayList.framePos === -1) {
        displayList.goToFrame(0);
      }
    };
    client.onbutton = function(def) {
      var template = createSVGElement('g');
      template.idBase = def.id.replace(/^#/, '') + '_';
      template.setAttribute('class', 'button');
      template.setAttribute('tabindex', '0');
      template.style.display = 'none';
      template.onclean = function() {
        this.style.display = 'none';
      };
      template.addEventListener('display-list-instantiate', function(e) {
        var displayList = e.detail.displayList;
        var button = e.detail.displayObject;
        button.displayList = new DisplayList(button);
        button.displayList.withFrame(function(frame) {
          for (var i_update = 0; i_update < def.contentUpdates.length; i_update++) {
            doUpdate(frame, def.contentUpdates[i_update]);
          }
        });
        button.displayList.goToFrame(0);
        displayList.container.addEventListener('clean', this.onclean.bind(button));
      });
      templates[def.id] = template;
    };
    client.onsprite = function(def) {
      var template = createSVGElement('g');
      template.idBase = def.id.replace(/^#/, '') + '_';
      template.setAttribute('class', 'sprite');
      template.style.display = 'none';
      template.onclean = function() {
        this.style.display = 'none';
      };
      template.addEventListener('display-list-instantiate', function(e) {
        var displayList = e.detail.displayList;
        var sprite = e.detail.displayObject;
        sprite.displayList = new DisplayList(sprite);
        for (var i_frame = 0; i_frame < def.frames.length; i_frame++) {
          var frameDef = def.frames[i_frame];
          sprite.displayList.withFrame(function(frame) {
            for (var i_update = 0; i_update < frameDef.updates.length; i_update++) {
              doUpdate(frame, frameDef.updates[i_update]);
            }
          });
        }
        sprite.displayList.goToFrame(0);
        displayList.container.addEventListener('clean', this.onclean.bind(sprite));
      });
      templates[def.id] = template;
    };
    client.open('//cors.archive.org/cors/' + item + '/' + path);
  }
  
  init_hash();
  //window.addEventListener('hashchange', init_hash);
  
});
