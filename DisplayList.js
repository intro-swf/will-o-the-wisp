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
    allocateFrame: function() {
      var frame = new TimelineFrame;
      if (this.frames) {
        frame.init(this.frames[this.frames.length-1]);
        this.frames.push(frame);
      }
      else {
        this.frames = [frame];
      }
      return frame;
    },
  };

  function TimelineFrame() {
    this.inherited = [];
    this.now = [];
  }
  TimelineFrame.prototype = {
    init: function(previousFrame) {
      var inherited = this.inherited = previousFrame.inherited.splice();
      changeLoop: for (var i = 0; i < previousFrame.now.length; i++) {
        var change = previousFrame.now[i];
        var i_change = inherited.firstSortedIndexOf(change, COMPARE_DEPTH);
        if (i_change >= 0) {
          do {
            var compareChange = inherited[i_change];
            if (compareChange.displayObject === change.displayObject && compareChange.key === change.key) {
              inherited[i_change] = change;
              continue changeLoop;
            }
          } while(++i_change < inherited.length && inherited[i_change].depth === change.depth);
        }
        else {
          i_change = ~i_change;
        }
        inherited.splice(i_change, 0, change);
      }
    },
    remove: function(displayObject) {
      var i_change = this.inherited.firstSortedIndexOf(displayObject, COMPARE_DEPTH);
      if (i_change >= 0) {
        do {
          if (this.inherited[i_change].displayObject === displayObject) {
            this.inherited.splice(i_change, 1);
          }
          else {
            i_change++;
          }
        } while (i_change < this.inherited.length && this.inherited[i_change].depth === displayObject.depth);
      }
      i_change = this.now.firstSortedIndexOf(displayObject, COMPARE_DEPTH);
      if (i_change >= 0) {
        do {
          if (this.now[i_change].displayObject === displayObject) {
            this.now.splice(i_change, 1);
          }
          else {
            i_change++;
          }
        } while (i_change < this.now.length && this.now[i_change].depth === displayObject.depth);
      }
      else i_change = ~i_change;
      this.now.splice(i_change, 0, SET.bind(displayObject, 'display', 'none'));
    },
  };

  return DisplayList;
  
});
