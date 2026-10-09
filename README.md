# node-red-contrib-watchdirectory

A file watcher node for [Node-RED](https://nodered.org/), based on [chokidar](https://github.com/paulmillr/chokidar),
initially created by [fatoldsun00](https://github.com/fatoldsun00) and now maintained by [Paprikawurst](https://github.com/Paprikawurst).

## Why does this node exist?

- **Files are complete when the event fires**: the node uses chokidar's `awaitWriteFinish`, so an event is only sent once the file size has been stable for about 2 seconds. No extra delay or RBE nodes are needed to avoid half-written files.
- **Standard message format**: the full path is set as `msg.filename`, which is what most Node-RED file nodes expect.
- **Filtering**: ignore files with a regular expression and limit the depth of subfolders to watch.

## Features

- Watch for **created**, **updated** or **deleted** files (one event type per node)
- Configurable folder depth
- Regex to ignore files by name
- Folder can be a string, flow/global variable, environment variable or JSONata expression
- Option to ignore files that already exist when the node starts
- Polling-based, so it also works on network drives and Docker volumes

Only **files** are reported. Directory events (added or removed folders) are not sent.

## Output

Each event sends one message:

| Property       | Type   | Description                                                        |
|----------------|--------|--------------------------------------------------------------------|
| `msg.file`     | string | File name with extension, e.g. `report.xlsx`                       |
| `msg.filedir`  | string | Directory of the file                                              |
| `msg.filename` | string | Complete path to the file                                          |
| `msg.payload`  | string | Same as `msg.filename`                                             |
| `msg.size`     | number | File size in bytes (always `0` for delete events)                  |

```json
{
  "file": "report.xlsx",
  "filedir": "C:\\Users\\data\\reports",
  "filename": "C:\\Users\\data\\reports\\report.xlsx",
  "payload": "C:\\Users\\data\\reports\\report.xlsx",
  "size": 45632
}
```

## Configuration

### Folder (required)

The directory to watch. The type selector next to the field supports:

- **string**: a path such as `C:\data\incoming` or `/var/data/incoming`
- **flow** / **global**: the name of a context variable, e.g. `watchPath`
- **env**: the name of an environment variable, e.g. `DATA_DIR` (without `${}`)
- **JSONata**: an expression that returns the path

The value is evaluated **once when the flow is deployed or started**. Changing a variable later does not change the watched folder until the node is redeployed.

### Type events (required)

- **Create**: a new file appeared
- **Update**: an existing file was modified
- **Delete**: a file was removed

Use several nodes if you need more than one event type.

### Ignore files (regex, optional)

A regular expression for files that should be ignored. It is tested against the **file name only** (not the full path). Enter the pattern **without** the `/` delimiters.

| Pattern             | Ignores                                          |
|---------------------|--------------------------------------------------|
| `^\.`               | hidden files such as `.gitignore`                |
| `\.tmp$`            | files ending in `.tmp`                           |
| `^~\$`              | Office lock files such as `~$a.docx`             |
| `~$`                | backup files ending in `~`, e.g. `a.txt~`        |
| `\.(log\|bak)$`     | files ending in `.log` or `.bak`                 |
| `^~\$\|^\.\|\.tmp$` | Office lock files, hidden files and `.tmp` files |

(In the table, `\|` is only Markdown escaping for the pipe character. Type a plain `|` in the node.)

The pattern is also applied to the name of the watched folder itself, so a pattern like `^\.` will ignore everything if the watched folder is called `.data`.

### Depth (number)

How many levels of subfolders are watched:

- `0` (default): only files directly in the folder
- `1`: the folder and its direct subfolders
- `2` and higher: further levels

There is no "unlimited" option. Use a high number if you need it. An empty field behaves like `0`.

### On start ignore files in folder (checkbox)

- **Checked** (default): files that already exist when the node starts are ignored. Only changes after the start produce events.
- **Unchecked**: existing files are reported as created when the node starts, which is useful for processing a backlog.

This only affects create events.

## Status

| Status                               | Meaning                                                      |
|--------------------------------------|--------------------------------------------------------------|
| yellow ring `Listening...`           | Initial scan finished; shown once, 10 seconds after the scan |
| green dot `add/update/delete <file>` | Last detected event; stays until the next event              |
| red dot `Error : <message>`          | The watcher reported an error (also logged via `node.error`) |

## Tips

- **Ignore temporary files.** Applications often create temporary files while saving, e.g. `^~\$|\.tmp$|\.swp$`.
- **Keep depth low.** The node polls every watched file, so watching many files or very broad folders (`C:\`, `/`) is expensive. Watch the most specific folder you can.
- **Update events can repeat.** If an application saves a file several times, you get one update event per save. An RBE node or a delay can reduce duplicates.

## Troubleshooting

**No events**
- Check that the folder exists and is readable by the Node-RED process.
- With "On start ignore files" checked, files that existed before deployment are not reported.
- Check the selected event type.
- Check that the ignore regex is not too broad and has no `/` delimiters.
- Look at the debug panel / Node-RED log for errors.

**Events are delayed**
This is expected: the node waits about 2 seconds for the file size to be stable, and polling adds a little more.

**Multiple events for one file**
The writing application most likely saves the file more than once. See the tips above.

## Example

An example flow is included in [`examples/watch-directory.json`](examples/watch-directory.json). In Node-RED, open Menu → Import → Examples → `node-red-contrib-watchdirectory`. It watches the folder `watch-input` for created, updated and deleted files and prints each event to the debug panel.

## Technical details

The node calls chokidar with these notable options:

- `awaitWriteFinish: true`: wait until the file size is stable (chokidar default: 2000 ms)
- `usePolling: true`: works on network drives and Docker volumes, at the cost of some CPU
- `binaryInterval: 1000`: polling interval in ms for binary files
- `alwaysStat: true`: file stats (used for `msg.size`) are always available
- `ignoreInitial` and `depth` come from the node configuration

## Requirements

- [Node.js](https://nodejs.org) 10 or newer
- [Node-RED](https://nodered.org/) 1.0 or newer

## Installation

### Via the palette manager

Menu → Manage palette → Install → search for `node-red-contrib-watchdirectory`.

### Via npm

```shell
cd ~/.node-red
npm install node-red-contrib-watchdirectory
```

Then restart Node-RED.

## Contributing

Pull requests are welcome. For larger changes please open an issue first. Bugs and feature requests go to the [issue tracker](https://github.com/Paprikawurst/node-red-contrib-watchdirectory/issues).

## License

ISC

## Links

- [GitHub repository](https://github.com/Paprikawurst/node-red-contrib-watchdirectory)
- [chokidar](https://github.com/paulmillr/chokidar)
