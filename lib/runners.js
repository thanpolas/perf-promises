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
var promises = [];
var results = [];
var diffs = [];
var totalTimes = [];
var promise;
var firstPromiseResolved = false;

var masterDefer;
var noop = function(){};

runners.totalMasterLoops = 20;
runners.asyncResolve = null;

runners.run = function(promiseImplementation, runLoops, cb) {
  Prom = promiseImplementation || when;
  loops = runLoops;
  masterLoop = 0;
  memIndex = perfIndex = NaN;
  mem = new Pmem();
  mem.start();
  results = [];
  diffs = [];
  totalTimes = [];

  masterDefer = Prom.defer();
  masterDefer.promise.then(cb, cb);

  if (false === promiseImplementation) {
    runners.loopStartAsync();
  } else {
    runners.loopStart();
  }
};

runners.loopStart = function() {

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

  var functions = [];
  app.vanillaReset();
  masterLoop++;
  var perf = new Ptime();
  app.perfIndex = null;
  perf.start();
  perf.log('Start');

  for (var i = 0; i < loops; i++) {
    functions.push(app.vanilla.bind(null, perf, runners.asyncResolve));
  }
  async.parallel(functions, runners.finish.bind(null, perf, runners.loopStartAsync, true));

};

runners.finish = function(perf, cb, optIsAsync, optErr, optResults) {
  perf.log('Finish');
  perf.stop();

  if (true === optIsAsync) {
    // finish invoked from async.parallel(), the perfIndex in in the results
    perfIndex = app.perfIndex;
  }

  // only print logs with the word 'FIRST'

  var firstOut = perf.resultTable('FIRST');
  var perfres = perf.result();
  var firstDiff = perfres.logs[perfIndex] - perfres.logs[1];
  console.log(firstOut + ' First Diff, total:', firstDiff, perfres.stats.total);
  // console.log(perf.resultTable());
  memIndex = mem.log('Masterloop:' + masterLoop);
  diffs.push(perf.get(perfIndex));
  totalTimes.push(perfres.stats.total);

  if (masterLoop < runners.totalMasterLoops) {
    setTimeout(cb, 500);
  } else {
    try {
      // final
      mem.stop();
      // prep stats
      for (var i = 0, len = diffs.length; i < len; i++) {
        results.push({
          diff: diffs[i].diff,
          totalTime: totalTimes[i],
          mem: mem.get(i).percent
        });
      }



      masterDefer.resolve(results);
      var memres = mem.result();
      console.log('\nStarting memory:', memres.stats.start);
      console.log(mem.resultTable());
    } catch(ex) {
      console.log('EX:', ex);
    }
  }
};

runners.asyncNewPromise = function(i, perf) {
  setTimeout(function(){
    perf.log('Creating promise:' + i);
    promise = app.promise(Prom, runners.asyncResolve);

    promises.push(promise);
    promise.then(function() {
      if (!firstPromiseResolved) {
        firstPromiseResolved = true;
        perfIndex = perf.log('FIRST Promise resolved');
      } else {
        perf.log('Promise resolved:' + i);
      }
    });
    if (loops === i + 1){
      Prom.all(promises)
        .then(runners.finish.bind(null, perf, runners.loopStart))
        .then(noop, console.log);
    }
  });
};


