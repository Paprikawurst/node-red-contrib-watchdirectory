module.exports = function(RED) {
    const chokidar = require('chokidar')
    const path = require('path');

  function  WatchDirectory(config) {
    RED.nodes.createNode(this,config);
    this.folderType = config.folderType || "str"
    this.folder = path.normalize(RED.util.evaluateNodeProperty(config.folder, this.folderType, this))
    this.recursive = config.recursive;
    this.typeEvent = config.typeEvent;
    this.ignoreInitial = config.ignoreInitial;
    this.ignoredFiles = config.ignoredFiles || false;
    this.startListening();  
  }

  WatchDirectory.prototype.startListening = function() {
    const node = this;
    const watcher = chokidar.watch(node.folder, {
      ignored: (filename) => {
        filename = path.normalize( filename )
        let file = path.basename(filename) 
        if (file && file.length && node.ignoredFiles.length){ 
          re = new RegExp(node.ignoredFiles)
          return re.test(file)
        }      
      },
      persistent: true,
      depth: node.recursive,
      ignoreInitial: node.ignoreInitial,
      awaitWriteFinish:true,
      usePolling:true,
      alwaysStat: true,
      useFsEvents : true,
      binaryInterval: 1000
    });

    let payload
    switch (node.typeEvent) {
      case 'create': 
        watcher.on('add', (filename, stats) => {
          payload = node.createMSG(filename, stats) 
          node.send(payload)
          node.status({fill:"green", shape: "dot", text: "add "+filename})
        })
        break;
      case 'update': 
        watcher.on('change', (filename, stats) => {
          payload = node.createMSG(filename, stats) 
          node.send(payload)
          node.status({fill:"green", shape: "dot", text: "update "+filename})
        })
        break;
      case 'delete': 
        watcher.on('unlink',(filename) => {
          payload = node.createMSG(filename) 
          node.send(payload)
          node.status({fill:"green", shape: "dot", text: "delete "+filename})
      })
      break;
    }

    watcher.on('ready', () => {
      setTimeout(() => {
        node.status({fill:"yellow", shape: "ring", text: "Listening..."})
      }, 10000)
    }).on('error', (err) => {
      node.status({fill:"red", shape: "dot", text: "Error : "+err.message})
      node.error(err)
    })
    
    node.on('close', () => {
      watcher.close()
    })
  }

  WatchDirectory.prototype.createMSG = function(filename, stats) {
      filename = path.normalize( filename )
      const file = path.basename(filename) 
      const filedir = path.dirname(filename) 
      return {file,filedir,filename, payload: filename, size: stats?stats.size:0}
  }

  RED.nodes.registerType("watch-directory",WatchDirectory);
}
