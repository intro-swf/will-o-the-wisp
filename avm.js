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
    return avm[name] = avm[code] = new avm.Op(name, code);
  }

  op('GoToFrame', 0x81)
    .assign({
      writeBinary: function(out) {
        out.u8(this.code).u16(2).u16(this.frameNumber);
      },
    })
    .Typify(function GoToFrame(n) {
      this.param('frameNumber', n);
    });
  op('GetURL', 0x83)
    .assign({
      writeBinary: function(out) {
        out.u8(this.code).u16(this.url.length + 1 + this.target.length + 1)
          .utf8(this.url).u8(0)
          .utf8(this.target).u8(0);
      },
    })
    .Typify(function GetURL(url, target) {
      if (url.indexOf('\0') !== -1 || target.indexOf('\0') !== -1) {
        throw new Error('strings may not contain null characters');
      }
      this.param('url', url).param('target=', target, '');
    });
  op('NextFrame', 0x04);
  op('PreviousFrame', 0x05);
  op('Play', 0x06);
  op('Stop', 0x07);
  op('ToggleQuality', 0x08);
  op('StopSounds', 0x09);
  op('WaitForFrame', 0x8A)
    .assign({
      writeBinary: function(out) {
        out.u8(this.code).u16(3).u16(this.frameNumber).u8(this.skip);
      },
    })
    .Typify(function WaitForFrame(frameNumber, skipCount) {
      this.param('frameNumber', frameNumber).param('skip=', skipCount);
    });
  op('SetTarget', 0x8B)
    .assign({
      writeBinary: function(out) {
        out.u8(this.code).u16(this.target.length + 1).str(this.target).u8(0);
      },
    })
    .Typify(function SetTarget(target) {
      if (target.indexOf('\0') !== -1) {
        throw new Error('strings may not contain null characters');
      }
      this.param('target', target);
    });
  op('GotoLabel', 0x8C)
    .assign({
      writeBinary: function(out) {
        out.u8(this.code).u16(this.label.length + 1).str(this.label).u8(0);
      },
    })
    .Typify(function GotoLabel(label) {
      if (label.indexOf('\0') !== -1) {
        throw new Error('strings may not contain null characters');
      }
      this.param('label', label);
    });

  return avm;

});
