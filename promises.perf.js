var fs = require('fs');

var when   = require('when');
var Q = require('q');
var rsvp = require('rsvp');

var runners = require('./lib/runners');

var allResults = [];

function run(Prom, loops, PromText) {
  var def = when.defer();
  runners.run(Prom, loops, function(results){
    allResults.push({
      lib: PromText,
      loops: loops,
      results: results
    });

    def.resolve();
  });

  return def.promise;
}

function generateCSV(outputcsv) {
  // create header
  var out = 'lib,loops,';
  var memOut = '';
  var totalLogs = runners.totalMasterLoops + 1;

  for (var i = 1; i < totalLogs; i++) {
    out += 'diff' + i + ',';
    memOut += 'mem' + i + ',';
  }
  // remove trailing comma
  memOut = memOut.substr(0, memOut.length - 1);
  out += memOut + '\n';

  // go for all results
  allResults.forEach(function(item) {
    out += item.lib + ',';
    out += item.loops + ',';
    memOut = '';
    item.results.forEach(function(itemRes){
      out += itemRes.diff + ',';
      memOut += itemRes.mem +',';
    });

    // remove trailing comma
    memOut = memOut.substr(0, memOut.length - 1);
    out += memOut + '\n';
  });

  console.log('outputcsv:', outputcsv);

  var csvFile = 'perf.csv';

  if (outputcsv && outputcsv.length) {
    csvFile = outputcsv;
  }

  fs.writeFileSync(csvFile, out);
  console.log('CSV generated "' + csvFile + '"');
}

function control(runs, outputcsv) {
  if (0 === runs.length) {
    // the end
    console.log('All Done! generating csv...');
    generateCSV(outputcsv);
    return;
  }
  setTimeout(function(){
    var params = runs.shift();
    console.log('Starting perf test for: ' + params[2] + ' Loops: ' + params[1]);
    run(params[0], params[1], params[2]).then(control.bind(null, runs, outputcsv));
  }, 1000);

  // run the GC
  global.gc();
}


var runs = [
  // [require('./packages/when2.0.1/'), 10, 'when-2.0.1'],
  // [require('./packages/when2.0.1/'), 100, 'when-2.0.1'],
  // [require('./packages/when2.0.1/'), 500, 'when-2.0.1'],
  // [require('./packages/when2.0.1/'), 1000, 'when-2.0.1']

  [require('./packages/when1.8.1/'), 10, 'when-1.8.1']
  // [require('./packages/when1.8.1/'), 100, 'when-1.8.1'],
  // [require('./packages/when1.8.1/'), 500, 'when-1.8.1'],
  // [require('./packages/when1.8.1/'), 1000, 'when-1.8.1']

  // The default when is from dev branch 2.1.x
  // [when, 10, 'when-2.1.x'],
  // [when, 100, 'when-2.1.x'],
  // [when, 500, 'when-2.1.x'],
  // [when, 1000, 'when-2.1.x']

  // [Q, 10, 'Q'],
  // [Q, 100, 'Q'],
  // [Q, 500, 'Q'],
  // [Q, 1000, 'Q']

  // [rsvp, 10, 'rsvp']

  // [false, 10, 'async'],
  // [false, 100, 'async'],
  // [false, 500, 'async'],
  // [false, 1000, 'async']


  // memory single test runs of 1k loops
  // [require('./packages/when2.0.1/'), 1000, 'mem-when-2.0.1']
  // [require('./packages/when1.8.1/'), 1000, 'mem-when-1.8.1']
  // [when, 1000, 'mem-when-2.1.x']
  // [Q, 1000, 'mem-Q']
  // [false, 1000, 'mem-async']
];

if (!global.gc) {
  throw new Error('run node using the --expose-gc option');
}

var outputcsv = process.argv[2];
control(runs, outputcsv);


