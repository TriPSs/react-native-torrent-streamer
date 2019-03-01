package com.ghondar.torrentstreamer;

import android.support.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.github.se_bastiaan.torrentstream.StreamStatus;
import com.github.se_bastiaan.torrentstream.Torrent;
import com.github.se_bastiaan.torrentstream.listeners.TorrentListener;

public class TorrentStreamerListener implements TorrentListener {

    private ReactApplicationContext context;
    private String id;

    public TorrentStreamerListener(ReactApplicationContext reactContext, String id) {
        this.context = reactContext;
        this.id = id;
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        params.putString("id", this.id);

        this.context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    @Override
    public void onStreamPrepared(Torrent torrent) {
        WritableMap params = Arguments.createMap();
        params.putString("status", "OnStreamPrepared");

        sendEvent("status", params);
    }

    @Override
    public void onStreamStarted(Torrent torrent) {
        WritableMap params = Arguments.createMap();
        params.putString("status", "onStreamStarted");

        sendEvent("status", params);
    }

    @Override
    public void onStreamError(Torrent torrent, Exception e) {
        WritableMap params = Arguments.createMap();
        params.putString("message", e.getMessage());

        sendEvent("error", params);
    }

    @Override
    public void onStreamReady(Torrent torrent) {
        WritableMap params = Arguments.createMap();
        params.putString("url", torrent.getVideoFile().toString());

        sendEvent("ready", params);
    }

    @Override
    public void onStreamProgress(Torrent torrent, StreamStatus status) {
        WritableMap params = Arguments.createMap();
        params.putString("buffer", "" + status.bufferProgress);
        params.putString("downloadSpeed", "" + status.downloadSpeed);
        params.putString("progress", "" + status.progress);
        params.putString("seeds", "" + status.seeds);

        sendEvent("progress", params);
    }

    @Override
    public void onStreamStopped() {
        WritableMap params = Arguments.createMap();
        params.putString("status", "OnStreamStopped");

        sendEvent("stop", params);
    }

}
