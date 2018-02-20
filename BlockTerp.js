define(function() {

  'use strict';
  
  function BlockTerp() {
    this.macros = Object.create(BlockTerp.defaultMacros);
    this.steps = Object.create(BlockTerp.defaultSteps);
  }
  BlockTerp.prototype = {
    preprocess: function(block) {
      var original = block;
      if (typeof block[0] === 'string') {
        if (block[0] in this.macros) {
          return this.macros[block[0]].call(this, block);
        }
      }
      return block;
    },
    run: async function(block) {
      block = this.preprocess(block);
      if (typeof block[0] !== 'string') {
        if (Array.isArray(block[0])) {
          var result;
          for (var i = 0; i < block.length; i++) {
            result = await this.run(block[i]);
          }
          return result;
        }
        if (block.length === 0) return undefined;
        throw new Error('invalid block');
      }
      if (block[0] in this.steps) {
        return this.steps[block[0]].apply(this, block.slice(1));
      }
      return this.genericStep(block);
    },
    genericStep: function(block) {
      console.warn('unknown step: ' + block[0]);
    },
  };

  BlockTerp.defaultMacros = Object.assign(Object.create(null), {
    rep: function(block) {
      if (block.length !== 3) throw new Error('rep expects 2 arguments');
      if (isNaN(block[1]) || !isFinite(block[1]) || block[1] < 0 || block[1] !== Math.floor(block[1])) {
        throw new Error('rep: first argument must be a non-negative integer');
      }
      if (!Array.isArray(block[2])) {
        throw new Error('rep: second argument must be a block');
      }
      return Array.fill(new Array(block[1]), block[2]);
    },
    '//': function(block) {
      return [];
    },
  });

  BlockTerp.defaultSteps = Object.assign(Object.create(null), {
    constant: function(block) {
      if (block.length !== 2) throw new Error('constant expects 1 argument');
      return block[1];
    },
  });
  
  return BlockTerp;

});
