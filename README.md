# node-red-contrib-watchdirectory

A robust file/folder watcher for [Node-RED](https://nodered.org/), based on [chokidar](https://github.com/paulmillr/chokidar)

## Why this node?

**Reliable file detection**: Unlike the native Node-RED watch node that triggers events before files are fully written to disk (requiring additional delay and RBE nodes), this node uses `awaitWriteFinish` to ensure files are completely written before triggering events.

**Standard message format**: Attaches file information in the standard format that most Node-RED file nodes expect (`msg.filename`), making it easy to chain with other file processing nodes.

**Advanced filtering**: Supports regex-based file filtering and configurable directory depth.

## Features

- **Three event types**: Monitor file creation, updates, or deletion
- **Recursive watching**: Configure depth of subdirectories to monitor (0 = current folder only)
- **Smart file filtering**: Use regex patterns to ignore specific files
- **Flexible folder input**: Support for flow/global variables, environment variables, and JSONata expressions
- **Initial file handling**: Option to ignore existing files when node starts
- **Reliable detection**: Built-in `awaitWriteFinish` ensures files are completely written before triggering
- **Status indicators**: Visual feedback showing current node state and last detected file

## Output Message Properties

Each detected file event sends a message with the following properties:

- **`msg.file`** (string): The filename with extension (e.g., `document.pdf`)
- **`msg.filedir`** (string): The directory path (e.g., `C:\Users\data\subfolder`)
- **`msg.filename`** (string): The complete file path (e.g., `C:\Users\data\subfolder\document.pdf`)
- **`msg.payload`** (string): The complete file path (same as `msg.filename`)
- **`msg.size`** (number): File size in bytes (0 for delete events)

### Example Output

```javascript
{
  "file": "report.xlsx",
  "filedir": "C:\\Users\\data\\reports",
  "filename": "C:\\Users\\data\\reports\\report.xlsx",
  "payload": "C:\\Users\\data\\reports\\report.xlsx",
  "size": 45632
}
```

## Configuration Options

### Folder (required)

The directory to watch. Supports multiple input types:

- **String**: Direct path (e.g., `C:\data\incoming` or `/var/data/incoming`)
- **Flow variable**: `flow.watchPath`
- **Global variable**: `global.dataDir`
- **Environment variable**: `${DATA_DIR}`
- **JSONata expression**: For dynamic path construction

### Type Events (required)

Select which file event to monitor:

- **Create**: Triggers when a new file is added to the watched directory
- **Update**: Triggers when an existing file is modified
- **Delete**: Triggers when a file is removed

**Note**: You can only watch one event type per node. Use multiple nodes to monitor different events.

### Depth (number)

Controls how deep into subdirectories the watcher should look:

- **0**: Watch only the specified folder (no subdirectories)
- **1**: Watch the folder and first-level subdirectories
- **2+**: Watch the folder and subdirectories up to the specified depth
- Leave empty or use high number for unlimited depth

### Ignore Files (regex, optional)

Regular expression pattern to exclude specific files. The pattern is tested against the **filename only** (not the full path).

**Important**: Do NOT include the regex delimiters (`/`). Just provide the pattern.

#### Regex Examples

| Pattern | Matches | Description |
|---------|---------|-------------|
| `^\.` | `.hidden`, `.gitignore` | Files starting with a dot |
| `\.tmp$` | `file.tmp`, `data.tmp` | Files ending with .tmp |
| `^temp.*` | `temp.txt`, `tempfile.log` | Files starting with "temp" |
| `\.(log\|bak)$` | `app.log`, `data.bak` | Files with .log or .bak extension |
| `^(test\|draft)` | `test.doc`, `draft_report.pdf` | Files starting with "test" or "draft" |
| `~$` | `~$document.docx` | Excel/Word temporary files |
| `^\~\$\|^\.` | `~$file.xlsx`, `.hidden` | Temp files OR hidden files |

### On Start Ignore Files in Folder (checkbox)

- **Checked** (recommended): Existing files in the directory are ignored when the node starts. Only new/changed files after deployment trigger events.
- **Unchecked**: All existing files trigger events when the node starts (useful for processing backlogs)

## Status Indicators

The node displays its current state with colored status indicators:

- **Yellow ring** "Listening...": Node is active and watching for file events (appears 10 seconds after startup)
- **Green dot** "add [filename]": File creation detected
- **Green dot** "update [filename]": File modification detected
- **Green dot** "delete [filename]": File deletion detected
- **Red dot** "Error: [message]": An error occurred (check debug panel for details)

## Use Cases

### Process Incoming Files

Watch a folder for new CSV files and process them:

```
[watch-directory] --> [csv] --> [database]
```

### Backup System

Monitor for file changes and trigger backups:

```
[watch-directory: update] --> [delay 5s] --> [exec: robocopy]
```

### Log File Monitoring

Watch for new log entries and send alerts:

```
[watch-directory: update] --> [file in] --> [grep errors] --> [email]
```

### Photo Upload Detection

Automatically process photos added to a camera upload folder:

```
[watch-directory] --> [image resize] --> [ftp upload]
```

### Data Pipeline Trigger

Start data processing when new files arrive:

```
[watch-directory] --> [function: check file type] --> [process data]
```

## Best Practices

### 1. Always Set Ignore Patterns for Temporary Files

Many applications create temporary files (like Microsoft Office's `~$` files). Filter them out:

```
^\~\$|\.tmp$|\.swp$
```

### 2. Use Depth Limitation

If you only need to watch a specific folder without subdirectories, set depth to `0`. This improves performance.

### 3. Enable "Ignore Initial Files" for Production

When deploying, enable this option to avoid processing existing files unless you specifically want to process a backlog.

### 4. One Event Type Per Node

If you need to react to both file creation and updates differently, use two separate watch-directory nodes.

### 5. Combine with RBE Node for Updates

Even with `awaitWriteFinish`, some applications may save files multiple times rapidly. Use an RBE (Report by Exception) node after this node to filter duplicate events.

### 6. Use Specific Paths

Watching broad directories (like `C:\` or `/`) can cause performance issues. Always watch the most specific directory needed.

## Troubleshooting

### Node shows errors on Windows network drives

**Problem**: Network drives or UNC paths may not work with `useFsEvents`.

**Solution**: This node uses polling (`usePolling: true`) which should work with network drives, but there may be a slight delay in detection.

### Files are detected before they're fully copied

**Problem**: Very large files still trigger events before copying completes.

**Solution**: This should not happen with this node as `awaitWriteFinish` is enabled. If it does, add a delay node after this node.

### Too many events triggered

**Problem**: Node triggers multiple times for the same file.

**Solution**: 
- Check if your application saves files multiple times
- Add an RBE node to filter duplicates
- Verify your ignore pattern is working correctly

### Regex pattern not working

**Problem**: Files you want to ignore still trigger events.

**Solution**:
- Do NOT include the regex delimiters `/`
- Test your pattern against the **filename only**, not the full path
- Use a tool like [regex101.com](https://regex101.com) to test patterns
- Remember to escape special characters: `\.` for literal dot

### Node status stuck on "Listening..."

**Problem**: Node seems to work but status doesn't update.

**Solution**: This is normal. The status updates to show the last file event, but returns to "Listening..." after 10 seconds.

### Events not firing

**Problem**: Files are added but no events are triggered.

**Checklist**:
- Verify the folder path is correct and accessible
- Check if "On start ignore files" is enabled and node was just deployed
- Ensure your ignore pattern isn't too broad
- Check Node-RED debug panel for error messages
- Verify the correct event type is selected (create/update/delete)

## Prerequisites

Have Node-RED installed and working, if you need to install Node-RED see [here](https://nodered.org/docs/getting-started/installation).

- [Node.js](https://nodejs.org) v10.0 or newer
- [Node-RED](https://nodered.org/) v1.0 or newer

## Installation
 
### Via Node-RED Manage Palette

1. Open Node-RED in your browser
2. Click the menu (top right) → Manage palette
3. Select the "Install" tab
4. Search for `node-red-contrib-watchdirectory`
5. Click Install

### Via npm

```shell
cd ~/.node-red
npm install node-red-contrib-watchdirectory
```

Then restart Node-RED.

## Technical Details

This node is a wrapper for [chokidar](https://github.com/paulmillr/chokidar) with the following configuration:

- `awaitWriteFinish: true` - Waits until files are completely written before triggering
- `usePolling: true` - Compatible with network drives and Docker volumes
- `alwaysStat: true` - Provides file size information
- `useFsEvents: true` - Uses native OS file events when available
- `binaryInterval: 1000` - 1-second polling interval

## Changelog

### 1.0.15
- Current stable version

## License

ISC

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

### Report Issues

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/fatoldsun00/node-red-contrib-watchdirectory/issues).

## Links

- [GitHub Repository](https://github.com/fatoldsun00/node-red-contrib-watchdirectory)
- [Node-RED](https://nodered.org/)
- [Chokidar Documentation](https://github.com/paulmillr/chokidar)

## Author

FatOldSun

---

Made with ❤️ for the Node-RED community
