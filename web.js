var express = require('express'), routes = require('./routes'), childProcess = require('child_process'),
  compass = require('node-compass'), path = require('path');

var app = module.exports = express();

// Register ejs as .html. If we did
// not call this, we would need to
// name our views foo.ejs instead
// of foo.html. The __express method
// is simply a function that engines
// use to hook into the Express view
// system by default, so if we want
// to change "foo.ejs" to "foo.html"
// we simply pass _any_ function, in this
// case `ejs.__express`.
app.engine('.html', require('ejs').__express);
app.set('views', __dirname);
app.set('view engine', 'html');

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(path.join(__dirname, 'scripts')));
  app.use(express.static(__dirname));
  app.use(compass({
    project: path.join(__dirname, 'styles')
  }));
});

app.get('*', routes.index);

var port = process.env.PORT || 5000;
app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", port, app.settings.env);
});

var startTime = new Date();
startTime = startTime.toString();
console.log("\n------------------------------\nMODE : %s \nPORT : %d\nStartTime : %s \n------------------------------", app.settings.env, port, startTime);

app.configure('development', function(){
  childProcess.exec('compass compile --force -s nested --no-line-comments', function(error, stdout, stderr){
    console.log('\n\n**************************************\nCOMPASS GENERATION :\n\n--stdout :\n\n' + stdout);
    if (error !== null){
      console.log('exec error: ' + error);
    }
  });

  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.set('view options', {
    pretty: true
  });
});

app.configure('production', function(){
  childProcess.exec('compass compile --force -s compressed', function(error, stdout, stderr){
    console.log('\n\n**************************************\nCOMPASS GENERATION :\n\n--stdout :\n\n' + stdout);
    if (error !== null){
      console.log('exec error: ' + error);
    }
  });
  app.use(express.errorHandler());
});