define(function() {

  'use strict';
  
  const NULLFUNC = function(){};
  
  function SWFDecoderClient() {
    this.dependingURLs = {};
    this.send = this.send_queue;
  }
  SWFDecoderClient.prototype = {
    // onframeset(<frameset> = {
    //  count: 100,
    //  /* per second: */
    //  rate: 12,
    //  /* svg viewBox format, in units 1/20th of a pixel: */
    //  bounds: '0 0 2000 2000',
    // })
    onframeset: NULLFUNC,
    
    // onaudiostream('blob://...', 'audio/mpeg')
    onaudiostream: NULLFUNC,
    
    // onframe(0, <frame> = {
    //  /* >1 to indicate a run of several identical frames: */
    //  count: 1,
    //  /* if count>1, label is for the first frame in the run: */
    //  label: 'myframe',
    //  /* in seconds: */
    //  streamSlice: [0, 0.1],
    //  updates: [
    //    <update:movie-settings> = {
    //      type: 'modify',
    //      displayOrder: -1, // -1 = movie itself
    //      settings: <movieSettings> = {
    //        backgroundColor: '#000',
    //        useNetwork: true,
    //        useSWFRelativeURLs: true,
    //        suppressCrossDomainCaching: true,
    //        allowABC: true,
    //        hasMetadata: true,
    //        debugID: <uuid-string>,
    //        debugPasswordMD5: <md5-string>,
    //      },
    //    },
    //    <update:insert> = {
    //      type: 'insert',
    //      displayOrder: 1,
    //      displayObject: <displayObject>,
    //      /* all optional, including settings object itself: */
    //      settings: <settings> = {
    //        name: 'displayObjectName',
    //        transform: 'translate(100, 100) ...',
    //        /* feColorMatrix values format: */
    //        colorMatrix: '1 0 0 0 0 ...',
    //        /* morph shapes only: */
    //        morphRatio: 0.5,
    //        /* sprites only: */
    //        spriteReplaceTag: 300,
    //        spriteEventHandlers: {
    //          onload: <script>,
    //          onenterframe: <script>,
    //          onunload: <script>,
    //          onmousemove: <script>,
    //          onmousedown: <script>,
    //          onmouseup: <script>,
    //          onkeydown: <script>,
    //          onkeyup: <script>,
    //          ondata: <script>,
    //          oninitialize: <script>,
    //          onpress: <script>,
    //          onrelease: <script>,
    //          onreleaseoutside: <script>,
    //          onrollover: <script>,
    //          onrollout: <script>,
    //          ondragover: <script>,
    //          ondragout: <script>,
    //        },
    //        spriteKeyHandlers: <keyHandlers> = {
    //          ArrowLeft: <script>,
    //          ArrowRight: <script>,
    //          ArrowUp: <script>,
    //          ArrowDown: <script>,
    //          PageUp: <script>,
    //          PageDown: <script>,
    //          Home: <script>,
    //          End: <script>,
    //          Insert: <script>,
    //          Delete: <script>,
    //          Backspace: <script>,
    //          Enter: <script>,
    //          Tab: <script>,
    //          Escape: <script>,
    //          ' ': <script>,
    //          '!': <script>,
    //          ...
    //          'z': <script>,
    //        },
    //      },
    //    },
    //    <update:modify> = {
    //      type: 'modify',
    //      displayOrder: 1,
    //      settings: <settings>,
    //    },
    //    <update:replace> = {
    //      type: 'replace',
    //      displayOrder: 1,
    //      displayObject: <displayObject>,
    //      settings: <settings>,
    //    },
    //    <update:delete> = {
    //      type: 'delete',
    //      displayOrder: 1,
    //    },
    //    <update:script-action> = {
    //      type: 'script',
    //      script: <script>,
    //    },
    //    <update:start-sound> = {
    //      type: 'sound-action',
    //      soundAction: <soundAction:start> = {
    //        type: 'start',
    //        url: <url>,
    //
    //        /* the following are all optional: */
    //
    //        loopCount: 5,
    //        /* in seconds: */
    //        sliceStart: 0.1,
    //        sliceEnd: 0.3,
    //        envelope: [
    //          /* gain would have one element for mono: */
    //          <envelopePoint> = {seconds:0, gain:[0.5, 1]},
    //          <envelopePoint>...
    //        ],
    //        /* if same sound already playing, stop it & start afresh: */
    //        noMultiple: true,
    //      },
    //    },
    //    <update:stop-sound> = {
    //      type: 'sound-action',
    //      soundAction: <soundAction:stop> = {
    //        type: 'stop',
    //        url: <url>,
    //      },
    //    },
    //    <update>...
    //  ],
    // })
    onframe: NULLFUNC,
    
    // onbutton(<button> = {
    //  id: id,
    //  /* may be absent instead of false: */
    //  isMenuButton: true,
    //  /* optional: */
    //  colorMatrix: '1 0 0 0 0 ...',
    //  /* optional: */
    //  scalingGrid: '50 50 100 100',
    //  contentUpdates: [
    //    <update:insert> = {
    //      /* always 'insert' */
    //      type: 'insert',
    //      displayOrder: 1,
    //      displayObject: <displayObject>,
    //      /* or some subset of this list: */
    //      displayClasses: ['hit-test', 'down', 'over', 'up'],
    //      settings: {
    //        transform: 'translate(100, 100) ...',
    //        colorMatrix: '1 0 0 0 0 ...',
    //      },
    //    },
    //    <update:insert>...
    //  ],
    //  /* note that several handlers may be the same <script> */
    //  transitionHandlers: {
    //    onidle2overup: <script>,
    //    onoverup2overdown: <script>,
    //    onoverdown2overup: <script>,
    //    onoverdown2outdown: <script>,
    //    onoutdown2overdown: <script>,
    //    onoutdown2idle: <script>,
    //    onidle2overdown: <script>,
    //    onoverdown2idle: <script>,
    //  },
    //  transitionSounds: {
    //    overdown2overup: <soundAction>,
    //    overup2overdown: <soundAction>,
    //    idle2overup: <soundAction>,
    //    overup2idle: <soundAction>,
    //  },
    //  keyHandlers: <keyHandlers>,
    // })
    onbutton: NULLFUNC,
    
    // onsprite(id, <sprite> = {
    //  frames: [<frame>, <frame>...],
    // })
    onsprite: NULLFUNC,
    
    // onfont(id, <font> = {
    //  family: 'familyName',
    //  source: <url>,
    //  descriptors: {
    //    weight: 500,
    //    style:'italic',
    //    unicodeRange:'U+0026-00FF',
    //  },
    // })
    onfont: NULLFUNC,
    
    // onsound(id, <sound> = {
    //  url: <url>,
    //  hz: 44100,
    //  duration: 3.5,
    //  channels: 2,
    //  type: 'audio/mpeg',
    // })
    onsound: NULLFUNC,
    
    // onbitmap(id, <bitmap> = {
    //  url: url,
    //  width: width,
    //  height: height,
    // })
    onbitmap: NULLFUNC,
    
    // onexport('font', 'exportedFont', <font>)
    // onexport('sprite', 'exportedSprite', <sprite>);
    // onexport('sound', 'exportedSound', <sound>);
    // onexport('bitmap', 'exportedBitmap', <bitmap>);
    // onexport('shape', 'exportedShape', 'blob://...#shape3');
    // onexport('morphShape', 'exportedMorphShape', 'blob://...#morph4');
    // onexport('text', 'exportedText', 'blob://...#text5');
    // onexport('editText', 'exportedEditText', 'blob://...#editText6');
    onexport: function(type, exportSymbol, def) {
      self.dispatchEvent(new CustomEvent('swf-export', {
        detail: {
          movieURL: this.url,
          exportSymbol: exportSymbol,
          def: def,
        },
      }));
    },
    
    onurldependency: function(dependingURL, dependedOnURL) {
      if (dependedOnURL in this.dependingURLs) {
        this.dependingURLs[dependedOnURL].push(dependingURL);
      }
      else {
        this.dependingURLs[dependedOnURL] = [dependingURL];
      }
    },
    
    freeURL: function(url) {
      var deps = this.dependingURLs[url];
      if (deps) for (var i = 0; i < deps.length; i++) {
        this.freeURL(deps[i]);
      }
      delete this.dependingURLs[url];
      URL.revokeObjectURL(url);
    },
    
    freeAllURLs: function() {
      for (url in this.dependingURLs) {
        URL.revokeObjectURL(url);
      }
      this.dependingURLs = {};
    },
    
    send_immediate: function(message) {
      this.worker.postMessage('[' + JSON.stringify(message) + ']');
    },
    send_queue: function(message) {
      if (!this.queue) this.queue = [];
      this.queue.push(message);
    },
    open: function(url) {
      if (this.worker) {
        throw new Error('client already running');
      }
      this.url = url = new URL(url, location.href).toString(); // make absolute
      this.worker = new Worker('swfDecoderWorker.js');
      this.worker.onmessage = this.gotmessage.bind(this);
      this.worker.onerror = this.goterror.bind(this);
      this.worker.onmessageerror = this.gotmessageerror.bind(this);
      this.send(["open", url]);
    },
    openExports: function(url) {
      if (this.worker) {
        throw new Error('client already running');
      }
      this.url = url = new URL(url, location.href).toString(); // make absolute
      this.worker = new Worker('swfDecoderWorker.js');
      this.worker.onmessage = this.gotmessage.bind(this);
      this.worker.onerror = this.goterror.bind(this);
      this.worker.onmessageerror = this.gotmessageerror.bind(this);
      this.send(["import", url]);
    },
    close: function() {
      this.worker.onmessage = null;
      this.worker.terminate();
      delete this.worker;
    },
    
    // internal methods for client/worker communication
    gotmessage: function(e) {
      // console.log(e.data);
      const messages = JSON.parse(e.data);
      var message;
      for (var i = 0; i < messages.length; i++) {
        switch ((message = messages[i])[0]) {
          case 'ready':
            if (this.queue) {
              this.worker.postMessage(JSON.stringify(this.queue));
              delete this.queue;
            }
            this.send = this.send_immediate;
            break;
          case 'init':
            this.onframeset(message[1]);
            break;
          case 'dep':
            for (var i_dep = 3; i_dep < message.length; i_dep++) {
              this.onurldependency(message[2], message[i_dep]);
            }
            break;
          case 'btn':
            var button = new Button;
            button.id = message[1];
            for (var i_part = 2; i_part < message.length; i_part++) {
              var part = message[i_part];
              switch (part[0]) {
                case 'i':
                  var insertion = new InsertUpdate;
                  insertion.order = part[1];
                  insertion.url = part[2];
                  for (var i_modifier = 3; i_modifier < part.length; i_modifier++) {
                    insertion.addModifier.apply(insertion, part[i_modifier]);
                  }
                  button.contentUpdates.push(insertion);
                  break;
              }
            }
            this.onbutton(button);
            break;
          case 'f':
            var frame = new DecodedFrame;
            var i_update = 1;
            if (typeof message[i_update] === 'string') {
              frame.label = message[i_update++];
            }
            if (typeof message[i_update] === 'number') {
              frame.count = message[i_update++];
            }
            while (i_update < message.length) {
              var part = message[i_update++];
              switch (part[0]) {
                case 'i':
                  var insertion = new InsertUpdate;
                  insertion.order = part[1];
                  insertion.url = part[2];
                  for (var i_modifier = 3; i_modifier < part.length; i_modifier++) {
                    insertion.addModifier.apply(insertion, part[i_modifier]);
                  }
                  frame.updates.push(insertion);
                  break;
                case 'm':
                  var modification = new ModifyUpdate;
                  modification.order = part[1];
                  for (var i_modifier = 2; i_modifier < part.length; i_modifier++) {
                    modification.addModifier.apply(modification, part[i_modifier]);
                  }
                  frame.updates.push(modification);
                  break;
                case 'r':
                  var replacement = new ReplaceUpdate;
                  replacement.order = part[1];
                  replacement.url = part[2];
                  for (var i_modifier = 3; i_modifier < part.length; i_modifier++) {
                    replacement.addModifier.apply(replacement, part[i_modifier]);
                  }
                  frame.updates.push(replacement);
                  break;
                case 'd':
                  var deletion = new DeleteUpdate;
                  deletion.order = part[1];
                  frame.updates.push(deletion);
                  break;
                case 'do':
                  break;
                case 'play':
                case 'play-exclusive':
                case 'stop':
                  break;
                case 'strm':
                  frame.audioStream = message.slice(1);
                  break;
              }
            }
            this.onframe(frame);
            break;
        }
      }
    },
    goterror: function(e) {
      console.error('worker error', e);
    },
    gotmessageerror: function(e) {
      console.error('message decoding error', e);
    },
  };
  
  function DecodedFrame() {
    this.updates = [];
  }
  DecodedFrame.prototype = {
    count: 1,
    label: null,
    streamSlice: null,
  };
  
  function InsertUpdate() {
    this.settings = Object.create(null);
  }
  InsertUpdate.prototype = {
    type: 'insert',
    addModifier: function(name, value) {
      this.settings[name] = value;
    },
  };
  
  function ModifyUpdate() {
    this.settings = Object.create(null);
  }
  ModifyUpdate.prototype = {
    type: 'modify',
    addModifier: InsertUpdate.prototype.addModifier,
  };
  
  function ReplaceUpdate() {
    this.settings = Object.create(null);
  }
  ReplaceUpdate.prototype = {
    type: 'replace',
    addModifier: InsertUpdate.prototype.addModifier,
  };
  
  function DeleteUpdate() {
  }
  DeleteUpdate.prototype = {
    type: 'delete',
  };
  
  function Button() {
    this.contentUpdates = [];
  }
  Button.prototype = {
  };
  
  return SWFDecoderClient;

});
