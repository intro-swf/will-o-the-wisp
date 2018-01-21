define(['java'], function(java) {

  return java.define('javax.microedition.rms.RecordEnumeration', {
    base: 'interface',
    methods: {
      destroy: [],
      hasNextElement: [{blocking:true, ret:'boolean'}],
      hasPreviousElement: [{blocking:true, ret:'boolean'}],
      isKeptUpdated: [{ret:'boolean'}],
      keepUpdated: ['boolean'],
      nextRecord: [{blocking:true, ret:'i8[]'}],
      nextRecordId: [{blocking:true, ret:'i32'}],
      numRecords: [{blocking:true, ret:'i32']}],
      previousRecord: [{blocking:true, ret:'i8[]'}],
      previousRecordId: [{blocking:true, ret:'i32'}],
      rebuild: [{blocking:true}],
      reset: [{blocking:true}],
    },
  });

});
