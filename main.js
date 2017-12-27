
requirejs.config({
  waitSeconds: Infinity, // no timeout
});

require([
  'domReady!' // use domReady.js plugin to require DOM readiness
  ,'SWFDecoderClient'
  ,'DisplayList2'
], function(
  domReady
  ,SWFDecoderClient
  ,DisplayList
) {
  
  'use strict';
  
  var movie = document.getElementById('movie');
  movie.defs = document.getElementById('defs');
  movie.scrubber = document.getElementById('scrubber');
  movie.displayList = new DisplayList(movie);
  movie.timeline = new DisplayList.Timeline({background:'#000'});
  movie.framePos = -1;
  movie.addEventListener('display-object-state', function() {
    document.body.style.background = this.state.background;
  });
  var client = new SWFDecoderClient;
  
  function makeColorTransform() {
    var num = 1;
    while (document.getElementById('cxform'+num)) {
      num++;
    }
    var id = 'cxform' + num;
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const feColorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    filter.appendChild(feColorMatrix);
    movie.defs.appendChild(filter);
    Object.defineProperty(filter, 'matrixValues', {
      get: function() {
        return feColorMatrix.getAttribute('values');
      },
      set: function(values) {
        feColorMatrix.setAttribute('values', values);
      },
    });
    return filter;
  }
  
  const specifier = location.search.match(/^\?\/?([^\/]+)\/(.+)$/);
  if (!specifier) {
    return;
  }
  const item = specifier[1];
  const path = specifier[2];
  movie.depth = -1;
  document.body.depth = -1;
  function drawFrame(n) {
    var frame = movie.timeline.frames[n];
    movie.displayList.setAllStates(frame.states);
  }
  var animFrameId = null;
  function doAnimFrame() {
    animFrameId = null;
    drawFrame(+movie.scrubber.value);
  }
  client.onframeset = function onframeset(frameset) {
    var parts = frameset.bounds.split(/ /g);
    const twipWidth = parts[2] - parts[0], twipHeight = parts[3] - parts[1];
    movie.style.width = twipWidth + 'px';
    movie.style.height = twipHeight + 'px';
    movie.tickMs = 1000/frameset.rate;
    var movieReshapeId = null;
    function reshapeMovie() {
      if (movieReshapeId === null) {
        movieReshapeId = requestAnimationFrame(function() {
          movieReshapeId = null;
          var height = window.innerHeight - movie.scrubber.offsetHeight;
          var xRatio = window.innerWidth/twipWidth;
          var yRatio = height/twipHeight;
          var ratio = Math.min(xRatio, yRatio);
          var x = Math.round((window.innerWidth - twipWidth*ratio)/2);
          var y = Math.round((height - twipHeight*ratio)/2);
          movie.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + ratio + ')';
        });
      }
    }
    window.addEventListener('resize', reshapeMovie);
    reshapeMovie();
    movie.scrubber.max = frameset.count-1;
    movie.scrubber.onchange = function(e) {
      var frame = +this.value;
      if (frame >= movie.timeline.frames.length) {
        this.value = movie.timeline.frames.length-1;
      }
      else if (animFrameId === null) {
        animFrameId = requestAnimationFrame(doAnimFrame);
      }
    };
    console.log('frameset', frameset);
  };
  function onDisplayObjectState(e) {
    if ('viewBox' in this) {
      this.style.transform = this.state.transform + ' translate(' + this.viewBox.baseVal.x + 'px, ' + this.viewBox.baseVal.y + 'px)';
    }
    else {
      this.style.transform = this.state.transform;
    }
    if ('class' in this.state) {
      this.setAttribute('class', this.state['class']);
    }
    this.style.opacity = this.state.opacity;
    if (this.colorTransform) {
      if (this.state.colorMatrix) {
        this.colorTransform.matrixValues = this.state.colorMatrix;
      }
      else {
        this.colorTransform.parentNode.removeChild(this.colorTransform);
        delete this.colorTransform;
        this.style.filter = '';
      }
    }
    else if (this.state.colorMatrix) {
      this.colorTransform = makeColorTransform();
      this.colorTransform.matrixValues = this.state.colorMatrix;
      this.style.filter = 'url(#' + this.colorTransform.getAttribute('id') + ')';
    }
  }
  function onDisplayObjectDelete(e) {
    if (this.colorTransform) {
      this.colorTransform.parentNode.removeChild(this.colorTransform);
      delete this.colorTransform;
      this.style.filter = '';
    }
  }
  function onDisplayObjectInit(e) {
    const displayList = e.detail.displayList;
    const displayObject = e.detail.displayObject;
    displayObject.addEventListener('display-object-state', onDisplayObjectState);
    displayObject.addEventListener('display-object-delete', onDisplayObjectDelete);
  }
  client.ondef = function(def) {
    if (def.nodeName === 'svg') {
      movie.displayList.displayObjectTemplates[def.getAttribute('id')] = def;
      def.removeAttribute('id');
      def.style.position = 'absolute';
      def.style.transformOrigin = 'top left';
      def.addEventListener('display-object-init', onDisplayObjectInit);
    }
    else {
      movie.defs.appendChild(def);
    }
  };
  function doUpdate(frame, update) {
    switch (update.type) {
      case 'insert':
      case 'replace':
      case 'modify':
        var state = update.settings;
        if (update.type !== 'modify') state = Object.assign({template:update.url.replace(/^#/, '')}, state);
        frame.setStateAt(update.depth, state, update.type !== 'insert');
        break;
      case 'delete':
        frame.setStateAt(update.depth, null);
        break;
    }
  }
  function checkTick(stamp) {
    requestAnimationFrame(checkTick);
    if (stamp < movie.nextTick) return;
    movie.nextTick += movie.tickMs;
    movie.dispatchEvent(new Event('tick'));
  }
  client.onframe = function onframe(def) {
    var frame = movie.timeline.allocateFrame();
    for (var i_update = 0; i_update < def.updates.length; i_update++) {
      doUpdate(frame, def.updates[i_update]);
    }
    frame.commit();
    if (movie.timeline.frames.length === 1) {
      movie.displayList.setAllStates(movie.timeline.frames[0].states);
      movie.nextTick = performance.now() + movie.tickMs;
      requestAnimationFrame(checkTick);
    }
    if (def.count > 1) {
      movie.timeline.duplicateFrame(def.count - 1);
    }
  };
  client.onbutton = function(def) {
    var template = document.createElement('DIV');
    template.style.position = 'absolute';
    template.classList.add('button-container');
    template.setAttribute('tabindex', '0');
    template.appendChild(document.createElement('DIV'));
    template.firstChild.classList.add('button');
    template.addEventListener('display-object-init', onDisplayObjectInit);
    template.addEventListener('display-object-init', function(e) {
      var displayList = e.detail.displayList;
      var button = e.detail.displayObject;
      button.displayList = new DisplayList(button.firstChild);
      button.displayList.displayObjectTemplates = movie.displayList.displayObjectTemplates;
      for (var i_update = 0; i_update < def.contentUpdates.length; i_update++) {
        var update = def.contentUpdates[i_update];
        button.displayList.setStateAt(update.depth,
          Object.assign({
              template: update.url.replace(/^#/, ''),
              transform: 'translateZ(0)',
            },
          update.settings)
        );
      }
    });
    movie.displayList.displayObjectTemplates[def.id] = template;
  };
  client.onsprite = function(def) {
    var template = document.createElement('DIV');
    template.classList.add('sprite-container');
    template.appendChild(document.createElement('DIV'));
    template.firstChild.classList.add('sprite');
    template.addEventListener('display-object-init', onDisplayObjectInit);
    template.addEventListener('display-object-init', function(e) {
      var displayList = e.detail.displayList;
      var sprite = e.detail.displayObject;
      sprite.displayList = new DisplayList(sprite.firstChild);
      sprite.displayList.displayObjectTemplates = movie.displayList.displayObjectTemplates;
      sprite.timeline = new DisplayList.Timeline();
      for (var i_frame = 0; i_frame < def.frames.length; i_frame++) {
        var frameDef = def.frames[i_frame];
        var frame = sprite.timeline.allocateFrame();
        for (var i_update = 0; i_update < frameDef.updates.length; i_update++) {
          doUpdate(frame, frameDef.updates[i_update]);
        }
        frame.commit();
      }
      sprite.displayList.setAllStates(sprite.timeline.frames[0].states);
      var frame_i = 0;
      function ontick(e) {
        frame_i = (frame_i + 1) % sprite.timeline.frames.length;
        sprite.displayList.setAllStates(sprite.timeline.frames[i_frame].states);
      }
      movie.addEventListener('tick', ontick);
      sprite.addEventListener('display-object-delete', function() {
        movie.removeEventListener('tick', ontick);
      });
    });
    movie.displayList.displayObjectTemplates[def.id] = template;
  };
  client.open('//cors.archive.org/cors/' + item + '/' + path);
  
});
