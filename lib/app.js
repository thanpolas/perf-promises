var app = module.exports = {};

app.perfIndex = null;

app.promise = function(Prom, optAsyncResolve) {
  var def = Prom.defer();
  var def2 = Prom.defer();
  var def3 = Prom.defer();
  var def4 = Prom.defer();
  var def5 = Prom.defer();
  var def6 = Prom.defer();
  var def7 = Prom.defer();

  var getDef3 = function() { return def3.promise;};
  var getDef4 = function() { return def4.promise;};
  var getDef5 = function() { return def5.promise;};
  var getDef6 = function() { return def6.promise;};
  var getDef7 = function() { return def7.promise;};

  // chain them
  def2.promise
    .then(getDef3)
    .then(getDef4)
    .then(getDef5)
    .then(getDef6)
    .then(getDef7)
    .then(def.resolve);

  def2.resolve();
  def3.resolve();
  def4.resolve();

  if (optAsyncResolve) {
    setTimeout(def5.resolve);
  } else {
    def5.resolve();
  }
  def6.resolve();
  def7.resolve();

  return def.promise;
};

// This API is specific to when.js (although Q has something similar)
app.promiseWhen = function(Prom) {

  return Prom.promise(function(resolve) {
    var p2, p3, p4, p5, p6, p7, r2, r3, r4, r5, r6, r7;

    p2 = Prom.promise(function(resolve) { r2 = resolve; });
    p3 = Prom.promise(function(resolve) { r3 = resolve; });
    p4 = Prom.promise(function(resolve) { r4 = resolve; });
    p5 = Prom.promise(function(resolve) { r5 = resolve; });
    p6 = Prom.promise(function(resolve) { r6 = resolve; });
    p7 = Prom.promise(function(resolve) { r7 = resolve; });

    var getP3 = function() { return p3; };
    var getP4 = function() { return p4; };
    var getP5 = function() { return p5; };
    var getP6 = function() { return p6; };
    var getP7 = function() { return p7; };

    p2
        .then(getP3)
        .then(getP4)
        .then(getP5)
        .then(getP6)
        .then(getP7)
        .then(resolve);

    r2();
    r3();
    r4();
    r5();
    r6();
    r7();

  });
};



var firstCallback = false;

app.vanilla = function(perf, optAsyncResolve, cb) {
  function do7() {
    if (!firstCallback) {
      firstCallback = true;
      app.perfIndex = perf.log('FIRST callback resolved:');
    } else {
      perf.log('callback resolved:');
    }
    cb();
  }
  var fndo6 = function do6() {do7();};
  var fndo5 = function do5() {fndo6();};
  var fndo4 = function do4() {fndo5();};
  var fndo3 = function do3() {fndo4();};
  var fndo2 = function do2() {
    if (optAsyncResolve) {
      setTimeout(function(){
        fndo3();
      });
    } else {
      fndo3();
    }
  };
  function do1() {fndo2();}

  do1(cb);
};

app.vanillaReset = function() {
  firstCallback = false;
};
