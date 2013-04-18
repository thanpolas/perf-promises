var fs = require('fs');

var when   = require('when');
var Q = require('q');

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
  // [when, 10, 'when'],
  // [when, 100, 'when'],
  // [when, 500, 'when'],
  [when, 1000, 'when']
  // // [Q, 10, 'Q'],
  // // [Q, 100, 'Q'],
  // // [Q, 500, 'Q'],
  // // [Q, 1000, 'Q']
  // [false, 10, 'async'],
  // [false, 100, 'async'],
  // [false, 500, 'async'],
  // [false, 1000, 'async']

];

if (!global.gc) {
  throw new Error('run node using the --expose-gc option');
}

var outputcsv = process.argv[2];
control(runs, outputcsv);


