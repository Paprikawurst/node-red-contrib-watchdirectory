# node-red-contrib-watchdirectory

A watcher file/folder changed for [Node-RED](https://nodered.org/), based on [chokidar](https://github.com/paulmillr/chokidar)

## Why a third node for watching folders ?

Because the native node watcher is low level, and triggers an "add file" event before the file has completed the copy process on the disk. To avoid this we need to add delay and RBE nodes...

The other watcher (wfwatcher) recursively checks and attaches filenames to the payload... Most of nodes who work with files check msg.filename.

So this plugin attaches to the msg :
 - file : the name of the file, with extension
 - filedir : Directory of file
 - filename: the complete path to the file
 - payload: the complete path to the file

On configuration side we can : 

 - Select the folder to watch (of course ...)
 - Type event : create, update, delete
 - Check for recursive directories or not
 - ignore files that are in directory on node start (or not)
 - ignore files on regex basis (only String!), not type the / for regextype (I.E. ^test\.(txt|xls) not /^test\.(txt|xls)/)

### Prerequisites

Have Node-RED installed and working, if you need to
install Node-RED see [here](https://nodered.org/docs/getting-started/installation).

- [Node.js](https://nodejs.org) v10.0 or newer
- [Node-RED](https://nodered.org/) v1.0 or newer

### Installation
 
Install via Node-RED Manage Palette

```
node-red-contrib-watchdirectory
```

Install via npm

```shell
$ cd ~/.node-red
$ npm install node-red-contrib-watchdirectory
# then restart node-red
```

## Contribute

PRs are welcome

[release-link]: https://github.com/fatoldsun00/node-red-contrib-watchdirectory
