define(['arrayExtensions'], function(arrayExtensions) {

  'use strict';

  const COMPARE_NUM = function (a, b) {
    return a - b;
  };

  function Cel(templateElement) {
    this.templateElement = templateElement;
  }
  Cel.prototype = {
    type: 'cel',
  };

  function EmptyCel() {
  }
  EmptyCel.prototype = Object.assign(Object.create(Cel.prototype), {
    type: 'empty',
  });
  EmptyCel.instance = new EmptyCel;

  function ContainerCel() {
    this.cels = [];
    this.celDepths = [];
    this.celSettings = [];
  }
  ContainerCel.prototype = Object.assign(Object.create(Cel.prototype), {
    type: 'container',
    addCelAtDepth: function(depth, cel, settings) {
      var i_cel = this.celDepths.sortedIndexOf(depth, COMPARE_NUM);
      if (i_cel < 0) {
        i_cel = ~i_cel;
      }
      else {
        do { i_cel++; } while (this.celDepths[i_cel] === depth);
      }
      this.cels.splice(i_cel, 0, cel);
      this.celDepths.splice(i_cel, 0, depth);
      this.celSettings.splice(i_cel, 0, settings || null);
    },
  });
  
  function CelSequence() {
    this.cels = [EmptyCel.instance];
    this.celStartFrames = [0];
    this.celSettings = [null];
  }
  CelSequence.prototype = {
    setCelAtFrame: function(startFrame, cel, settings) {
      cel = cel || EmptyCel.instance;
      settings = settings || null;
      var i_cel = this.celStartFrames.sortedIndexOf(startFrame, COMPARE_NUM);
      if (i_cel < 0) {
        i_cel = ~i_cel;
        this.cels.splice(i_cel, 0, cel);
        this.celStartFrames.splice(i_cel, 0, startFrame);
        this.celSettings.splice(i_cel, 0, settings);
      }
      else {
        this.cels[i_cel] = cel;
        this.celSettings[i_cel] = settings;
      }
    },
  };

  function TimelineCel() {
    this.celSequenceDepths = [];
    this.celSequencesByDepth = Object.create(null);
  }
  TimelineCel.prototype = Object.assign(Object.create(Cel.prototype), {
    type: 'timeline',
    getSequenceAtDepth: function(depth) {
      if (depth in this.celSequencesByDepth) {
        return this.celSequencesByDepth[depth];
      }
      this.celSequenceDepths.splice(~this.celSequenceDepths.sortedIndexOf(depth, COMPARE_NUM), 0, depth);
      return this.celSequencesByDepth[depth] = new CelSequence;
    },
  });

  Object.assign(Cel, {
    Empty: EmptyCel,
    Container: ContainerCel,
    Timeline: TimelineCel,
  });

  return Cel;
  
});
