var _       = require('underscore');

var o = {};

o.curry = function(fx) {
  var arity = fx.length;

  return function() {
    var args1 = Array.prototype.slice.call(arguments, 0),
    len1  = args1.length;

    if (len1 < arity) {
      return function accumulator() {
        var args2 = Array.prototype.slice.call(arguments, 0),
        len2  = args2.length;

        if (len1 + len2 == arity) {
          return fx.apply(null, args1.concat(args2));
        }
        else {
          return accumulator.apply(null, [fx].concat(args1).concat(args2));
        }
      }
    }
    else {
      return fx.apply(null, args1);
    }
  };
}

o.prop = o.curry(function(p, o) {
  return o[p];
});

o.send = o.curry(function(msg, o) {
  return o[msg]();
});

o.eq = o.curry(function(a, b) {
  return a === b;
});

o.neq = function(a) {
  return _.compose(o.invert, o.eq(a));
};

o.invert = function(b) {
  return !b;
};

o.thk = function(v) {
  return function() {
    return v;
  };
};

o.id = function(v) {
  return v;
};

o.iif = o.curry(function(left, right, guard, val) {
  return guard(val) ? right(val) : left(val);
});

module.exports = o;
