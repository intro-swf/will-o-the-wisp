define(['java'], function(java) {

  return java.define('javax.microedition.rms.RecordEnumeration', {
    superclass: 'interface',
    methods: {
      destroy: [],
      hasNextElement: [{ret:'boolean'}],
      hasPreviousElement: [{ret:'boolean'}],
      isKeptUpdated: [{ret:'boolean'}],
      keepUpdated: ['boolean'],
      nextRecord: [{ret:'i8[]'}],
      nextRecordId: [{ret:'i32'}],
      numRecords: [{ret:'i32']}],
      previousRecord: [{ret:'i8[]'}],
      previousRecordId: [{ret:'i32'}],
      rebuild: [],
      reset: [],
    },
  });

});
