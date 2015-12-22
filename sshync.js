#!/usr/bin/env node

(function () {
  'use strict';

  var fs = require('fs'),
      rsync = require('rsync'),
      path = require('path'),
      chalk = require('chalk'),
      args = process.argv.slice(2);

  if (args.length !== 2)
    return console.log(
      'sshync <' + chalk.blue('source') + '> ' +
      '<user@ip[:port]:' + chalk.green('destination') + '>\n' +
      '\t' + chalk.blue('source') + ':\t\tlocal source file/folder' +
      '\t' + chalk.green('destination') + ':\tremote destination file/folder'
    );

  var source = path.resolve(args[0]),
      cmd = new rsync()
        .flags('avuz')
        .source(source)
        .destination(args[1]),
      handle;

  // abort rsync on process exit
  function quit() {
    if (handle)
      handle.kill();
    process.exit();
  }

  process
    .on('SIGINT', quit)
    .on('SIGTERM', quit)
    .on('exit', quit);

  function contains(str, substr) {
    return str.indexOf(substr) !== -1;
  }

  function print(line) {
    console.log(
      contains(line, 'sent') &&
      contains(line, 'received') &&
      contains(line, 'bytes/sec') ?
        chalk.blue(line) :
        chalk.green('✓ ') + line
    );
  }

  function sync() {
    handle = cmd.execute(
      (error, code, cmd) =>
        console.log(error ? chalk.red(error) : ''),
      (data) =>
        data
          .toString()
          .split('\n')
          .filter(
            line =>
              line &&
              contains(line, '/')
          )
          .forEach(print)
    );
  }

  sync();
  fs.watch(source, sync);
}());
