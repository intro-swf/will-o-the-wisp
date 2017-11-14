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
      this.frameNumber = n;
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
      if (url.indexOf('\0') !== -1 || target.indexOf('\0') !== 0) {
        throw new Error('strings may not contain null characters');
      }
      this.param('url', url, true).param('target', target, true);
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
        out.u8(this.code).u16(3).u16(this.frameNumber).u8(this.skipCount);
      },
    })
    .Typify(function WaitForFrame(frameNumber, skipCount) {
      this.frameNumber = frameNumber;
    });

  return avm;

});
