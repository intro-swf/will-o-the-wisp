
requirejs.config({
  waitSeconds: Infinity, // no timeout
});

require([
  'domReady!' // use domReady.js plugin to require DOM readiness
  ,'arrayExtensions'
  ,'SWFDecoderClient'
  ,'DisplayListTimeline'
], function(
  domReady
  ,arrayExtensions
  ,SWFDecoderClient
  ,DisplayListTimeline
) {
  
  'use strict';
  
  function createSVGElement(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    movie.appendChild(movie.defs = createSVGElement('defs'));
    movie.appendChild(movie.stage = createSVGElement('g'));
    movie.timeline = new DisplayListTimeline(movie);
    var scrubber = document.getElementById('scrubber');
    client = new SWFDecoderClient;
    var slotObjects = [];
    const COMPARE_ORDER = function(a, b) {
      if (typeof a !== 'number') a = a.order;
      if (typeof b !== 'number') b = b.order;
      return a - b;
    };
    function getSlotGroups(fromOrder, toOrder) {
      var i_from = slotObjects.sortedIndexOf(fromOrder, COMPARE_ORDER);
      if (i_from < 0) {
        i_from = ~i_from;
      }
      else while (i_from > 0 && slotObjects[i_from-1].order === fromOrder) {
        i_from--;
      }
      var i_to = slotObjects.sortedIndexOf(toOrder, COMPARE_ORDER);
      if (i_to < 0) {
        i_to = ~i_to - 1;
      }
      else while (slotObjects[i_to+1] && slotObjects[i_to+1].order === toOrder) {
        i_to++;
      }
      if (i_to < i_from) return [];
      var groups = [];
      var fromEl = slotObjects[i_from];
      var toEl = slotObjects[i_to];
      while (!fromEl.parentNode.contains(toEl)) {
        if (!fromEl.previousSibling) {
          fromEl = fromEl.parentNode;
        }
        else {
          var group = createSVGElement('g');
          var context = fromEl.parentNode;
          context.insertBefore(group, fromEl);
          do {
            group.appendChild(group.nextSibling);
          } while (group.nextSibling);
          groups.push(group);
          while (!context.nextSibling) {
            context = context.parentNode;
          }
          fromEl = context.nextSibling;
        }
      }
      while (fromEl.parentNode !== toEl.parentNode) {
        if (!toEl.nextSibling) {
          toEl = toEl.parentNode;
          continue;
        }
        if (fromEl.contains(toEl)) {
          fromEl = fromEl.firstChild;
          continue;
        }
        var context = fromEl.parentNode;
        var toContext = toEl.parentNode;
        while (toContext.parentNode !== context) {
          toContext = toContext.parentNode;
        }
        var group = createSVGElement('g');
        context.insertBefore(group, fromEl);
        do {
          group.appendChild(group.nextSibling);
        } while (group.nextSibling !== toContext);
        groups.push(group);
        fromEl = toContext;
      }
      var group = createSVGElement('g');
      var context = fromEl.parentNode;
      context.insertBefore(group, fromEl);
      do {
        var removed = context.removeChild(group.nextElementSibling);
        group.appendChild(removed);
      } while (removed !== toEl);
      groups.push(group);
      return groups;
    }
    var colorTransforms = {nextID:1};
    function drawFrame(n) {
      for (var i_slot = 0; i_slot < movie.timeline._allSlots.length; i_slot++) {
        var slot = movie.timeline._allSlots[i_slot];
        var el = slot.displayObject;
        if (slot.firstFrame > n || slot.lastFrame < n) {
          if (el.clippedGroups) {
            for (var i_clip = 0; i_clip < el.clippedGroups.length; i_clip++) {
              el.clippedGroups[i_clip].setAttribute('clip-path', 'none');
            }
          }
          else {
            el.style.display = 'none';
          }
          continue;
        }
        for (var i_change = 1; i_change < slot.changes.length; i_change++) {
          var change = slot.changes[i_change];
          if (change.frame > n) break;
          switch (change.settingName) {
            case 'transform':
              el.setAttribute('transform', change.value);
              break;
            case 'colorTransform':
              if (change.value in colorTransforms) {
                el.setAttribute('filter', 'url("#' + colorTransforms[change.value] + '")');
              }
              else {
                var filter = createSVGElement('filter');
                filter.setAttribute('color-interpolation-filters', 'sRGB');
                var id = 'filter' + colorTransforms.nextID++;
                filter.setAttribute('id', id);
                var colorMatrix = createSVGElement('feColorMatrix');
                colorMatrix.setAttribute('values', change.value);
                filter.appendChild(colorMatrix);
                movie.defs.appendChild(filter);
                colorTransforms[change.value] = id;
                el.setAttribute('filter', 'url("#' + id + '")');
              }
              break;
            case 'background':
              el.style.background = change.value;
              break;
            case 'clipDepth':
              if (!el.clipContainer || el.clipContainer.maxDepth !== change.value) {
                el.clipContainer = createSVGElement('clipPath');
                el.clipContainer.maxDepth = change.value;
                var clipID = 'clip' + slot.order + '_' + change.value;
                el.clipContainer.setAttribute('id', clipID);
                el.parentNode.removeChild(el);
                if (el.hasAttribute('transform')) {
                  el.clipContainer.setAttribute('transform', el.getAttribute('transform'));
                }
                var pathEl = document.getElementById(el.getAttribute('href').replace(/^#/, ''));
                for (var subEl = pathEl.firstChild; subEl; subEl = subEl.nextSibling) {
                  if (subEl.nodeName === 'path') {
                    var copy = createSVGElement('path');
                    copy.setAttribute('d', subEl.getAttribute('d'));
                    el.clipContainer.appendChild(copy);
                  }
                }
                movie.defs.appendChild(el.clipContainer);
                el.clippedGroups = getSlotGroups(slot.order + 1, change.value);
                for (var i_clip = 0; i_clip < el.clippedGroups.length; i_clip++) {
                  el.clippedGroups[i_clip].setAttribute('clip-path', 'url(#' + clipID + ')');
                }
              }
              break;
          }
        }
        el.style.display = 'inline';
      }
      //movie.timeline.playHead = n;
    }
    client.onframeset = function onframeset(frameset) {
      var parts = frameset.bounds.split(/ /g);
      movie.setAttribute('viewBox', frameset.bounds);
      movie.setAttribute('width', (parts[2] - parts[0]) / 20);
      movie.setAttribute('height', (parts[3] - parts[1]) / 20);
      movie.timeline.frameCount = frameset.count;
      scrubber.max = frameset.count-1;
      scrubber.onchange = function(e) {
        var frame = +this.value;
        drawFrame(frame);
      };
      console.log('frameset', frameset);
    };
    var buttons = {};
    client.onframe = function onframe(frame) {
      for (var i_update = 0; i_update < frame.updates.length; i_update++) {
        var update = frame.updates[i_update];
        switch (update.type) {
          case 'insert':
          case 'replace':
            var displayObject;
            if (update.url in buttons) {
              displayObject = buttons[update.url].cloneNode(true);
            }
            else {
              displayObject = createSVGElement('use');
              displayObject.setAttribute('href', update.url);
            }
            displayObject.style.display = 'none';
            displayObject.order = update.order;
            var i_slot = slotObjects.sortedIndexOf(displayObject, COMPARE_ORDER);
            if (i_slot < 0) {
              i_slot = ~i_slot;
            }
            else while (i_slot < slotObjects.length && slotObjects[i_slot].order === displayObject.order) {
              i_slot++;
            }
            if (i_slot === slotObjects.length) {
              var container = movie.stage;
              while (container.lastChild && 'maxClipDepth' in container.lastChild && container.lastChild.maxClipDepth >= update.order) {
                container = container.lastChild;
              }
              container.appendChild(displayObject);
            }
            else {
              var referenceNode = slotObjects[i_slot];
              var container = referenceNode.parentNode;
              while ('minClipDepth' in container && container.minClipDepth > update.order) {
                referenceNode = container;
                container = container.parentNode;
              }
              if (referenceNode.previousSibling && 'maxClipDepth' in referenceNode.previousSibling && referenceNode.previousSibling.maxClipDepth >= update.order) {
                container = referenceNode.previousSibling;
                while (container.lastChild && 'maxClipDepth' in container.lastChild && container.lastChild.maxClipDepth >= update.order) {
                  container = container.lastChild;
                }
                container.appendChild(displayObject);
              }
              else {
                container.insertBefore(displayObject, referenceNode);
              }
            }
            slotObjects.splice(i_slot, 0, displayObject);
            if (update.type === 'replace') {
              movie.timeline.writeReplace(update.order, displayObject, update.settings);
            }
            else {
              movie.timeline.writeInsert(update.order, displayObject, update.settings);
            }
            break;
          case 'modify':
            movie.timeline.writeUpdate(update.order, update.settings);
            break;
          case 'delete':
            movie.timeline.writeRemove(update.order);
            break;
        }
      }
      var firstFrame = movie.timeline.writeHead === 0;
      movie.timeline.writeHead += frame.count;
      if (firstFrame) drawFrame();
    };
    client.ondef = function(def) {
      movie.defs.appendChild(def);
    };
    client.onbutton = function(button) {
      var el = createSVGElement('g');
      el.setAttribute('class', 'button');
      el.setAttribute('tabindex', '0');
      var memberList = [];
      for (var i = 0; i < button.contentUpdates.length; i++) {
        var update = button.contentUpdates[i];
        // always 'insert'
        var member = createSVGElement('use');
        member.setAttribute('href', update.url);
        member.order = update.order;
        var i_member = memberList.sortedIndexOf(member, COMPARE_ORDER);
        if (i_member < 0) {
          i_member = ~i_member;
        }
        else while (i_member < memberList.length && memberList[i_member].order === member.order) {
          i_member++;
        }
        if (i_member === memberList.length) {
          el.appendChild(member);
        }
        else {
          el.insertBefore(member, memberList[i_member]);
        }
        memberList.splice(i_member, 0, member);
        for (var k in update.settings) {
          var v = update.settings[k];
          switch (k) {
            case 'transform':
              member.setAttribute('transform', v);
              break;
            case 'class':
              member.setAttribute('class', v);
              break;
          }
        }
      }
      buttons[button.id] = el;
    };
    client.open('//cors.archive.org/cors/' + item + '/' + path);
  }
  
  init_hash();
  //window.addEventListener('hashchange', init_hash);
  
});
