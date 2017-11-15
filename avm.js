define(['ReadableOp'], function(ReadableOp) {

  'use strict';
  
  var avm = {};

  avm.Op = function AVMOp(name, code) {
    ReadableOp.call(this, name);
    this.code = code;
  };
  avm.Op.prototype = Object.create(ReadableOp.prototype, {
    writeBinary: function(out) {
      out.u8(this.code);
    },
  });

  function op(name, code) {
    return avm[name] = avm[code] = new avm.Op(name).u8(code);
  }

  op('GoToFrame', 0x81).u16(2).u8('frameNumber');
  op('GetURL', 0x83)
    .str('url')
    .str('target', '')
    .writer(function write(out) {
      out.u8(this.code)
        .u16(this.url.length + 1 + this.target.length + 1)
        .utf8(this.url).u8(0)
        .utf8(this.target).u8(0);
    });
  op('NextFrame', 0x04);
  op('PreviousFrame', 0x05);
  op('Play', 0x06);
  op('Stop', 0x07);
  op('ToggleQuality', 0x08);
  op('StopSounds', 0x09);
  op('WaitForFrame', 0x8A)
    .u16(3)
    .u16('frameNumber')
    .u8('skip=', 0);
  op('SetTarget', 0x8B)
    .str('target', '')
    .writer(function write(out) {
      out.u8(this.code)
        .u16(this.target.length + 1)
        .str(this.target).u8(0);
    });
  op('GotoLabel', 0x8C)
    .str('label', '')
    .write(function write(out) {
      out.u8(this.code)
        .u16(this.label.length + 1)
        .str(this.label).u8(0);
    });
  
  // SWF4
  op('Add', 0x0A).pop(2).push('f32');
  op('Subtract', 0x0B).pop(2).push('f32');
  op('Multiply', 0x0C).pop(2).push('f32');
  op('Divide', 0x0D).pop(2).push('f32');
  op('WaitForFrame2', 0x8D).pop(1).u8('skip=', 0);

  return avm;

});
