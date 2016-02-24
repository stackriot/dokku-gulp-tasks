'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _gulp = require('gulp');

var _gulp2 = _interopRequireDefault(_gulp);

var _shelljs = require('shelljs');

var _shelljs2 = _interopRequireDefault(_shelljs);

var _del = require('del');

var _del2 = _interopRequireDefault(_del);

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _gulpRename = require('gulp-rename');

var _gulpRename2 = _interopRequireDefault(_gulpRename);

var exec = _shelljs2['default'].exec;
var mkdir = _shelljs2['default'].mkdir;

var _require = require('./env.json');

var remotes = _require.remotes;
var database = _require.database;

var knownOptions = {
  'default': {
    env: process.env.NODE_ENV || Object.keys(remotes)[0]
  }
};

var options = (0, _minimist2['default'])(process.argv.slice(2), knownOptions);
var databaseType = options.mariadb ? 'mariadb' : 'mysql';

var env = {
  branch: 'dokku-' + options.env,
  sqlFile: '' + options.env + '.sql'
};

if (!remotes[options.env]) {
  _gulpUtil2['default'].log('You must provide a valid remote name.').beep();
  process.exit(1);
}

var _remotes$options$env$hostname = remotes[options.env].hostname;
var hostname = _remotes$options$env$hostname.hostname;
var slug = _remotes$options$env$hostname.slug;

var ssh = 'ssh -o StrictHostKeyChecking=no dokku@' + hostname;

_gulp2['default'].task('dokku', function () {
  exec('' + ssh + ' ' + options.command);
});

_gulp2['default'].task('dokku:clean', _del2['default'].bind(null, ['.tmp/*']));

_gulp2['default'].task('dokku:remote', function () {
  exec('git remote add ' + env.branch + ' dokku@' + hostname + ':' + slug);
});

_gulp2['default'].task('dokku:init', ['dokku:remote'], function () {
  exec('' + ssh + ' apps:create ' + slug);
  exec('' + ssh + ' ' + databaseType + ':create ' + slug);
  exec('' + ssh + ' ' + databaseType + ':link ' + slug + ' ' + slug);
});

_gulp2['default'].task('db:dump-local', ['dokku:clean'], function () {
  var databaseConnection = '-u' + database.username + ' -p' + database.password + ' ' + database.name;
  mkdir('-p', '.tmp');
  exec('vagrant ssh --command "mysqldump ' + databaseConnection + ' > /vagrant/.tmp/local.sql"');
});

_gulp2['default'].task('db:dump-remote', ['dokku:clean'], function () {
  var commandName = options.mariadb ? 'dumpraw' : 'export';
  mkdir('-p', '.tmp');
  exec('' + ssh + ' ' + databaseType + ':' + commandName + ' ' + slug + ' | tee .tmp/' + env.sqlFile + ' > /dev/null');
});

_gulp2['default'].task('db:push', ['db:dump-local'], function () {
  var commandName = options.mariadb ? 'console' : 'import';
  exec('' + ssh + ' ' + databaseType + ':' + commandName + ' ' + slug + ' < .tmp/local.sql');
});

_gulp2['default'].task('db:pull', ['db:dump-remote'], function () {
  var databaseConnection = '-u' + database.username + ' -p' + database.password + ' ' + database.name;
  exec('vagrant ssh --command "mysql ' + databaseConnection + ' < /vagrant/.tmp/' + env.sqlFile + '"');
});

_gulp2['default'].task('db:backup', ['db:dump-local', 'db:dump-remote'], function () {
  return _gulp2['default'].src(['.tmp/local.sql', '.tmp/' + env.sqlFile]).pipe((0, _gulpRename2['default'])({ suffix: '/' + new Date().toISOString() })).pipe(_gulp2['default'].dest('databases'));
});
