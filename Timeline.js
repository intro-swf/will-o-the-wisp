define(['arrayExtensions'], function(arrayExtensions) {

  'use strict';

  const COMPARE_NUM = function (a, b) {
    return a - b;
  };

  function Timeline() {
    this.celSequenceDepths = [];
    this.celSequencesByDepth = Object.create(null);
  }
  Timeline.prototype = {
    getCelSequence: function(depth) {
      if (depth in this.celSequenceByDepth) {
        return this.celSequencesByDepth[depth];
      }
      this.depths.splice(~this.celSequenceDepths.sortedIndexOf(depth, COMPARE_NUM), 0, depth);
      return this.celSequencesByDepth[depth] = new CelSequence;
    },
  };

  function CelSequence() {
    this.cels = [EmptyCel.instance];
    this.celStartFrames = [0];
  }
  CelSequence.prototype = {
    setCelAt: function(startFrame, cel) {
      cel = cel || EmptyCel.instance;
      var i_cel = this.celStartFrames.sortedIndexOf(startFrame, COMPARE_NUM);
      if (i_cel < 0) {
        i_cel = ~i_cel;
        this.cels.splice(i_cel, 0, cel);
        this.celStartFrames.splice(i_cel, 0, startFrame);
      }
      else {
        this.cels[i_cel] = cel;
      }
    },
  };

  function Cel() {
    throw new Error('bad constructor');
  }

  function EmptyCel() {
  }
  EmptyCel.prototype = Object.assign(Object.create(Cel.prototype), {
    type: 'empty',
  });
  EmptyCel.instance = new EmptyCel;

  function PositionedCel(settings) {
    this.settings = settings;
  }
  PositionedCel.prototype = Object.assign(Object.create(Cel.prototype), {
  });

  function ShapeCel(templateElement, settings) {
    PositionedCel.call(this, settings);
    this.templateElement = templateElement;
  }
  ShapeCel.prototype = Object.assign(Object.create(PositionedCel.prototype), {
    type: 'shape',
  });

  function ListCel(settings) {
    PositionedCel.call(this, settings);
    this.cels = [];
    this.celDepths = [];
  }
  ListCel.prototype = Object.assign(Object.create(PositionedCel.prototype), {
    type: 'list',
    addCelAt: function(depth, cel) {
      var i_cel = this.celDepths.sortedIndexOf(depth);
      if (i_cel < 0) {
        i_cel = ~i_cel;
      }
      else {
        do { i_cel++; } while (this.celDepths[i_cel] === depth);
      }
      this.depths.splice(i_cel, 0, depth);
      this.cels.splice(i_cel, 0, cel);
    },
  });

  function TimelineCel(timeline, settings) {
    PositionedCel.call(this, settings);
    this.timeline = timeline;
  }
  TimelineCel.prototype = Object.assign(Object.create(PositionedCel.prototype), {
    type: 'timeline',
  });

  Object.assign(Cel, {
    Empty: EmptyCel,
    Positioned: PositionedCel,
    Shape: ShapeCel,
    List: ListCel,
    Timeline: TimelineCel,
  });

  Timeline.Cel = Cel;

  return Timeline;
  
});
