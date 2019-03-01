var { DeviceEventEmitter, NativeModules } = require('react-native');
var { TorrentStreamerAndroid } = NativeModules;

var TORRENT_STREAMER_DOWNLOAD_EVENTS = {
  error: 'error',
  progress: 'progress',
  status: 'status',
  ready: 'ready',
  stop: 'stop'
};

var _TorrentStreamerDownloadHandlers = {};

var TorrentStreamer = {
  addEventListener: function(type, handler) {
    _TorrentStreamerDownloadHandlers[handler] = DeviceEventEmitter.addListener(
      TORRENT_STREAMER_DOWNLOAD_EVENTS[type],
      (torrentStreamerData) => {
        handler(torrentStreamerData);
      }
    );
  },
  removeEventListener: function(type, handler) {
    if (!_TorrentStreamerDownloadHandlers[handler]) {
      return;
    }
    _TorrentStreamerDownloadHandlers[handler].remove();
    _TorrentStreamerDownloadHandlers[handler] = null;
  },
  setup: function(location, removeAfterStop){
    removeAfterStop = removeAfterStop || true
    
    TorrentStreamerAndroid.setup(location, removeAfterStop);
  },
  start: function(url){
    TorrentStreamerAndroid.start(url);
  },
  stop: TorrentStreamerAndroid.stop,
  open: function(path, type) {
    TorrentStreamerAndroid.open(path, type);
  },
  startSingle: function(id, magnet) {
    TorrentStreamerAndroid.startSingle(id, magnet)
  }
}

module.exports = TorrentStreamer;


// TODO:: Refactor naar een goeie class waar je de volgende dingen kunt:
// - Een download aanzetten met prio
// - Actieve download opvragen
// - Listners zetten en verwijderen
// - Een Queue opbouwen van downloads
