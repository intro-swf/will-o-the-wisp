define(['bytecodeIO'], function(bytecodeIO) {

  'use strict';
  
  var avm = {};

  function op(name, code) {
    var op = new bytecodeIO.Op();
    op.symbol(name).u8(code);
    avm[name] = avm[code] = op;
    return op;
  }
  
  // SWF3+
  op('GoToFrame', 0x81)
    .u16(2)
    .u16('frameNumber');
  op('GetURL', 0x83)
    .byteReader(function(bin) {
      this.totalLength = bin.u16();
    })
    .byteWriter(function(bout) {
      bin.u16(this.url.length + 1 + this.target.length + 1);
    })
    .nullTerminatedString('url')
    .nullTerminatedString('target')
    .byteReader(function(bin) {
      var actualLength = this.url.length + 1 + this.target.length + 1;
      if (actualLength !== this.totalLength) {
        throw new Error(
          'incorrect length: expected ' + this.totalLength
          + ', got ' + actualLength);
      }
      delete this.totalLength;
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
    .u8('skip=');
  op('SetTarget', 0x8B)
    .byteReader(function(bin) {
      this.totalLength = bin.u16();
    })
    .byteWriter(function(bout) {
      bin.u16(this.target.length + 1);
    })
    .nullTerminatedString('target')
    .binaryReader(function(bin) {
      var actualLength = this.target.length + 1;
      if (actualLength !== this.totalLength) {
        throw new Error(
          'incorrect length: expected ' + this.totalLength
          + ', got ' + actualLength);
      }
      delete this.totalLength;
    });
  op('GotoLabel', 0x8C)
    .byteReader(function(bin) {
      this.totalLength = bin.u16();
    })
    .byteWriter(function(bout) {
      bin.u16(this.label.length + 1);
    })
    .nullTerminatedString('label')
    .binaryReader(function(bin) {
      var actualLength = this.label.length + 1;
      if (actualLength !== this.totalLength) {
        throw new Error(
          'incorrect length: expected ' + this.totalLength
          + ', got ' + actualLength);
      }
      delete this.totalLength;
    });
  
  // SWF4+
  op('Add', 0x0A).pop('f32', 'f32').push('f32');
  op('Subtract', 0x0B).pop('f32', 'f32').push('f32');
  op('Multiply', 0x0C).pop('f32', 'f32').push('f32');
  op('Divide', 0x0D).pop('f32', 'f32').push('f32');
  op('WaitForFrame2', 0x8D).pop(1).u8('skip=', 0);
  op('Equals', 0x0E).pop('f32', 'f32').push('bool');
  op('Less', 0x0F).pop('f32', 'f32').push('bool');
  op('And', 0x10).pop('f32', 'f32').push('bool');
  op('Or', 0x11).pop('f32', 'f32').push('bool');
  op('Not', 0x12).pop('f32', 'f32').push('bool');
  op('StringEquals', 0x13).pop('str', 'str').push('bool');
  op('StringLength', 0x14).pop('str').push('f32');
  op('StringExtract', 0x15).pop('str', 'f32', 'f32').push('str');
  op('Push', 0x96)
    .byteReader(function(bin) {
      var mode = bin.u8();
      if (mode === 0) {
        this.value = bin.f32();
      }
      else if (mode === 1) {
        this.value = this.nullTerminatedString();
      }
      else {
        throw new Error('Push: unknown type ID ' + mode);
      }
    })
    .byteWriter(function(bout) {
      if (typeof this.value === 'number') {
        bout.u8(0).f32(this.value);
      }
      else {
        bout.u8(1).nullTerminatedString(this.value);
      }
    })
    .symbolReader(function(sin) {
      this.value = sin.expect('string', 'float', 'int');
    });
  op('Pop', 0x17).pop(1);
  op('ToInteger', 0x18).pop(1).push('f32');
  op('GetVariable', 0x1C).pop(1).push(1);
  op('SetVariable', 0x1D).pop(2);
  op('SetTarget2', 0x20).pop(1);
  op('StringAdd', 0x21).pop(2).push('str');
  op('GetProperty', 0x22).pop(2).push(1);
  op('SetProperty', 0x23).pop(3);
  op('CloneSprite', 0x24).pop(3);
  op('RemoveSprite', 0x25).pop(1);
  op('Trace', 0x26);
  op('StartDrag', 0x27);
  op('EndDrag', 0x28);
  op('StringLess', 0x29).pop(2).push('bool');
  op('RandomNumber', 0x30).pop(1).push('f32');
  op('MBStringLength', 0x31).pop(1).push('f32');
  op('CharToAscii', 0x32).pop(1).push('f32');
  op('AsciiToChar', 0x33).pop(1).push('str');
  op('GetTime', 0x34).push('f32');
  op('MBStringExtract', 0x35).pop(3).push('str');
  op('MBCharToAscii', 0x36).pop(1).push('f32');
  op('MBAsciiToChar', 0x37).pop(1).push('str');
  op('Jump', 0x99).i16('offset');
  op('GetURL2', 0x9A).enum('send_vars', 'u8', {off:0, get:1, post:2});
  op('If', 0x9D).i16('offset');
  op('Call', 0x9E).pop(1); // does this push?
  op('GotoFrame2', 0x9F).enum('and_play', 'u8', {false:0, true:1});
  
  // SWF6+
  op('CallFunction', 0x3D).pop([2, Infinity]).push(1);
  op('CallMethod', 0x52).pop([3, Infinity]).push(1);
  op('ConstantPool', 0x86).str('pool');
  op('DefineFunction', 0x9B)
    .str('name').u8(0)
    .readTokens(function read(input) {
      this.paramNames = [];
      var param;
      while (param = input.nextOp('param')) {
        this.paramNames.push(param.requireString());
        param.requireEnd();
      }
      // TODO: body code
    })
    .writeTokens(function write(output) {
      for (var i = 0; i < this.paramNames.length; i++) {
        var param = output.openOp('param');
        param.string(this.paramNames[i]);
        param.close();
      }
      // TODO: body code
    })
    .readBytes(function read(input) {
      this.paramNames = [];
      for (var count = input.u16(); count > 0; count--) {
        this.paramNames.push(input.str());
      }
      // TODO: body code
    })
    .writeBytes(function write(output) {
      output.u16(this.paramNames.length);
      for (var i = 0; i < this.paramNames.length; i++) {
        output.str(this.paramNames[i]).u8(0);
      }
      // TODO: body code
    });
  op('DefineLocal', 0x3C).pop(2);
  op('DefineLocal2', 0x41).pop(2);
  op('Delete', 0x3A).pop(2);
  op('Delete2', 0x3B).pop(1);
  op('Enumerate', 0x46).pop(1).push([1, Infinity]);
  op('Equals2', 0x49).pop(2).push(1);
  op('GetMember', 0x4E).pop(2).push(1);

  return avm;

});
