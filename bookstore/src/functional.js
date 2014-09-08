var _ = require('underscore');

var o = {};

// curry a function. arity determined based on number of params
o.curry = function(fx) {
  var arity = fx.length;

  return function() {
    var args1 = _.toArray(arguments);
    len1  = args1.length;

    if (len1 < arity) {
      return function accumulator() {
        var args2 = _.toArray(arguments);
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

// get a property's value by name
o.prop = o.curry(function(p, o) {
  return o[p];
});

// invoke a method by name
o.send = o.curry(function(msg, o) {
  return o[msg]();
});

// does a === b?
o.eq = o.curry(function(a, b) {
  return a === b;
});

// !eq
o.neq = function(a) {
  return _.compose(o.invert, o.eq(a));
};

// invert a boolean
o.invert = function(b) {
  return !b;
};

// return a thunk that evaluates to v
o.cnst = function(v) {
  return function() {
    return v;
  };
};

// identity function
o.id = function(v) {
  return v;
};

// behaves like a ternary
o.iif = o.curry(function(fail, success, guard) {
  return function() {
    var args = _.toArray(arguments);
    return guard.apply(null, args) ? success.apply(null, args) : fail.apply(null, args);
  };
});

// export a new object combining these functions + underscore
module.exports = _.extend({}, o, _);
