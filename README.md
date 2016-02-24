# Dokku gulp tasks

A few opinionated gulp.js tasks for speeding-up deployment with Dokku.

These tasks assume the following about your environment:

* Your application uses MySQL
* You're running Dokku v0.4.14 or later, and using the [official MySQL plugin](https://github.com/dokku/dokku-mysql)
* You have SSH keys set up for the `dokku` user
* You're running in a Vagrant machine, with the root of your application shared at `/vagrant`
* You have an existing `gulpfile.babel.js`

## Getting started

1. Install the package to your project with `npm install --save-dev dokku-gulp-tasks`
2. Require the package in your `gulpfile.js`, and pass it an instance of gulp: `require('dokku-gulp-tasks')(gulp);`
3. Create a `env.json` ([see example](https://github.com/angusfretwell/dokku-gulp-tasks/blob/master/env.json.example)) in the root of your project to describe your local database credentials, and remote Dokku server(s)

## Usage

```sh
gulp dokku [--command <command>] [--env <env>]
```

### Deployment

The `dokku` task allows you to run arbitrary Dokku commands, specified in the `command` argument (for example, `gulp dokku apps` will list the apps deployed to the server). If you have multiple Dokku servers specified in `env.json`, you can specify an environment by key with the `env` argument.

```sh
gulp dokku:init [--env <env>]
```

This task readies your Dokku server for deployment of your app by performing the following tasks:

* Creates a new app
* Creates a MySQL container
* Links the app and MySQL containers

```sh
gulp dokku:remote [--env <env>]
```

This task creates a git remote for your Dokku server. This task is run automatically by `dokku:init`, but is useful for adding a remote for an app that was initialized by another developer.


### Databases

```sh
gulp db:dump-local [--env <env>]
```

Dumps the database from your local Vagrant machine to the `.tmp` directory.

```sh
gulp db:dump-remote [--env <env>] [--mariadb]
```

Dumps the database of the remote Dokku app to the `.tmp` directory. The `mariadb` flag provides legacy support for Kloadut's [Dokku MariaDB plugin](https://github.com/Kloadut/dokku-md-plugin).

```sh
gulp db:push [--env <env>] [--mariadb]
```

Pushes the database from your local Vagrant machine to a remote Dokku app.

```sh
gulp db:pull [--env <env>] [--mariadb]
```

Pulls the database of the remote Dokku app to your local Vagrant machine.

```sh
gulp db:backup [--env <env>] [--mariadb]
```

Creates timestamped dumps of the databases from both your local Vagrant machine, and the remote Dokku app to the `/databases` directory.
