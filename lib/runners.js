var runners = module.exports = {};

var when = require('when');

var Ptime = require('profy/time');
var Pmem = require('profy/mem');
var async = require('async');

var app = require('./app');

var mem;
var loops;
var Prom;
var perfIndex;
var memIndex;
var masterLoop = 0;
var totalMasterLoops = 20;
var promises = [];
var results = [];
var diffs = [];
var promise;
var firstPromiseResolved = false;

var masterDefer;

runners.totalMasterLoops = totalMasterLoops;

runners.run = function(promiseImplementation, runLoops, cb) {
  Prom = promiseImplementation || when;
  loops = runLoops;
  masterLoop = 0;
  memIndex = perfIndex = NaN;
  mem = new Pmem();
  mem.start();
  results = [];
  diffs = [];

  masterDefer = Prom.defer();
  masterDefer.promise.then(cb, cb);


  if (false === promiseImplementation) {
    runners.loopStartAsync();
  } else {
    runners.loopStart();
  }
};

runners.loopStart = function() {

  // console.log('loopStart', masterLoop);
  firstPromiseResolved = false;
  promises = [];
  masterLoop++;

  var perf = new Ptime();
  perf.start();
  perf.log('Start');

  for (var i = 0; i < loops; i++) {
    runners.asyncNewPromise(i, perf);
  }
  perf.log('after for');

};

runners.loopStartAsync = function() {

  // FIXME FIXME
  //
  // Figure out how to get the 'perfIndex' from the app.vanilla logging.
  //
  // FIXME FIXME

  var functions = [];
  app.vanillaReset();
  masterLoop++;
  var perf = new Ptime();
  perf.start();
  perf.log('Start');

  for (var i = 0; i < loops; i++) {
    functions.push(app.vanilla.bind(null, perf));
  }

  async.parallel(functions, runners.finish.bind(null, perf, runners.loopStartAsync));

};

runners.finish = function(perf, cb) {
  perf.log('Finish');
  perf.stop();

  // only print logs with the word 'FIRST'
  console.log(perf.resultTable('FIRST'));

  memIndex = mem.log('Masterloop:' + masterLoop);
  diffs.push(perf.get(perfIndex));
  if (masterLoop < totalMasterLoops) {
    setTimeout(cb, 500);
  } else {
    try {
      // final
      mem.stop();
      // prep stats
      for (var i = 0, len = diffs.length; i < len; i++) {
        results.push({
          diff: diffs[i].diff,
          mem: mem.get(i).percent
        });
      }

      masterDefer.resolve(results);
      // var memres = mem.result();
      console.log(mem.resultTable());
    } catch(ex) {
      console.log('EX:', ex);
    }
  }
};

runners.asyncNewPromise = function(i, perf) {
  setTimeout(function(){
    perf.log('Creating promise:' + i);
    promise = app.promise(Prom);

    promises.push(promise);
    promise.then(function() {
      if (!firstPromiseResolved) {
        firstPromiseResolved = true;
        perfIndex = perf.log('FIRST Promise resolved:' + i);
      } else {
        perf.log('Promise resolved:' + i);
      }
    });
    if (loops === i + 1){
      Prom.all(promises)
        .then(runners.finish.bind(null, perf, runners.loopStart));
    }
  });
};


