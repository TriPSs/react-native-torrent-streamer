package com.ghondar.torrentstreamer;

import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.github.se_bastiaan.torrentstream.StreamStatus;
import com.github.se_bastiaan.torrentstream.Torrent;
import com.github.se_bastiaan.torrentstream.TorrentOptions;
import com.github.se_bastiaan.torrentstream.TorrentStream;
import com.github.se_bastiaan.torrentstream.listeners.TorrentListener;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.HashMap;

public class TorrentStreamer extends ReactContextBaseJavaModule implements TorrentListener {

    private HashMap<String, TorrentStream> mStreams = new HashMap<>();
    private TorrentStream mTorrentStream = null;
    private ReactApplicationContext context;

    private String mLocation = null;
    private Boolean mRemoveAfterStop = null;

    public TorrentStreamer(ReactApplicationContext reactContext) {
        super(reactContext);
        this.context = reactContext;
    }

    @Override
    public String getName() {
        return "TorrentStreamerAndroid";
    }

    @ReactMethod
    public void setupSingle(String id, String mLocation, Boolean mRemoveAfterStop) {
        String location = "" + Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        Boolean removeAfterStop = true;

        if (mLocation != null) {
            location = mLocation;
        }

        if (mRemoveAfterStop != null) {
            removeAfterStop = mRemoveAfterStop;
        }

        TorrentOptions torrentOptions = new TorrentOptions.Builder()
                .saveLocation(location)
                .maxConnections(200)
                .autoDownload(true)
                .removeFilesAfterStop(removeAfterStop)
                .build();

        TorrentStream torrentStream = TorrentStream.init(torrentOptions);
        torrentStream.addListener(new TorrentStreamerListener(this.context, id));

        mStreams.put(id, torrentStream);
    }

    @ReactMethod
    public void startSingle(String id, String magnet) {
        TorrentStream torrentStream = mStreams.get(id);

        if (torrentStream != null) {
            torrentStream.startStream(magnet);
        }
    }

    @ReactMethod
    public void stopSingle(String id) {
        TorrentStream torrentStream = mStreams.get(id);

        if (torrentStream != null && torrentStream.isStreaming()) {
            torrentStream.stopStream();
        }
    }

    @ReactMethod
    public void pauseSingle(String id) {
        TorrentStream torrentStream = mStreams.get(id);

        if (torrentStream != null && torrentStream.isStreaming()) {
            torrentStream.pauseSession();
        }
    }

    @ReactMethod
    public void resumeSingle(String id) {
        TorrentStream torrentStream = mStreams.get(id);

        if (torrentStream != null && !torrentStream.isStreaming()) {
            torrentStream.resumeSession();
        }
    }

    @ReactMethod
    public void stop() {
        if (mTorrentStream != null && mTorrentStream.isStreaming()) {
            mTorrentStream.stopStream();
        }
    }

    @ReactMethod
    public void setup(String location, Boolean removeAfterStop) {
        mLocation = location;
        mRemoveAfterStop = removeAfterStop;

        TorrentOptions torrentOptions = new TorrentOptions.Builder()
                .saveLocation(location)
                .maxConnections(200)
                .autoDownload(true)
                .removeFilesAfterStop(removeAfterStop)
                .build();

        mTorrentStream = TorrentStream.init(torrentOptions);
        mTorrentStream.addListener(this);
    }

    @ReactMethod
    public void setup(String location) {
        this.setup(location, true);
    }

    private void setup() {
        if (mTorrentStream == null) {
            this.setup("" + Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), true);
        }
    }

    @ReactMethod
    public void start(String magnetUrl) {
        this.setup();

        mTorrentStream.startStream(magnetUrl);
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        this.context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    @Override
    public void onStreamPrepared(Torrent torrent) {
//        Log.d("data", "OnStreamPrepared");

        WritableMap params = Arguments.createMap();
        params.putString("data", "OnStreamPrepared");

        sendEvent("progress", params);
//        torrent.startDownload();
    }

    @Override
    public void onStreamStarted(Torrent torrent) {
//        Log.d("data", "onStreamStarted");

        WritableMap params = Arguments.createMap();
        params.putString("data", "onStreamStarted");

        sendEvent("progress", params);
    }

    @Override
    public void onStreamError(Torrent torrent, Exception e) {
        WritableMap params = Arguments.createMap();
        params.putString("msg", e.getMessage());

        sendEvent("error", params);
    }

    @Override
    public void onStreamReady(Torrent torrent) {
//        Log.d("url", torrent.getVideoFile().toString());

        WritableMap params = Arguments.createMap();
        params.putString("url", torrent.getVideoFile().toString());

        sendEvent("ready", params);
    }

    @Override
    public void onStreamProgress(Torrent torrent, StreamStatus status) {
//        Log.d("buffer", "" + status.bufferProgress);
//        Log.d("download", "" + status.downloadSpeed);
//        Log.d("Progress", "" + status.progress);
//        Log.d("seeds", "" + status.seeds);

        WritableMap params = Arguments.createMap();
        params.putString("buffer", "" + status.bufferProgress);
        params.putString("downloadSpeed", "" + status.downloadSpeed);
        params.putString("progress", "" + status.progress);
        params.putString("seeds", "" + status.seeds);

        sendEvent("status", params);
    }

    @Override
    public void onStreamStopped() {
        WritableMap params = Arguments.createMap();
        params.putString("msg", "OnStreamStopped");

        sendEvent("stop", params);
    }

    @ReactMethod
    public void open(String url, String type) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(Uri.parse(url), type);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        //Check that an app exists to receive the intent
        if (intent.resolveActivity(this.context.getPackageManager()) != null) {
            this.context.startActivity(intent);
        }
    }
}
