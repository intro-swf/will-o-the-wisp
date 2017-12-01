define(['arrayExtensions'], function(arrayExtensions) {

  'use strict';

  const COMPARE_ORDER = function(a, b) {
    if (typeof a !== 'number') a = a.order;
    if (typeof b !== 'number') b = b.order;
    return a - b;
  };

  function DisplayListSlot(frame, displayObject, order) {
    this.order = order;
    this.changes = [
      {frame:frame, settingName:'displayObject', value:displayObject},
      {frame:Infinity, settingName:'displayObject', value:null},
    ];
    this.playState = Object.create(null);
  }
  DisplayListSlot.prototype = {
    get firstFrame() {
      return this.changes[0].frame;
    },
    set firstFrame(n) {
      var i = 0;
      while (i < this.changes.length && this.changes[i].frame < n) {
        this.changes[i++].frame = n;
      }
    },
    get lastFrame() {
      return this.changes[this.changes.length-1].frame - 1;
    },
    set lastFrame(v) {
      v++;
      var i = this.changes.length-1;
      this.changes[i].frame = v;
      while (i >= 0 && this.changes[i].frame >= v) {
        i--;
      }
      this.changes.splice(i, this.changes.length-1-i);
    },
    get frameCount() {
      return this.lastFrame + 1 - this.firstFrame;
    },
    get displayObject() {
      for (var i = 0; i < this.changes.length; i++) {
        if (this.changes[i].settingName === 'displayObject') {
          return this.changes[i].value;
        }
      }
      return null;
    },
    setAt: function(i_frame, settingName, value) {
      this.changes.push({frame:i_frame, settingName:settingName, value:value});
    },
  };

  function DisplayListTimeline() {
    this._selfSlot = new DisplayListSlot(0, this, -1);
    this._selfSlot.setAt(1, 'displayObject', null);
    this._allSlots = [this._selfSlot];
    this._writeHeadSlots = [];
    this.eventTarget = self;
  }
  DisplayListTimeline.prototype = {

    get frameCount() { return this._selfSlot.frameCount; },
    set frameCount(n) {
      var oldValue = this._selfSlot.lastFrame;
      if (oldValue === n) return;
      if (isNaN(n) || n <= 0 || !isFinite(n) || n !== Math.floor(n)) {
        throw new TypeError('invalid frame count');
      }
      this._selfSlot.lastFrame = n;
      this.readyFrameCount = Math.min(this.readyFrameCount, n);
      this.writeHead = Math.min(this.writeHead, n-1);
      this.eventTarget.dispatchEvent(new CustomEvent('timeline-change', {
        detail:{timeline:this, settingName:'frameCount', oldValue:oldValue, newValue:n},
      }));
    },

    // write phase ///////////////////////////////////////////////////////////

    _writeHead: 0,
    get writeHead() { return this._writeHead; },
    set writeHead(n) {
      var oldValue = this._writeHead;
      if (oldValue === n) return;
      if (isNaN(n) || n !== Math.floor(n)) {
        throw new TypeError('invalid frame');
      }
      else if (n < oldValue) {
        throw new Error('writeHead can only go forwards, not backwards');
      }
      this.frameCount = Math.max(this.frameCount, n+1);
      this._writeHead = n;
    },

    writeInsert: function(order, displayObject, settings) {
      var slot = new DisplayListSlot(this._writeHead, displayObject, order);
      this._allSlots.push(slot);
      if (settings) for (k in settings) {
        slot.setAt(this._writeHead, k, settings[k]);
      }
      var i_slot = this._writeHeadSlots.binarySearch(slot, COMPARE_ORDER);
      if (i_slot < 0) {
        this._writeHeadSlots.splice(~i_slot, 0, slot);
      }
      else {
        this._writeHeadSlots[i_slot].lastFrame = this._writeHead-1;
        this._writeHeadSlots[i_slot] = slot;
      }
    },

    writeUpdate: function(order, settings) {
      var i_slot = this._writeHeadSlots.binarySearch(order, COMPARE_ORDER);
      if (i_slot < 0) return null;
      var slot = this._writeHeadSlots[i_slot];
      if (arguments.length === 3) {
        slot.setAt(this._writeHead, arguments[1], arguments[2]);
      }
      else for (k in settings) {
        slot.setAt(this._writeHead, k, settings[k]);
      }
      return true;
    },

    writeRemove: function(order) {
      var i_slot = this._writeHeadSlots.binarySearch(order, COMPARE_ORDER);
      if (i_slot < 0) return false;
      this._writeHeadSlots[i_slot].lastFrame = this._writeHead-1;
      this._writeHeadSlots.splice(i_slot, 1);
      return true;
    },

    // ready frames

    _readyFrameCount: 0,
    get readyFrameCount() { return this._readyFrameCount; },
    set readyFrameCount(n) {
      var oldValue = this._readyFrameCount;
      if (oldValue === n) return;
      if (isNaN(n) || n < 0 || n > this.frameCount || n !== Math.floor(n)) {
        throw new TypeError('invalid frame count');
      }
      this._readyFrameCount = n;
      this.eventTarget.dispatchEvent(new CustomEvent('timeline-change', {
        detail:{timeline:this, settingName:'readyFrameCount', oldValue:oldValue, newValue:n},
      }));
    },

    // playback phase ///////////////////////////////////////////////////////

    _frameRate: 12,
    get frameRate() { return this._frameRate; },
    set frameRate(n) {
      var oldValue = this._frameRate;
      if (oldValue === n) return;
      if (isNaN(n) || n <= 0 || !isFinite(n)) {
        throw new TypeError('invalid frame rate');
      }
      this._frameRate = n;
      this.eventTarget.dispatchEvent(new CustomEvent('timeline-change', {
        detail:{timeline:this, settingName:'frameRate', oldValue:oldValue, newValue:n},
      }));
    },

    _playHead: 0,
    get playHead() { return this._playHead; },
    set playHead(n) {
      var oldValue = this._playHead;
      if (oldValue === n) return;
      if (isNaN(n) || n < 0 || n > this.frameCount || n !== Math.floor(n)) {
        throw new TypeError('invalid frame');
      }
      this._playHead = n;
      if (oldValue + 1 === n) {
        this.eventTarget.dispatchEvent(new CustomEvent('timeline-tick', {
          detail: {timeline:this},
        }));
      }
      else {
        this.eventTarget.dispatchEvent(new CustomEvent('timeline-seek', {
          detail: {timeline:this, fromFrame:oldValue},
        }));
      }
    },

    get totalDuration() { return this.frameCount / this.frameRate; },
    get elapsedDuration() { return this.playHead / this.frameRate; },
    get remainingDuration() { return (this.frameCount - this.playHead) / this.frameRate; },

    _paused: true,
    get paused() { return this._paused; },
    set paused(yes) {
      yes = !!yes;
      if (yes === this._paused) return;
      this._paused = yes;
      this.eventTarget.dispatchEvent(new CustomEvent(
        yes ? 'timeline-pause' : 'timeline-unpause',
        {detail:{timeline:this}}
      ));
    },

  };

  DisplayListTimeline.Slot = DisplayListSlot;

  return DisplayListTimeline;

});
