define(['arrayExtensions'], function() {

  'use strict';
  
  const COMPARE_DEPTH = function(a, b) {
    if (typeof a !== 'number') a = a.depth;
    if (typeof b !== 'number') b = b.depth;
    return a - b;
  };
  
  const COMPARE_NUM = function(a, b) {
    return a - b;
  };
  
  function getPrevEl(container, refEl) {
    if (refEl) return refEl.previousElementSibling;
    return container.lastElementChild;
  }
  
  function addPrevEl(container, refEl, newEl) {
    if (refEl) container.insertBefore(newEl, refEl);
    else container.appendChild(newEl);
  }

  function DisplayList(root) {
    this.rootElement = root;
    this.displayObjectTemplates = {};
    this.displayObjects = [];
  }
  DisplayList.prototype = {
    setStateAt: function(depth, state, i_obj) {
      if (depth < 0) {
        this.rootElement.state = state;
        this.rootElement.dispatchEvent(new Event('display-object-state'));
        return;
      }
      if (isNaN(i_obj)) {
        i_obj = this.displayObjects.sortedIndexOf(depth, COMPARE_DEPTH);
      }
      var existing;
      if (i_obj < 0) {
        existing = null;
        i_obj = ~i_obj;
      }
      else {
        existing = this.displayObjects[i_obj];
      }
      if (state) {
        var displayObject;
        if (!existing || existing.state.template !== state.template) {
          var template = this.displayObjectTemplates[state.template];
          if (!template) {
            throw new Error('template not found: ' + state.template);
          }
          displayObject = template.cloneNode(true);
          template.dispatchEvent(new Event('display-object-init', {
            detail: {
              displayList: this,
              displayObject: displayObject,
            },
          }));
          if (existing) {
            existing.dispatchEvent(new Event('display-object-delete'));
            this.displayObjects[i_obj] = displayObject;
            existing.parentNode.insertBefore(displayObject, existing);
            existing.parentNode.removeChild(existing);
          }
          else {
            var container, insertBefore;
            if (i_obj === this.displayObjects.length) {
              insertBefore = null;
              container = this.rootElement;
            }
            else {
              insertBefore = this.displayObjects[i_obj];
              container = insertBefore.parentNode;
              while (container.startDepth > depth) {
                insertBefore = container;
                container = container.parentNode;
              }
            }
            var prevEl;
            while (prevEl = getPrevEl(container, insertBefore)) {
              if (prevEl.stopDepth > depth) {
                insertBefore = null;
                container = prevEl;
              }
              else break;
            }
            addPrevEl(container, prevEl, displayObject);
            this.displayObjects.splice(i_obj, 0, displayObject);
          }
        }
        else {
          displayObject = existing;
        }
        displayObject.state = state;
        displayObject.dispatchEvent(new Event('display-object-state'));
      }
      else if (existing) {
        this.displayObjects.splice(i_obj, 1);
        existing.dispatchEvent(new Event('display-object-delete'));
        existing.parentNode.removeChild(existing);
      }
    },
    setAllStates: function(states) {
      var depths = Object.keys(states).map(parseNumber);
      depths.sort(COMPARE_NUM);
      var i_obj = 0, i_depth = 0;
      while (i_obj < this.displayObjects.length) {
        var displayObject = this.displayObjects[i_obj];
        var depth = depths[i_depth];
        if (isNaN(depth)) depth = Infinity;
        if (depth < displayObject.depth) {
          this.setStateAt(depth, states[depth], ~i_obj);
          i_depth++;
        }
        else if (depth > displayObject.depth) {
          this.setStateAt(displayObject.depth, null, i_obj);
        }
        else {
          this.setStateAt(depth, states[depth], i_obj);
          i_obj++;
          i_depth++;
        }
      }
      while (i_depth < depths.length) {
        var depth = depths[i_depth++];
        this.setStateAt(depth, states[depth], ~i_obj++);
      }
    },
    makeNodeGroup: function(groupTemplate, startDepth, stopDepth) {
      var containerNodes = [];
      var i_node = this.displayObjects.sortedIndexOf(startDepth, COMPARE_DEPTH);
      if (i_node < 0) i_node = ~i_node;
      var container, insertBefore;
      if (i_node === this.displayObjects.length) {
        insertBefore = null;
        container = this.element;
      }
      else {
        insertBefore = this.displayObjects[i_node];
        container = insertBefore.parentNode;
      }
      while (container.startDepth === startDepth && container.stopDepth < stopDepth) {
        insertBefore = container;
        container = container.parentNode;
      }
      mainLoop: for (;;) {
        var group = groupTemplate.cloneNode(true);
        group.startDepth = startDepth;
        containerNodes.push(group);
        addPrevEl(container, insertBefore, group);
        var nextEl;
        while (nextEl = group.nextElementSibling) {
          if (nextEl.depth >= stopDepth || nextEl.startDepth >= stopDepth) {
            group.stopDepth = stopDepth;
            break mainLoop;
          }
          group.appendChild(container.removeChild(group.nextElementSibling));
        }
        if (isNaN(container.stopDepth) || container.stopDepth >= stopDepth) {
          group.stopDepth = stopDepth;
          break mainLoop;
        }
        startDepth = group.stopDepth = container.stopDepth;
        do {
          insertBefore = container.nextElementSibling;
          container = container.parentNode;
        } while (container.stopDepth === startDepth);
        while (insertBefore && insertBefore.startDepth === startDepth && insertBefore.stopDepth > stopDepth) {
          container = insertBefore;
          insertBefore = container.firstChild;
        }
      }
      return new DisplayListGroup(this, containerNodes);
    },
  };
  
  function DisplayListGroup(displayList, containerNodes) {
    this.displayList = displayList;
    this.containerNodes = containerNodes;
  }
  DisplayListGroup.prototype = {
    revoke: function() {
      for (var i = 0; i < this.containerNodes.length; i++) {
        var node = this.containerNodes[i];
        var parentNode = node.parentNode;
        while (node.firstChild) {
          parentNode.insertBefore(node.removeChild(node.firstChild), node);
        }
        parentNode.removeChild(node);
      }
    },
  };
  
  function DisplayListTimeline(selfState) {
    this.frames = [];
    if (selfState) {
      this.frames[-1] = new DisplayListFrame(this, Object.freeze({'-1':selfState}));
    }
    else {
      this.frames[-1] = new DisplayListFrame(this, Object.freeze({}));
    }
  }
  DisplayListTimeline.prototype = {
    writeHead: null,
    allocateFrame: function() {
      if (this.writeHead) {
        throw new Error('cannot allocate frame until previous frame is committed or discarded');
      }
      var lastFrame = this.frames[this.frames.length-1];
      var frame = new DisplayListFrame(this, lastFrame.states);
      this.writeHead = frame;
      return frame;
    },
    duplicateFrame: function(count) {
      if (isNaN(count)) count = 1;
      else if (!isFinite(count) || count < 0) {
        throw new Error('count must be a finite non-negative number');
      }
      else if (count === 0) return;
      if (this.writeHead) {
        throw new Error('cannot allocate frame until previous frame is committed or discarded');
      }
      var copyFrame = this.frames[this.frames.length-1];
      this.frames.length += count;
      this.frames.fill(copyFrame, -count);
    },
  };

  function DisplayListFrame(timeline, states) {
    this.timeline = timeline;
    this.states = states;
  }
  DisplayListFrame.prototype = {
    get writeStates() {
      var states = this.states = Object.assign(Object.create(null), this.states);
      Object.defineProperty(this, 'writeStates', {
        value: states,
      });
      return states;
    },
    setStateAt: function(depth, state, isPatch) {
      if (!state) {
        delete this.writeStates[depth];
      }
      else {
        if (isPatch) {
          state = Object.freeze(Object.assign(Object.create(null), this.states[depth], state));
        }
        else if (!Object.isFrozen(state)) {
          state = Object.freeze(Object.assign(Object.create(null), state));
        }
        this.writeStates[depth] = state;
      }
    },
    commit: function() {
      if (this.timeline.writeHead !== this) {
        throw new Error('cannot commit: frame is not in write mode');
      }
      if (Object.isFrozen(this.states)) {
        this.discard();
        this.timeline.duplicateFrame();
      }
      else {
        Object.freeze(this.states);
        this.timeline.frames.push(this);
        this.timeline.writeHead = null;
      }
    },
    discard: function() {
      if (this.timeline.writeHead !== this) {
        throw new Error('cannot commit: frame is not in write mode');
      }
      this.timeline.writeHead = null;
    },
  };
  
  DisplayList.Group = DisplayListGroup;
  DisplayList.Timeline = DisplayListTimeline;
  DisplayList.Frame = DisplayListFrame;
  
  return DisplayList;
  
});
