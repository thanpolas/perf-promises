// I am sorry for the quality of the code, it was written on the knee
// to check why kickq was performing poorly and expanded from there on.

var runners = require('./lib/runners');

//
//
// test parameters
//
//

// resolve a promise in the queue asynchronously
var asyncResolve = runners.asyncResolve = true;

// how many tests to perform for each set of loops.
runners.totalMasterLoops = 20;


// Promises Perf


var fs = require('fs');
// var util = require('util');

var when   = require('when');
var Q = require('q');
// var rsvp = require('rsvp');




var allResults = [];

function run(Prom, loops, PromText) {
  var def = when.defer();
  runners.run(Prom, loops, function(results){
    // console.log('RUN DONE: loops, PromText, results :: ', loops, PromText, results);
    allResults.push({
      lib: PromText,
      loops: loops,
      results: results
    });

    def.resolve();
  }, asyncResolve);

  return def.promise;
}

/**
 * Remove trailing comma and add a newline
 * @param  {string} str the string.
 * @return {string}
 */
function nl(str) {
  str = str.substr(0, str.length - 1);
  str += '\n';
  return str;
}


/**
 * Generates the summary in a csv format.
 * @return {string} The csv in a string.
 */
function generateCSV() {
  var out = '';
  var header = 'loops,';
  var curItem = '';
  // go for all results to fetch libraries
  allResults.forEach(function(item) {

    if (curItem !== item.lib) {
      curItem = item.lib;
      header += item.lib + ',';
    }
  });
  header = nl(header);

  function getAvg(ar, prop) {
    var sum = ar.reduce(function(a,b) { return a[prop] || a + b[prop];});
    var avg = sum / runners.totalMasterLoops;
    return Math.round(avg * 100) / 100;
  }


  // the main container
  var summary = Object.create(null);

  // go for all results and summarize results
  allResults.forEach(function(item) {
    var avgTime = getAvg(item.results, 'diff');
    var avgTotal = getAvg(item.results, 'totalTime');
    var avgMem = getAvg(item.results, 'mem');

    // transform time from ns to ms
    avgTime = Math.round((avgTime / 1000) * 100) / 100;

    summary[item.loops] = summary[item.loops] || [];
    summary[item.loops].push({
      avgTime: avgTime,
      avgMem: avgMem,
      totalTime: avgTotal
    });
  });


  // return a full block of data for defined prop ('avgTime' or 'avgMem')
  function getFacet(prop) {
    var facet = '';
    for(var loop in summary) {
      facet += loop + ',';
      summary[loop].forEach(function(item) {
        facet += item[prop] + ',';
      });
      facet = nl(facet);
    }

    return facet;
  }

  // create the string output for time diffs
  out += '-- Avg Diffs in milliseconds\n\n';
  out += header;
  out += getFacet('avgTime');
  // create the string output for total time
  out += '\n';
  out += '-- Total Time in milliseconds\n\n';
  out += header;
  out += getFacet('totalTime');
  // create the string output for mem diffs
  out += '\n';
  out += '-- Avg Mem % from initial - !!! Only reliable when a single test is run\n\n';
  out += header;
  out += getFacet('avgMem');

  return out;
}

function saveFile(outputfile, contents) {
  fs.writeFileSync(outputfile, contents);
}

function control(runs, csvFile) {


  if (0 === runs.length) {
    // the end
    console.log('All Done!');
    var csvData;
    try{
      csvData = generateCSV();
    } catch(ex) {
      console.log('ex:', ex);
    }
    if (csvFile && csvFile.length) {
      console.log('Saving csv to file...');
      saveFile(csvFile, csvData);
      console.log('CSV file saved to: "' + csvFile + '"');
    }

    console.log('\nSummary:');
    console.log(csvData);
    return;
  }
  setTimeout(function(){
    var params = runs.shift();
    console.log('Starting perf test for: ' + params[2] + ' Loops: ' + params[1]);
    run(params[0], params[1], params[2]).then(control.bind(null, runs, csvFile),
      asyncResolve);
  }, 1000);

  // run the GC
  global.gc();
}

// Long Stack Traces
// http://documentup.com/kriskowal/q/#tutorial/long-stack-traces
Q.stackJumpLimit = 0;

var runs = [
  // [false, 10, 'async'],
  // [false, 100, 'async'],
  // [false, 500, 'async'],
  // [false, 1000, 'async'],

  // [require('./packages/when1.8.1/'), 10, 'when-1.8.1'],
  // [require('./packages/when1.8.1/'), 100, 'when-1.8.1'],
  [require('./packages/when1.8.1/'), 500, 'when-1.8.1']
  // [require('./packages/when1.8.1/'), 1000, 'when-1.8.1'],

  // [require('./packages/when2.0.1/'), 10, 'when-2.0.1'],
  // [require('./packages/when2.0.1/'), 100, 'when-2.0.1'],
  // [require('./packages/when2.0.1/'), 500, 'when-2.0.1'],
  // [require('./packages/when2.0.1/'), 1000, 'when-2.0.1'],

  // // The default when is from dev branch 2.1.x
  // [when, 10, 'when-2.1.x'],
  // [when, 100, 'when-2.1.x'],
  // [when, 500, 'when-2.1.x'],
  // [when, 1000, 'when-2.1.x'],

  // [Q, 10, 'Q'],
  // [Q, 100, 'Q'],
  // [Q, 500, 'Q'],
  // [Q, 1000, 'Q']

  // [rsvp, 10, 'rsvp']

  // memory single test runs of 500 loops
  // [false, 500, 'mem-async']
  // [require('./packages/when1.8.1/'), 500, 'mem-when-1.8.1']
  // [require('./packages/when2.0.1/'), 500, 'mem-when-2.0.1']
  // [when, 500, 'mem-when-2.1.x']
  // [Q, 500, 'mem-Q']
];

if (!global.gc) {
  throw new Error('run node using the --expose-gc option');
}

var outputcsv = process.argv[2];

control(runs, outputcsv);


