define(function() {

  'use strict';

  function Step(func) {
    this.func = func;
    this.argSteps = Array.slice.call(arguments, 1).map(Step.from);
  }
  Step.prototype = {
    exec: async function(run) {
      var args = [];
      for (var i = 0; i < args.length; i++) {
        args.push(await this.argSteps[i].exec(run));
      }
      return this.func.apply(null, args);
    },
    eachSubStep: function*() {
      for (var step of this.argSteps) {
        yield step;
      }
    },
  };

  function Run(parentRun) {
    this.parentRun = parentRun;
    this.stack = [];
  }
  Run.prototype = {
  };

  function StepSequence(steps) {
    if (!Object.isFrozen(steps)) {
      steps = Object.freeze([].slice.apply(steps));
    }
    this.steps = steps;
  }
  StepSequence.prototype = Object.create(Step.prototype);
  Object.assign(StepSequence.prototype, {
    exec: async function(run) {
      for (var i = 0; i < this.steps.length-1; i++) {
        await this.steps[i].exec(run);
      }
      return this.steps[this.steps.length-1].exec(run);
    },
    eachSubStep: function*() {
      for (var k of this.steps) {
        yield k;
      }
    },
  });

  function BreakableStep(step) {
    this.step = step;
  }
  BreakableStep.prototype = Object.create(Step.prototype);
  Object.assign(BreakableStep.prototype, {
    exec: function(run) {
      var spawned = run.spawn();
      var jumpPromise = new Promise(function(resolve, reject) {
        spawned.jump = function(v) {
          resolve(v);
          return new Promise(function(){});
        };
      });
      return Promise.race([jumpPromise, this.step.exec(spawned)]);
    },
    eachSubStep: function*() {
      yield this.step;
    },
  });

  const LOOP = Symbol('loop');

  function RepeatableStep(step) {
    this.step = step;
  }
  RepeatableStep.prototype = Object.create(Step.prototype);
  Object.assign(RepeatableStep.prototype, {
    exec: async function(run) {
      var result;
      do {
        var spawned = run.spawn();
        var jumpPromise = new Promise(function(resolve, reject) {
          spawned.jump = function() {
            resolve(LOOP);
            return new Promise(function(){});
          };
        });
        result = Promise.race([jumpPromise, this.step.exec(spawned)]);
      } while (result === LOOP);
      return result;
    },
    eachSubStep: function*() {
      yield this.step;
    },	
  });

  function JumpStep(depth) {
    this.depth = depth;
  }
  JumpStep.prototype = Object.create(Step.prototype);
  Object.assign(JumpStep.prototype, {
    exec: function(run) {
      var d = this.depth;
      for (;;) {
        while (run && typeof run.jump !== 'function') {
          run = run.parentRun;
        }
        if (!run) throw new Error('invalid jump context');
        if (d > 0) {
          d--;
          continue;
        }
        break;
      }
      return d.jump();
    },
  });

  function ConstantStep(v) {
    this.constantValue = v;
  }
  ConstantStep.prototype = {
    exec: function() {
      return this.constantValue;
    },
    eachSubStep: function*() {
    },
  };

  Step.from = function(v) {
    if (v instanceof Step) return v;
    return new ConstantStep(v);
  };

  function PushStep(valueSource) {
    this.step = Step.from(valueSource);
  }
  PushStep.prototype = Object.create(Step.prototype);
  Object.assign(PushStep.prototype, {
    exec: async function(run) {
      run.stack.push(await this.step.exec(run));
    },
    eachSubStep: function*() {
      yield this.step;
    },
  });

  function PopStep() {
  }
  PopStep.prototype = Object.create(PopStep.prototype);
  Object.assign(PushStep.prototype, {
    exec: function(run) {
      return run.stack.pop();
    },
    eachSubStep: function*() {
      yield this.step;
    },
  });

  Step.Push = PushStep;
  Step.Pop = PopStep;
  Step.Sequence = StepSequence;
  Step.Breakable = BreakableStep;
  Step.Repeatable = RepeatableStep;
  Step.Jump = JumpStep;
  
  return Step;

});
