import minimist from 'minimist';
import sh from 'shelljs';
import del from 'del';
import gutil from 'gulp-util';
import rename from 'gulp-rename';

const { exec, mkdir, pwd } = sh;
const { remotes, database } = require(`${pwd()}/env.json`);

const knownOptions = {
  default: {
    env: process.env.NODE_ENV || Object.keys(remotes)[0],
  },
};

const options = minimist(process.argv.slice(2), knownOptions);
const databaseType = options.mariadb ? 'mariadb' : 'mysql';

const env = {
  branch: `dokku-${options.env}`,
  sqlFile: `${options.env}.sql`,
};

if (!remotes[options.env]) {
  gutil.log('You must provide a valid remote name.').beep();
  process.exit(1);
}

const { hostname, slug } = remotes[options.env];
const ssh = `ssh -o StrictHostKeyChecking=no dokku@${hostname}`;

export default function (gulp) {
  gulp.task('dokku', () => {
    exec(`${ssh} ${options.command}`);
  });

  gulp.task('dokku:clean', del.bind(null, [
    '.tmp/*',
  ]));

  gulp.task('dokku:remote', () => {
    exec(`git remote add ${env.branch} dokku@${hostname}:${slug}`);
  });

  gulp.task('dokku:deploy', () => {
    exec(`git push ${env.branch} HEAD:master`);
  });

  gulp.task('dokku:init', ['dokku:remote'], () => {
    exec(`${ssh} apps:create ${slug}`);
    exec(`${ssh} ${databaseType}:create ${slug}`);
    exec(`${ssh} ${databaseType}:link ${slug} ${slug}`);
  });

  gulp.task('db:dump-local', ['dokku:clean'], () => {
    const databaseConnection = `-u${database.username} -p${database.password} ${database.name}`;
    mkdir('-p', '.tmp');
    exec(`vagrant ssh --command "mysqldump ${databaseConnection} > /vagrant/.tmp/local.sql"`);
  });

  gulp.task('db:dump-remote', ['dokku:clean'], () => {
    const commandName = options.mariadb ? 'dumpraw' : 'export';
    mkdir('-p', '.tmp');
    exec(`${ssh} ${databaseType}:${commandName} ${slug} | tee .tmp/${env.sqlFile} > /dev/null`);
  });


  gulp.task('db:push', ['db:dump-local'], () => {
    const commandName = options.mariadb ? 'console' : 'import';
    exec(`${ssh} ${databaseType}:${commandName} ${slug} < .tmp/local.sql`);
  });

  gulp.task('db:pull', ['db:dump-remote'], () => {
    const databaseConnection = `-u${database.username} -p${database.password} ${database.name}`;
    exec(`vagrant ssh --command "mysql ${databaseConnection} < /vagrant/.tmp/${env.sqlFile}"`);
  });

  gulp.task('db:backup', [
    'db:dump-local',
    'db:dump-remote',
  ], () =>
    gulp.src([
      '.tmp/local.sql',
      `.tmp/${env.sqlFile}`,
    ])
    .pipe(rename({ suffix: `/${new Date().toISOString()}` }))
    .pipe(gulp.dest('databases'))
  );
}
