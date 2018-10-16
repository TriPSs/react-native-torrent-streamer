import { DeviceEventEmitter, NativeModules } from 'react-native'

const { TorrentStreamerAndroid } = NativeModules

export const EVENTS = {
  error   : 'error',
  progress: 'progress',
  status  : 'status',
  ready   : 'ready',
  stop    : 'stop',
}

const STREAM_STATUS = {
  queued     : 'queued',
  downloading: 'downloading',
  paused     : 'paused',
}

export default class Streamer {

  streams = []

  streamsActive = 0

  maxConcurrent

  listeners = []

  constructor(maxConcurrent = 1) {
    this.maxConcurrent = maxConcurrent
  }

  addGlobalListener = (type, handler) => {
    this.listeners[handler] = DeviceEventEmitter.addListener(
      EVENTS[type],
      (torrentStreamerData) => handler(torrentStreamerData),
    )
  }

  removeGlobalListener = (handler) => {
    if (!this.listeners[handler]) {
      return
    }

    this.listeners[handler].remove()
    this.listeners[handler] = null
  }

  addListener = (id, type, handler) => {
    this.listeners[handler] = DeviceEventEmitter.addListener(
      `${id}:${EVENTS[type]}`,
      (torrentStreamerData) => handler(id, torrentStreamerData),
    )
  }

  removeListener = (handler) => {
    if (!this.listeners[handler]) {
      return
    }

    this.listeners[handler].remove()
    this.listeners[handler] = null
  }

  add = (magnet, id = null, location = null, removeAfterStop = true) => {
    if (id === null) {
      id = Date.now()
    }

    id = `${id}`

    this.streams.push({
      id,
      magnet,
      location,
      removeAfterStop,
      status: STREAM_STATUS.queued,
    })

    return id
  }

  handleStreams = (startId = null) => {
    if (this.streams.length > 0) {
      if (this.streamsActive === this.maxConcurrent && !startId) {
        return
      }

      let handleStream = this.streams[0]
      if (startId) {
        handleStream = this.streams.find(stream => stream.id === startId)

        if (this.streamsActive === this.maxConcurrent) {
          const pauseStream = this.streams.find(stream => stream.status === STREAM_STATUS.downloading)

          if (pauseStream) {
            this.pauseStream(pauseStream.id)
          }
        }
      }

      TorrentStreamerAndroid.setupSingle(
        handleStream.id,
        handleStream.location,
        handleStream.removeAfterStop,
      )

      TorrentStreamerAndroid.startSingle(handleStream.id, handleStream.magnet)

      this.updateStream(handleStream.id, {
        status: STREAM_STATUS.downloading,
      })

      this.streamsActive = this.streamsActive + 1
    }
  }

  updateStream = (id, update) => {
    this.streams = this.streams.map((stream) => {
      if (stream.id === id) {
        return {
          ...stream,
          ...update,
        }
      }

      return stream
    })
  }

  pauseAll = () => {
    this.streams.forEach(stream => this.pauseStream(stream.id))
  }

  pauseStream = id => {
    TorrentStreamerAndroid.pauseSingle(stream.id)

    this.updateStream(id, {
      status: STREAM_STATUS.paused,
    })

    this.streamsActive = this.streamsActive - 1
  }

  stopAll = () => {
    this.streams.forEach(stream => this.stopStream(stream.id))
  }

  stopStream = id => {
    TorrentStreamerAndroid.stopSingle(id)

    this.streams = this.streams.filter(stream => stream.id !== id)

    this.streamsActive = this.streamsActive - 1
  }
}
