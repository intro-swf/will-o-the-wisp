define(['java'], function(java) {

  const _LABEL = new Symbol('label');
  const _LONGLABEL = new Symbol('longLabel');
  const _COMMANDTYPE = new Symbol('commandType');
  const _PRIORITY = new Symbol('priority');

  function Command(label, longLabel, commandType, priority) {
    this[_LABEL] = label;
    if (arguments.length === 3) {
      this[_COMMANDTYPE] = arguments[1];
      this[_PRIORITY] = arguments[2];
    }
    else {
      this[_LONGLABEL] = longLabel;
      this[_COMMANDTYPE] = commandType;
      this[_PRIORITY] = priority;
    }
  }
  
  java.initClass(Command, {
    name: 'javax.microedition.lcdui.Command',
    instanceMembers: {
      getCommandType: function() {
        return this[_COMMANDTYPE];
      },
      getLabel: function() {
        return this[_LABEL];
      },
      getLongLabel: function() {
        return this[_LONGLABEL] || null;
      },
      getPriority: function() {
        return this[_PRIORITY];
      },
    },
    staticMembers: {
      SCREEN: 1,
      BACK: 2,
      CANCEL: 3,
      OK: 4,
      HELP: 5,
      STOP: 6,
      EXIT: 7,
      ITEM: 8,
    },
  });
  
  return Command;

});
