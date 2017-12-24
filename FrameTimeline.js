define(['arrayExtensions'], function() {

  'use strict';

  const COMPARE_NUM = function(a, b) {
    return a - b;
  };

  function FrameTimeline(selfConfig) {
    this.frames = [];
    if (selfConfig) {
      this.frames[-1] = new TimelineFrame(this, Object.freeze([-1]), Object.freeze({'-1':selfConfig}));
    }
    else {
      this.frames[-1] = new TimelineFrame(this, Object.freeze([]), Object.freeze({}));
    }
  }
  FrameTimeline.prototype = {
    writeHead: null,
    allocateFrame: function() {
      if (this.writeHead) {
        throw new Error('cannot allocate frame until previous frame is committed or discarded');
      }
      var lastFrame = this.frames[this.frames.length-1];
      var frame = new TimelineFrame(this, lastFrame.activeDepths, lastFrame.activeConfig);
      this.writeHead = frame;
      return frame;
    },
    duplicateFrames: function(count) {
      if (isNaN(count) || !isFinite(count) || count < 0) {
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

  function TimelineFrame(timeline, activeDepths, activeConfig) {
    this.timeline = timeline;
    this.activeDepths = activeDepths;
    this.activeConfig = activeConfig;
  }
  TimelineFrame.prototype = {
    get writeDepths() {
      var depths = this.activeDepths = this.activeDepths.slice();
      Object.defineProperty(this, 'writeDepths', {
        value: depths,
      });
      return depths;
    },
    get writeConfig() {
      var config = this.activeConfig = Object.assign(Object.create(null), this.activeConfig);
      Object.defineProperty(this, 'writeConfig', {
        value: config,
      });
      return config;
    },
    put: function(depth, config) {
      var pos_i = this.activeDepths.sortedIndexOf(COMPARE_NUM, depth);
      if (pos_i >= 0) throw new Error('cannot insert: slot already taken');
      this.writeDepths.splice(~pos_i, 0, config);
      this.writeConfig[depth] = config;
    },
    patch: function(depth, configPatch) {
      var pos_i = this.activeDepths.sortedIndexOf(COMPARE_NUM, depth);
      if (pos_i < 0) throw new Error('cannot modify: slot is empty');
      this.writeConfig[depth] = Object.assign({}, this.activeConfig[depth], configPatch);
    },
    delete: function(depth) {
      var pos_i = this.activeDepths.sortedIndexOf(COMPARE_NUM, depth);
      if (pos_i < 0) throw new Error('cannot delete: slot is empty');
      this.writeDepths.splice(pos_i, 1);
      delete this.writeConfig[depth];
    },
    commit: function() {
      if (this.timeline.writeHead !== this) {
        throw new Error('cannot commit: frame is not in write mode');
      }
      if (Object.isFrozen(this.activeDepths) && Object.isFrozen(this.activeConfig)) {
        this.discard();
        this.timeline.duplicateFrames(1);
      }
      else {
        Object.freeze(this.activeDepths);
        Object.freeze(this.activeConfig);
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
  
  FrameTimeline.TimelineFrame = TimelineFrame;

  return FrameTimeline;
  
});
