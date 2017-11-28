define(function() {

  // array is assumed to be sorted according to the same compare operator.
  // if the returned value i is negative, then ~i is the position that
  // the value should be inserted at, to keep the array in sorted order.
  // if there can be multiple candidates for which compare(value, array[n])
  // returns zero, the returned index might be any of them.
  Array.prototype.sortedIndexOf = function binarySearch(value, compare) {
    var i_lo = 0, i_hi = this.length-1;
    while (i_lo <= i_hi) {
      const i_mid = Math.floor((i_lo + i_hi)/2);
      const diff = compare(this[i_mid], value);
      if (diff > 0) {
        i_hi = i_mid - 1;
      }
      else if (diff < 0) {
        i_lo = i_mid + 1;
      }
      else {
        return i_mid;
      }
    }
    return ~i_lo;
  };

  return {};

});
