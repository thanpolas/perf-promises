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
  var totalLogs = runners.totalMasterLoops + 1;


  var header = 'loops,';
  var curItem = '';
  // go for all results to fetch libraries
  allResults.forEach(function(item) {
    if (curItem !== item) {
      curItem = item;
      header += item.lib + ',';
    }
  });
  header = nl(header);

  function getAvg(ar, prop) {
    var sum = ar.reduce(function(a,b) { return a[prop] || a + b[prop];});
    var avg = sum / totalLogs;
    return Math.round(avg * 100) / 100;
  }


  // the main container
  var summary = Object.create(null);

  // go for all results and summarize results
  allResults.forEach(function(item) {
    var avgTime = getAvg(item.results, 'diff');
    var avgMem = getAvg(item.results, 'mem');

    summary[item.loops] = summary[item.loops] || [];
    summary[item.loops].push({
      avgTime: avgTime,
      avgMem: avgMem,
      totalTime: item.results.totalTime
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
  out += '-- Avg Diffs in microseconds (1.000 == 1ms)\n\n';
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
    console.log('All Done! generating csv...');
    var csvData = generateCSV();
    if (csvFile && csvFile.length) {
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
    run(params[0], params[1], params[2]).then(control.bind(null, runs, csvFile));
  }, 1000);

  // run the GC
  global.gc();
}

// Long Stack Traces
// http://documentup.com/kriskowal/q/#tutorial/long-stack-traces
Q.stackJumpLimit = 0;

var runs = [
  [false, 10, 'async'],
  [false, 100, 'async'],
  [false, 500, 'async'],
  [false, 1000, 'async'],

  [require('./packages/when1.8.1/'), 10, 'when-1.8.1'],
  [require('./packages/when1.8.1/'), 100, 'when-1.8.1'],
  [require('./packages/when1.8.1/'), 500, 'when-1.8.1'],
  [require('./packages/when1.8.1/'), 1000, 'when-1.8.1'],

  [require('./packages/when2.0.1/'), 10, 'when-2.0.1'],
  [require('./packages/when2.0.1/'), 100, 'when-2.0.1'],
  [require('./packages/when2.0.1/'), 500, 'when-2.0.1'],
  [require('./packages/when2.0.1/'), 1000, 'when-2.0.1'],

  // The default when is from dev branch 2.1.x
  [when, 10, 'when-2.1.x'],
  [when, 100, 'when-2.1.x'],
  [when, 500, 'when-2.1.x'],
  [when, 1000, 'when-2.1.x'],

  [Q, 10, 'Q'],
  [Q, 100, 'Q'],
  [Q, 500, 'Q'],
  [Q, 1000, 'Q']

  // [rsvp, 10, 'rsvp']

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


