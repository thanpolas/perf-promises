var when   = require('when');

var Ptime = require('profy/time');
var Pmem = require('profy/mem');
var async = require('async');

var mem = new Pmem();
mem.start();

// how many loops
var loops = 500;

var masterLoop = 0;
var totalMasterLoops = 10;

var firstCallback = false;

function main() {
  // return when.resolve();
  var def = when.defer();
  var def2 = when.defer();
  var def3 = when.defer();
  var def4 = when.defer();
  var def5 = when.defer();
  var def6 = when.defer();
  var def7 = when.defer();

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
}

function mainVanilla(perf, cb) {
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
}

function finish(perf, cb) {
  perf.log('Finish');
  perf.stop();
  // console.log('total runs:', proms.length);
  // console.log('stats:', res.stats);
  // console.log('diffs:', res.diffs.join(' '));
  // console.log('diffs len:', res.diffs.length);

  // only print logs with the word 'FIRST'
  console.log(perf.resultTable('FIRST'));

  mem.log('Masterloop:' + masterLoop);
  if (masterLoop < totalMasterLoops) {
    setTimeout(cb, 1000);
  } else {
    // final
    mem.stop();
    //var memres = mem.result();
    console.log(mem.resultTable());
  }
}


console.log('starting...');

var promises = [];

var promise;
var firstPromiseResolved = false;

function asyncNewPromise(i, perf) {
  setTimeout(function(){
    perf.log('Creating promise:' + i);
    promise = main();
    promises.push(promise);
    promise.then(function() {
      if (!firstPromiseResolved) {
        firstPromiseResolved = true;
        perf.log('FIRST Promise resolved:' + i);
      } else {
        perf.log('Promise resolved:' + i);
      }
    });
    if (loops === i + 1){
      when.all(promises).then(finish.bind(this, perf, loopStart));
    }
  });
}

function loopStart() {
  // console.log('loopStart', masterLoop);
  firstPromiseResolved = false;
  promises = [];
  masterLoop++;
  var perf = new Ptime();
  perf.start();
  perf.log('Start');

  for (var i = 0; i < loops; i++) {
    asyncNewPromise(i, perf);
  }
  perf.log('after for');
}

function loopStartAsync() {
  var functions = [];
  firstCallback = false;
  masterLoop++;
  var perf = new Ptime();
  perf.start();
  perf.log('Start');

  for (var i = 0; i < loops; i++) {
    functions.push(mainVanilla.bind(null, perf));
  }

  async.series(functions, finish.bind(null, perf, loopStartAsync));

}

// loopStartAsync();
loopStart();
