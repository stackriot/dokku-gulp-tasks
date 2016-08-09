# Dokku gulp tasks

A few opinionated gulp.js tasks for speeding-up deployment with Dokku.

These tasks assume the following about your environment:

* Your application uses MySQL
* You're running Dokku v0.4.14 or later, and using the [official MySQL plugin](https://github.com/dokku/dokku-mysql)
* You have SSH keys set up for the `dokku` user
* You're running in a Vagrant machine, with the root of your application shared at `/vagrant`
* You have an existing `gulpfile.babel.js`

## Getting started

1. Install the package to your project with `npm install --save dokku-gulp-tasks`
2. Require the package in your `gulpfile.js`, and pass it an instance of gulp: 

  ```js
  // ES2015-style
  import deployTasks from 'dokku-gulp-tasks';
  deployTasks(gulp);
  
  // CommonJS-style
  require('dokku-gulp-tasks')(gulp);
  ```
  
3. Create a `env.json` ([see example](https://github.com/angusfretwell/dokku-gulp-tasks/blob/master/env.json.example)) in the root of your project to describe the local database credentials, and remote Dokku server(s)

## Usage

```sh
gulp dokku [--command <command>] [--env <env>]
```

### Deployment

The `dokku` task allows you to run arbitrary Dokku commands, specified in the `command` argument (for example, `gulp dokku apps` will list the apps deployed to the server). If  you have multiple Dokku servers specified in `env.json`, you can specify an environment by key with the `env` argument.

```sh
gulp dokku:init [--env <env>]
```

Readies the Dokku server for deployment of the app by performing the following tasks:

* Creates a new app
* Creates a MySQL container
* Links the app and MySQL containers

```sh
gulp dokku:remote [--env <env>]
```

Creates a git remote for the Dokku server. This task is run automatically by `dokku:init`, but is useful for adding a remote for an app that was initialized by another developer.

```sh
gulp dokku:deploy [--env <env>]
```

Deploys the application by pushing the current branch to the Dokku server.

### Databases

```sh
gulp db:dump-local [--env <env>]
```

Dumps the database from the local Vagrant machine to the `.tmp` directory.

```sh
gulp db:dump-remote [--env <env>] [--mariadb]
```

Dumps the database of the remote Dokku app to the `.tmp` directory. The `mariadb` flag provides legacy support for Kloadut's [Dokku MariaDB plugin](https://github.com/Kloadut/dokku-md-plugin).

```sh
gulp db:push [--env <env>] [--mariadb]
```

Pushes the database from the local Vagrant machine to a remote Dokku app.

```sh
gulp db:pull [--env <env>] [--mariadb]
```

Pulls the database of the remote Dokku app to the local Vagrant machine.

```sh
gulp db:backup [--env <env>] [--mariadb]
```

Creates timestamped dumps of the databases from both the local Vagrant machine, and the remote Dokku app to the `/databases` directory.
