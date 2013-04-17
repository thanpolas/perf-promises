var app = module.exports = {};

app.promise = function(Prom) {
  // return when.resolve();
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
  def5.resolve();
  def6.resolve();
  def7.resolve();

  return def.promise;
};


app.vanilla = function(perf, cb) {
  function do7( cb7 ) {
    if (!firstCallback) {
      firstCallback = true;
      perf.log('FIRST callback resolved:');
    } else {
      perf.log('callback resolved:');
    }
    cb7();
  }
  function do6( cb6 ) {do7(cb6);}
  function do5( cb5 ) {do6(cb5);}
  function do4( cb4 ) {do5(cb4);}
  function do3( cb3 ) {do4(cb3);}
  function do2( cb2 ) {do3(cb2);}
  function do1( cb1 ) {do2(cb1);}

  do1(cb);
};
