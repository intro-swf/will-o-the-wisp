define(['arrayExtensions'], function() {

  'use strict';

  const COMPARE_DEPTH = function(a, b) {
    if (typeof a !== 'number') a = a.depth;
    if (typeof b !== 'number') b = b.depth;
    return a - b;
  };

  const SET = function(key, value) {
    this[key] = value;
  };

  function getPreviousEl(container, beforeEl) {
    if (beforeEl) return beforeEl.previousSibling;
    else return container.lastChild;
  }

  function setPreviousEl(container, beforeEl, newEl) {
    if (beforeEl) container.insertBefore(newEl, beforeEl);
    else container.appendChild(newEl);
  }

  function DisplayList(el) {
    this.container = el;
    this.frames = [];
    if ('parentDisplayList' in el) {
      this.idBreadcrumb = el.parentDisplayList.idBreadcrumb + el.depth + '_';
    }
    while (el.firstChild) el.removeChild(el.firstChild);
    var endMarker = document.createComment('end');
    endMarker.depth = Infinity;
    el.appendChild(endMarker);
    this.depthMarkers = [endMarker];
  }
  DisplayList.prototype = {
    idBreadcrumb: '',
    clean: function() {
      this.container.dispatchEvent(new Event('clean'));
    },
    getDepthMarker: function(depth) {
      var i_marker = this.depthMarkers.sortedIndexOf(depth, COMPARE_DEPTH);
      if (i_marker < 0) {
        i_marker = ~i_marker;
        var insertBefore = this.depthMarkers[i_marker];
        var marker = document.createComment(depth);
        marker.depth = depth;
        this.depthMarkers.splice(i_marker, 0, marker);
        var container = insertBefore.parentNode;
        while (container.startDepth > depth) {
          insertBefore = container;
          container = container.parentNode;
        }
        var prev;
        while (prev = getPreviousEl(container, insertBefore)) {
          if (prev.startDepth > depth) {
            insertBefore = prev;
          }
          else if (prev.stopDepth > depth) {
            container = prev;
            insertBefore = null;
          }
          else break;
        }
        setPreviousEl(container, insertBefore, marker);
        return marker;
      }
      return this.depthMarkers[i_marker];
    },
    getDepthGroups: function(startDepth, stopDepth) {
      var key = 'depth<'+startDepth+','+stopDepth+'>';
      if (key in this) return this[key];
      var startMarker = this.getDepthMarker(startDepth);
      var endMarker = this.getDepthMarker(stopDepth);
      var groups = [];
      groupLoop: for (;;) {
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.container.addEventListener('clean', SET.bind(group.style, 'clip', 'none'));
        groups.push(group);
        group.startDepth = startMarker.depth;
        var refNode = startMarker;
        var container = refNode.parentNode;
        while (container.startDepth === startMarker.depth && container.stopDepth < stopDepth) {
          refNode = container;
          container = container.parentNode;
        }
        container.insertBefore(group, refNode);
        for (;;) {
          group.appendChild(container.removeChild(group.nextSibling));
          var next = group.nextSibling;
          if (next === endMarker) {
            group.stopDepth = stopDepth;
            return this[key] = groups;
          }
          if (!next) {
            if (container.stopDepth === stopDepth) {
              group.stopDepth = stopDepth;
              return this[key] = groups;
            }
            startMarker = this.getDepthMarker(group.stopDepth = container.stopDepth);
            continue groupLoop;
          }
          if ('stopDepth' in next) {
            if (next.startDepth === stopDepth) {
              group.stopDepth = stopDepth;
              return this[key] = groups;
            }
            if (next.stopDepth === stopDepth) {
              group.appendChild(container.removeChild(next));
              group.stopDepth = stopDepth;
              return this[key] = groups;
            }
            if (next.stopDepth > stopDepth) {
              startMarker = this.getDepthMarker(group.stopDepth = next.startDepth);
              continue groupLoop;
            }
          }
        }
      }
    },
    getDisplayObject: function(depth, template) {
      var after = this.getDepthMarker(depth);
      while (after.nextSibling && after.nextSibling.depth === depth) {
        after = after.nextSibling;
        if (after.template === template) return after;
      }
      var displayObject = template.cloneNode(true);
      displayObject.setAttribute('id', (template.idBase || '_') + this.idBreadcrumb + depth);
      displayObject.parentDisplayList = this;
      displayObject.template = template;
      displayObject.depth = depth;
      if (after.nextSibling) {
        after.parentNode.insertBefore(displayObject, after.nextSibling);
      }
      else {
        after.parentNode.appendChild(displayObject);
      }
      template.dispatchEvent(new CustomEvent('display-list-instantiate', {
        detail: {displayList:this, displayObject:displayObject},
      }));
      return displayObject;
    },
    lastFrame: null,
    withFrame: function(fn) {
      var frame = new TimelineFrame(this, this.lastFrame);
      fn(frame);
      this.frames.push(frame);
      this.lastFrame = frame;
    },
    emptyFrames: function(count) {
      while (count-- > 0) {
        this.frames.push(null);
      }
    },
    createSetterRaw: function(displayObject, key, value) {
      if (typeof displayObject[key] === 'object') {
        if (displayObject[key] instanceof SVGNumber) {
          return SET.bind(displayObject[key], 'value', value);
        }
        if (displayObject[key] instanceof SVGAnimatedString
           || displayObject[key] instanceof SVGAnimatedBoolean
           || displayObject[key] instanceof SVGAnimatedInteger
           || displayObject[key] instanceof SVGAnimatedEnumeration) {
          return SET.bind(displayObject[key], 'baseVal', value);
        }
        if (displayObject[key] instanceof SVGAnimatedTransformList) {
          value = 'matrix(' + value.a + ',' + value.b + ',' + value.c + ',' + value.d + ',' + value.e + ',' + value.f + ')';
          return SET.bind(displayObject.style, 'transform', value);
        }
      }
      if (key in displayObject.style) {
        if (typeof value === 'object') {
          if (value instanceof SVGMatrix) {
            value = 'matrix(' + value.a + ',' + value.b + ',' + value.c + ',' + value.d + ',' + value.e + ',' + value.f + ')';
          }
        }
        return SET.bind(displayObject.style, key, value);
      }
      return SET.bind(displayObject, key, value);
    },
    createSetter: function(displayObject, key, value) {
      var setter = this.createSetterRaw(displayObject, key, value);
      setter.depth = displayObject.depth;
      setter.displayObject = displayObject;
      setter.key = key;
      setter.value = value;
      return setter;
    },
    framePos: -1,
    goToFrame: function(i) {
      var diff = i - this.framePos;
      if (diff === 1) {
        var frame = this.frames[i];
        if (frame) {
          this.frames[i].render(false);
        }
      }
      else if (diff !== 0) {
        this.clean();
        while (i >= 0 && !this.frames[i]) {
          i--;
        }
        if (i >= 0) {
          this.frames[i].render(true);
        }
      }
      this.framePos = i;
    },
  };

  function TimelineFrame(displayList, previousFrame) {
    this.displayList = displayList;
    if (previousFrame) {
      var already = this.already = previousFrame.already.slice();
      for (var i = 0; i < previousFrame.now.length; i++) {
        var change = previousFrame.now[i];
        if (change.key === 'display' && change.value === 'none') continue;
        var i_change = already.sortedIndexOf(change, COMPARE_DEPTH);
        if (i_change < 0) i_change = ~i_change;
        already.splice(i_change, 0, change);
      }
    }
    else this.already = [];
    this.now = [];
  }
  TimelineFrame.prototype = {
    render: function(absolute) {
      if (absolute) for (var i = 0; i < this.already.length; i++) {
        this.already[i]();
      }
      for (var i = 0; i < this.now.length; i++) {
        this.now[i]();
      }
    },
    indexOfChange: function(changeList, displayObject, key) {
      const depth = displayObject.depth;
      var i_change = changeList.firstSortedIndexOf(depth, COMPARE_DEPTH);
      if (i_change < 0) return -1;
      do {
        var change = changeList[i_change];
        if (change.displayObject === displayObject && change.key === key) {
          return i_change;
        }
      } while (++i_change < changeList.length && changeList[i_change].depth === depth);
      return -1;
    },
    set: function(displayObject, key, value) {
      var setting = this.displayList.createSetter(displayObject, key, value);
      var i_change = this.indexOfChange(this.already, displayObject, key);
      if (i_change >= 0) {
        if (this.already[i_change].value === value) {
          return;
        }
        this.already.splice(i_change, 1);
      }
      i_change = this.indexOfChange(this.now, displayObject, key);
      if (i_change >= 0) {
        if (this.now[i_change].value !== value) {
          this.now[i_change] = setting;
        }
      }
      else {
        i_change = this.now.sortedIndexOf(displayObject, COMPARE_DEPTH);
        if (i_change < 0) i_change = ~i_change;
        this.now.splice(i_change, 0, setting);
      }
    },
    eachChangeAt: function*(depth) {
      var i_change = this.already.firstSortedIndexOf(depth, COMPARE_DEPTH);
      if (i_change >= 0) do {
        yield this.already[i_change];
      } while (++i_change < this.already.length && this.already[i_change].depth === depth);
      i_change = this.now.firstSortedIndexOf(depth, COMPARE_DEPTH);
      if (i_change >= 0) do {
        yield this.now[i_change];
      } while (++i_change < this.now.length && this.now[i_change].depth === depth);
    },
    removeChangesForDisplayObject: function(displayObject) {
      var changes = [];
      var i_change = this.already.firstSortedIndexOf(displayObject, COMPARE_DEPTH);
      if (i_change >= 0) do {
        var change = this.already[i_change];
        if (change.displayObject === displayObject) {
          changes.push(change);
          this.already.splice(i_change, 1);
        }
        else i_change++;
      } while (++i_change < this.already.length && this.already[i_change].depth === displayObject.depth);
      i_change = this.now.firstSortedIndexOf(displayObject.depth, COMPARE_DEPTH);
      if (i_change >= 0) do {
        var change = this.now[i_change];
        if (change.displayObject === displayObject) {
          changes.push(change);
          this.now.splice(i_change, 1);
        }
        else i_change++;
      } while (i_change < this.now.length && this.now[i_change].depth === displayObject.depth);
      return changes;
    },
    getDisplayObjectAt: function(depth) {
      for (let change of this.eachChangeAt(depth)) {
        if (change.key === 'display' && change.value === '') {
          return change.displayObject;
        }
      }
      return null;
    },
    setDisplayObjectAt: function(depth, template) {
      var oldDisplayObject = this.getDisplayObjectAt(depth);
      var newDisplayObject = template ? this.displayList.getDisplayObject(depth, template) : null;
      if (oldDisplayObject !== newDisplayObject) {
        if (oldDisplayObject) {
          var changes = this.removeChangesForDisplayObject(oldDisplayObject);
          if (newDisplayObject) {
            for (var i = 0; i < changes.length; i++) {
              this.set(newDisplayObject, changes[i].key, changes[i].value);
            }
          }
          this.set(oldDisplayObject, 'display', 'none');
        }
        else {
          this.set(newDisplayObject, 'display', '');
        }
      }
      return newDisplayObject;
    },
  };

  return DisplayList;
  
});
