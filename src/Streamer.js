import { DeviceEventEmitter, NativeModules } from 'react-native'

const { TorrentStreamerAndroid } = NativeModules

export const EVENTS = {
  error   : 'error',
  progress: 'progress',
  status  : 'status',
  ready   : 'ready',
  stop    : 'stop',
}

export const STREAM_STATUS = {
  queued     : 'queued',
  resume     : 'resume',
  downloading: 'downloading',
  downloaded : 'downloaded',
  paused     : 'paused',
}

export default class Streamer {

  streams = []

  streamsActive = 0

  maxConcurrent

  listeners = []

  constructor(maxConcurrent = 1, onStreamAdd = null) {
    this.maxConcurrent = maxConcurrent

    this.onStreamAdd = onStreamAdd
  }

  addListener = (type, handler) => {
    this.listeners[handler] = DeviceEventEmitter.addListener(
      EVENTS[type],
      (torrentStreamerData) => handler(torrentStreamerData),
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

    const stream = {
      id,
      magnet,
      location,
      removeAfterStop,
      status: STREAM_STATUS.queued,
    }

    this.streams.push(stream)

    if (this.onStreamAdd) {
      this.onStreamAdd(stream)
    }

    return id
  }

  handleStreams = (startId = null) => {
    console.log('handleStreams', startId, this.streams)
    if (this.streams.length > 0) {
      if (this.streamsActive >= this.maxConcurrent && startId === null) {
        return
      }

      let handleStream = this.streams[0]
      if (startId) {
        handleStream = this.streams.find(stream => stream.id === startId || stream.id === `${startId}`)

        console.log('handleStream', handleStream)

        if (this.streamsActive === this.maxConcurrent) {
          const pauseStream = this.streams.find(stream => stream.status === STREAM_STATUS.downloading)
          console.log('pauseStream', pauseStream)

          if (pauseStream) {
            this.pauseStream(pauseStream.id)
          }
        }
      }

      if (handleStream.status === STREAM_STATUS.resume) {
        TorrentStreamerAndroid.resumeSingle(handleStream.id)

      } else {
        console.log('TorrentStreamerAndroid.setupSingle', handleStream)
        TorrentStreamerAndroid.setupSingle(
          handleStream.id,
          handleStream.location,
          handleStream.removeAfterStop,
        )

        console.log('TorrentStreamerAndroid.startSingle', handleStream)
        TorrentStreamerAndroid.startSingle(handleStream.id, handleStream.magnet)
      }

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

  getAllStreams = () => this.streams

  pauseAll = () => {
    this.streams.forEach(stream => this.pauseStream(stream.id))
  }

  pauseStream = (id) => {
    console.log('Streamer.pauseStream', id)
    TorrentStreamerAndroid.stopSingle(id)

    this.updateStream(id, {
      status: STREAM_STATUS.paused,
    })

    this.streamsActive = this.streamsActive - 1
  }

  resumeString = (id) => {
    TorrentStreamerAndroid.resumeSingle(stream.id)

    this.updateStream(id, {
      status: STREAM_STATUS.resume,
    })
  }

  stopAll = () => {
    this.streams.forEach(stream => this.stopStream(stream.id))
  }

  stopStream = (id) => {
    id = `${id}`

    TorrentStreamerAndroid.stopSingle(id)

    this.streams = this.streams.filter(stream => stream.id !== id)

    this.streamsActive = this.streamsActive - 1

    // Handle the other streams
    this.handleStreams()
  }
}
