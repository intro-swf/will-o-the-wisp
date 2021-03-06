
requirejs.config({
  waitSeconds: Infinity, // no timeout
});

require([
  'domReady!' // use domReady.js plugin to require DOM readmuliness
  ,'SWFDecoderClient'
  ,'DisplayList'
  ,'Cel'
], function(
  domReady
  ,SWFDecoderClient
  ,DisplayList
  ,Cel
) {
  
  'use strict';
  
  function Matrix() {
  }
  Matrix.prototype = {
    a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
    set: function(a, b, c, d, e, f) {
      this.a = a; this.b = b; this.c = c;
      this.d = d; this.e = e; this.f = f;
      return this;
    },
    copy: function(other) {
      this.a = other.a; this.b = other.b; this.c = other.c;
      this.d = other.d; this.e = other.e; this.f = other.f;
      return this;
    },
    postMultiply: function(other) {
      return this.set(
        this.a * other.a + this.c * other.b,
        this.b * other.a + this.d * other.b,
        this.a * other.c + this.c * other.d,
        this.b * other.c + this.d * other.d,
        this.a * other.e + this.c * other.f + this.e,
        this.b * other.e + this.d * other.f + this.f);
    },
    preMultiply: function(other) {
      return this.set(
        other.a * this.a + other.c * this.b,
        other.b * this.a + other.d * this.b,
        other.a * this.c + other.c * this.d,
        other.b * this.c + other.d * this.d,
        other.a * this.e + other.c * this.f + other.e,
        other.b * this.e + other.d * this.f + other.f);
    },
    applyPointX: function(x, y) {
      return x*this.a + y*this.c + this.e;
    },
    applyPointY: function(x, y) {
      return x*this.b + y*this.d + this.f;
    },
  };
  
  var movie = document.getElementById('movie');
  movie.rootCel = new Cel.Timeline;
  movie.rootCel.frameLabels = {};
  movie.cels = {};
  movie.frameActions = {};
  movie.defs = document.getElementById('defs');
  movie.scrubber = document.getElementById('scrubber');
  movie.displayList = new DisplayList(movie);
  movie.displayList.idBase = '_';
  movie.timeline = new DisplayList.Timeline({background:'#000'});
  movie.framePos = -1;
  movie.addEventListener('display-object-state', function() {
    document.body.style.background = this.state.background;
  });
  var client = new SWFDecoderClient;
  
  const nullColorTransform = ['1 0 0 0 0', '0 1 0 0 0', '0 0 1 0 0', '0 0 0 1 0'].join(' ');
  
  var nextNum = 1;
  function makeColorTransform() {
    var num = nextNum++;
    /*
    var num = 1;
    while (document.getElementById('cxform'+num)) {
      num++;
    }
    */
    var id = 'cxform' + num;
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const feColorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
    var valueString = nullColorTransform;
    feColorMatrix.setAttribute('values', valueString);
    const cssRef = 'url("#' + id + '")';
    const values = feColorMatrix.values.baseVal;
    const mulR = values.getItem(0);
    const mulG = values.getItem(6);
    const mulB = values.getItem(12);
    const addR = values.getItem(4);
    const addG = values.getItem(9);
    const addB = values.getItem(14);
    const addA = values.getItem(19);
    filter.appendChild(feColorMatrix);
    movie.defs.appendChild(filter);
    Object.defineProperty(filter, 'matrixValues', {
      get: function() {
        return feColorMatrix.getAttribute('values');
      },
      set: function(values) {
        if (values === valueString) return;
        valueString = values;
        values = values.split(/ /g).map(parseFloat);
        if (values[0] !== mulR.value) mulR.value = values[0];
        if (values[6] !== mulG.value) mulG.value = values[6];
        if (values[12] !== mulB.value) mulB.value = values[12];
        
        if (values[4] !== addR.value) addR.value = values[4];
        if (values[9] !== addG.value) addG.value = values[9];
        if (values[14] !== addB.value) addB.value = values[14];
        if (values[19] !== addA.value) addA.value = values[19];
      },
    });
    Object.defineProperty(filter, 'cssRef', {
      get: function() {
        if (valueString === nullColorTransform) return '';
        if (mulR.value !== mulG.value) return cssRef;
        if (mulR.value !== mulB.value) return cssRef;
        if (addR.value || addG.value || addB.value || addA.value) return cssRef;
        return 'brightness(' + (mulR.value * 100) + '%)';
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
          movie.pixelRatio = ratio;
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
    var transform = this.state.transform + this.baseTransform;
    if (transform !== this.transformString) {
      this.style.transform = this.transformString = transform;
    }
    if ('class' in this.state) {
      this.setAttribute('class', this.state['class']);
    }
    if (this.opacityValue !== this.state.opacity) {
      this.style.opacity = this.opacityValue = this.state.opacity;
    }
    if (this.colorTransform) {
      if (this.state.colorMatrix) {
        this.colorTransform.matrixValues = this.state.colorMatrix;
        var cssRef = this.colorTransform.cssRef;
        if (cssRef !== this.filterValue) {
          this.style.filter = this.filterValue = cssRef;
        }
      }
      else {
        this.colorTransform.parentNode.removeChild(this.colorTransform);
        delete this.colorTransform;
        if (/^brightness/.test(this.style.filter)) {
          this.style.filter = 'brightness(100%)';
        }
        else {
          this.style.filter = '';
        }
      }
    }
    else if (this.state.colorMatrix) {
      this.colorTransform = makeColorTransform();
      this.colorTransform.matrixValues = this.state.colorMatrix;
      this.style.filter = this.filterValue = this.colorTransform.cssRef;
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
    if (def.nodeName !== 'svg') {
      throw new Error('bad def');
    }
    // new:
    var template = def;
    movie.cels[def.getAttribute('id')] = new Cel(template);
    // old:
    var template = document.createElement('DIV');
    function fixup(breadcrumb, i, callback) {
      breadcrumb = breadcrumb.slice();
      breadcrumb.push(i);
      template.addEventListener('display-object-init', function(e) {
        var context = e.detail.displayObject;
        for (var i = 0; i < breadcrumb.length; i++) {
          context = context.childNodes[breadcrumb[i]];
        }
        callback(context, e.detail.displayList.idBase + e.detail.displayObject.depth);
      });
    }
    var animations = false;
    function iterEl(el, breadcrumb) {
      for (var i = 0; i < el.childNodes.length; i++) {
        var child = el.childNodes[i];
        if (child.nodeType !== 1) continue;
        for (var i_attr = 0; i_attr < child.attributes.length; i_attr++) {
          var attr = child.attributes[i_attr];
          switch (attr.name) {
            case 'id':
              fixup(breadcrumb, i, function(idHolder, idBase) {
                idHolder.id = idBase + idHolder.id;
              });
              break;
            case 'filter':
            case 'mask':
            case 'href':
            case 'fill':
            case 'stroke':
              var idRefMatch = attr.value.match(/^url\("#(.*)"\)$/);
              if (idRefMatch) {
                const propName = attr.name;
                const idRef = idRefMatch[1];
                fixup(breadcrumb, i, function(refHolder, idBase) {
                  refHolder.setAttribute(propName, 'url("#' + idBase + idRef + '")');
                });
              }
              break;
            case 'attributeName':
              animations = true;
              child.setAttribute('dur', '1s');
              break;
          }
        }
        if (child.hasChildNodes()) {
          breadcrumb.push(i);
          iterEl(child, breadcrumb);
          breadcrumb.pop();
        }
      }
    }
    iterEl(def, [0]);
    movie.displayList.displayObjectTemplates[def.getAttribute('id')] = template;
    def.removeAttribute('id');
    template.style.position = 'absolute';
    template.style.transformOrigin = 'top left';
    template.appendChild(def);
    template.addEventListener('display-object-init', onDisplayObjectInit);
    template.addEventListener('display-object-init', function(e) {
      var div = e.detail.displayObject;
      div.baseTransform = ' translate3d(' + def.viewBox.baseVal.x + 'px, ' + def.viewBox.baseVal.y + 'px, 0)';
      if (animations) {
        var svg = div.firstChild;
        svg.pauseAnimations();
        svg.setCurrentTime(0);
        div.morphRatio = 0;
        div.addEventListener('display-object-state', function(e) {
          var newRatio = this.state.morphRatio || 0;
          if (this.morphRatio !== newRatio) {
            svg.setCurrentTime(this.morphRatio = newRatio);
          }
        });
      }
    });
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
      case 'action':
        frame.addAction(update.steps);
        break;
    }
  }
  function tick(stamp) {
    requestAnimationFrame(function() {
      movie.dispatchEvent(new Event('tick'))
    });
  }
  movie.frameCount = 0;
  client.onframe = function onframe(def) {
    // new:
    if (typeof def.label === 'string') {
      movie.rootCel.frameLabels[def.label] = movie.frameCount;
    }
    for (var i_update = 0; i_update < def.updates.length; i_update++) {
      let update = def.updates[i_update];
      switch (update.type) {
        case 'insert':
        case 'replace':
          let id = update.url.replace(/^#/, '');
          let cel = movie.cels[id];
          if (!cel) throw new Error('cel not defined: ' + id);
          movie.rootCel.getSequenceAtDepth(update.depth).setCelAtFrame(movie.frameCount, cel, update.settings);
          break;
        case 'modify':
          let sequence = movie.rootCel.getSequenceAtDepth(update.depth);
          sequence.cels.push(sequence.cels[sequence.cels.length-1]);
          sequence.celStartFrames.push(movie.frameCount);
          sequence.celSettings.push(update.settings);
          break;
        case 'delete':
          movie.rootCel.getSequenceAtDepth(update.depth).setCelAtFrame(movie.frameCount, null, null);
          break;
        case 'action':
          if (movie.frameCount in movie.frameActions) {
            Array.prototype.push.apply(movie.frameActions[movie.frameCount], update.steps.slice(1));
          }
          else {
            movie.frameActions[movie.frameCount] = update.steps;
          }
          break;
      }
    }
    movie.frameCount++;
    // old:
    var frame = movie.timeline.allocateFrame();
    for (var i_update = 0; i_update < def.updates.length; i_update++) {
      doUpdate(frame, def.updates[i_update]);
    }
    frame.commit();
    if (movie.timeline.frames.length === 1) {
      movie.displayList.setAllStates(movie.timeline.frames[0].states);
      setInterval(tick, movie.tickMs);
    }
    if (def.count > 1) {
      movie.timeline.duplicateFrame(def.count - 1);
    }
  };
  client.onbutton = function(def) {
    // new:
    const buttonCel = movie.cels[def.id] = new Cel.Container;
    for (var i_update = 0; i_update < def.contentUpdates.length; i_update++) {
      let update = def.contentUpdates[i_update];
      let id = update.url.replace(/^#/, '');
      let cel = movie.cels[id];
      if (!cel) throw new Error('undefined cel: ' + id);
      buttonCel.addCelAtDepth(update.depth, cel, update.settings);
    }
    buttonCel.transitionHandlers = def.transitionHandlers;
    buttonCel.keyHandlers = def.keyHandlers;
    // old:
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
      button.displayList.idBase = displayList.idBase + button.depth + ':B_';
      button.baseTransform = ' translate(0, 0)';
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
    // new:
    const spriteCel = movie.cels[def.id] = new Cel.Timeline;
    spriteCel.frameLabels = {};
    spriteCel.frameActions = {};
    for (var i_frame = 0; i_frame < def.frames.length; i_frame++) {
      let frameDef = def.frames[i_frame];
      if (typeof frameDef.label === 'string') {
        spriteCel.frameLabels[frameDef.label] = i_frame;
      }
      for (var i_update = 0; i_update < frameDef.updates.length; i_update++) {
        let update = frameDef.updates[i_update];
        if ('eventHandlers' in update) {
          console.log('handlers', update);
        }
        switch (update.type) {
          case 'insert':
          case 'replace':
            let id = update.url.replace(/^#/, '');
            let cel = movie.cels[id];
            if (!cel) throw new Error('cel not defined: ' + id);
            spriteCel.getSequenceAtDepth(update.depth).setCelAtFrame(i_frame, cel, update.settings);
            break;
          case 'modify':
            let sequence = spriteCel.getSequenceAtDepth(update.depth);
            sequence.cels.push(sequence.cels[sequence.cels.length-1]);
            sequence.celStartFrames.push(i_frame);
            sequence.celSettings.push(update.settings);
            break;
          case 'delete':
            spriteCel.getSequenceAtDepth(update.depth).setCelAtFrame(i_frame, null, null);
            break;
          case 'action':
            if (i_frame in spriteCel.frameActions) {
              Array.prototype.push.apply(spriteCel.frameActions[i_frame], update.steps.slice(1));
            }
            else {
              spriteCel.frameActions[i_frame] = update.steps;
            }
            break;
        }
      }
    }
    // old:
    const timeline = new DisplayList.Timeline();
    for (var i_frame = 0; i_frame < def.frames.length; i_frame++) {
      var frameDef = def.frames[i_frame];
      var frame = timeline.allocateFrame();
      for (var i_update = 0; i_update < frameDef.updates.length; i_update++) {
        doUpdate(frame, frameDef.updates[i_update]);
      }
      frame.commit();
    }
    var template = document.createElement('DIV');
    template.style.position = 'absolute';
    template.classList.add('sprite-container');
    template.appendChild(document.createElement('DIV'));
    template.firstChild.classList.add('sprite');
    template.addEventListener('display-object-init', onDisplayObjectInit);
    template.addEventListener('display-object-init', function(e) {
      var displayList = e.detail.displayList;
      var sprite = e.detail.displayObject;
      sprite.displayList = new DisplayList(sprite.firstChild);
      sprite.displayList.idBase = displayList.idBase + sprite.depth + ':S_';
      sprite.displayList.displayObjectTemplates = movie.displayList.displayObjectTemplates;
      sprite.timeline = timeline;
      sprite.baseTransform = ' translate(0, 0)';
      sprite.displayList.setAllStates(timeline.frames[0].states);
      if (def.frames.length > 1) {
        var frame_i = 0;
        function ontick(e) {
          frame_i = (frame_i + 1) % timeline.frames.length;
          //sprite.displayList.setAllStates(sprite.timeline.frames[frame_i].states);
        }
        movie.addEventListener('tick', ontick);
        sprite.addEventListener('display-object-delete', function() {
          movie.removeEventListener('tick', ontick);
        });
      }
    });
    movie.displayList.displayObjectTemplates[def.id] = template;
  };
  client.open('//cors.archive.org/cors/' + item + '/' + path);
  
});
