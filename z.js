define(function() {

  'use strict';
  
  var lib = {};
  
  if (typeof Uint8Array.prototype.fill !== 'function') {
    Uint8Array.prototype.fill = Array.prototype.fill;
  }
  
  const TINFL_FLAG_PARSE_ZLIB_HEADER = 1,
    TINFL_FLAG_HAS_MORE_INPUT = 2,
    TINFL_FLAG_USING_NON_WRAPPING_OUTPUT_BUF = 4,
    TINFL_FLAG_COMPUTE_ADLER32 = 8;
  
  lib.load = function load(name, parentRequire, onload, config) {
    var xhr = new XmlHttpRequest;
    xhr.open('GET', 'miniz.wasm');
    xhr.responseType = 'arraybuffer';
    xhr.onerror = function onerror(e) {
      onload.error(e.error);
    };
    xhr.onload = function onload(e) {
      WebAssembly.compile(this.response)
      .then(function(module) {
        var memory, memBase, nextFree, allocated = [], byPtr = {};
        function __assert_fail(a, b, c, d) {
          throw new Error('assertion failed');
        }
        function malloc(size) {
          if ((nextFree+size) > memory.buffer.byteLength) {
            var ptr = memBase;
            for (var i = 0; i < allocated.length; i++) {
              if ((allocated[i].start - ptr) >= size) {
                allocated.splice(i, 0, byPtr[ptr] = {start:ptr, end:ptr + size});
                return ptr;
              }
              ptr = allocated[i].end;
            }
            memory.grow(Math.ceil(size/65536));
          }
          ptr = nextFree;
          nextFree += size;
          allocated.push(byPtr[ptr] = {start:ptr, end:nextFree});
          return ptr;
        },
        free: function(ptr) {
          var freeMe = byPtr[ptr];
          if (!freeMe) {
            console.log('cannot free ' + ptr);
            return;
          }
          delete byPtr[ptr];
          allocated.splice(allocated.indexOf(freeMe), 1);
        }
        function memcpy(dest, source, size) {
          size = (size + 3) & ~3;
          new Uint8Array(memory.buffer, dest, size).set(new Uint8Array(memory.buffer, source, size));
          return dest;
        }
        function memset(ptr, value, num) {
          var mem = new Uint8Array(num);
          if (value !== 0) {
            mem.fill(value);
          }
          new Uint8Array(memory.buffer, ptr).set(mem);
          return ptr;
        }
        function realloc(ptr, size) {
          var slot = byPtr[ptr];
          if (!slot) {
            throw new Error('realloc unallocated memory');
          }
          if (slot.end === nextFree && (slot.start + size) <= memory.buffer.byteLength) {
            nextFree = slot.end = slot.start + size;
            return ptr;
          }
          var newPtr = malloc(size);
          memcpy(newPtr, ptr, size);
          free(ptr);
          return newPtr;
        }
        return WebAssembly.instantiate(module, {
          __assert_fail: __assert_fail,
          malloc: malloc,
          free: free,
          memcpy: memcpy,
          memset: memset,
          realloc: realloc,
        })
        .then(function(instance) {
          memory = instance.exports.memory;
          memBase = memory.buffer.byteLength;
          var tinfl_decompress_mem_to_mem = instance.exports.tinfl_decompress_mem_to_mem;
          onload({
            inflate: function(bytes, finalLength) {
              var fromPtr = malloc(bytes.length);
              new Uint8Array(memory.buffer, fromPtr, bytes.length).set(bytes);
              var toPtr = malloc(finalLength);
              var written = tinfl_decompress_mem_to_mem(toPtr, finalLength, fromPtr, bytes.length,
                TINFL_FLAG_PARSE_ZLIB_HEADER | TINFL_FLAG_USING_NON_WRAPPING_OUTPUT_BUF);
              if (written < 0) {
                free(fromPtr);
                free(toPtr);
                throw new Error('failed');
              }
              var result = new Uint8Array(new Uint8Array(memory.buffer, toPtr, written));
              free(fromPtr);
              free(toPtr);
              return result;
            },
          });
        });
      })
      .catch(function(e) {
        onload.error(e);
      });
    };
    xhr.connect();
  };
  
  return lib;

});
