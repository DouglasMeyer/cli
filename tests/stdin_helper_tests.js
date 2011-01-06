var TestIt = require('./lib/test_it/src/test_it').TestIt,
    MockIt = require('./lib/mock_it/src/mock_it').MockIt,
    cli = require('../cli');

var MockStream = function(t){
  var that = this;
  this.events = {};
  t.mock(process, 'openStdin', 1, function(){ return that; });
};
MockStream.prototype.setEncoding = function(encoding){ this.encoding = encoding; };
MockStream.prototype.on = function(event, callback){
  this.events[event] = this.events[event] || [];
  this.events[event].push(callback);
};
MockStream.prototype.mockRun = function(chunks){
  var callbacks = this.events['data'];
  while (chunks.length) {
    for (var i=0,callback;callback=callbacks[i];i++){
      callback(chunks.shift());
    }
  }
  for (var i=0,ending;ending=this.events['end'][i];i++){
    ending();
  }
};

TestIt('cli.forEachStdinLine', {
  'should return lines in order': function(t){
    var mockStream = new MockStream(t);

    var chunks = [
          'line one\nline ',
          'two\nline three\nline four\n'
        ],
        expected = [
          'line one',
          'line two',
          'line three',
          'line four',
          ''
        ];
    cli.forEachStdinLine(function(line, sep, eof){
      t.assertEqual(expected.shift(), line);
    });

    mockStream.mockRun(chunks);
  },

  'should work with no line separator': function(t){
    var mockStream = new MockStream(t);

    var chunks = [
          'multiple chu',
          'nks but all ',
          'the same lin',
          'e'
        ],
        expected = [
          'multiple chunks but all the same line'
        ];
    cli.forEachStdinLine(function(line, sep, eof){
      t.assertEqual(expected.shift(), line);
    });

    mockStream.mockRun(chunks);
  },

  'should work with incomplete chunks': function(t){
    var mockStream = new MockStream(t);

    var chunks = [
          'I\'m not entirely sure what ',
          'you mean by a incomplete chu'
        ],
        expected = [
          'I\'m not entirely sure what you mean by a incomplete chu'
        ];
    cli.forEachStdinLine(function(line, sep, eof){
      t.assertEqual(expected.shift(), line);
    });

    mockStream.mockRun(chunks);
  }
}, MockIt, TestIt.NodeReporter);
