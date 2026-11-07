package com.inksquadron.game;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.annotation.NonNull;

import com.google.android.gms.nearby.Nearby;
import com.google.android.gms.nearby.connection.AdvertisingOptions;
import com.google.android.gms.nearby.connection.ConnectionInfo;
import com.google.android.gms.nearby.connection.ConnectionLifecycleCallback;
import com.google.android.gms.nearby.connection.ConnectionResolution;
import com.google.android.gms.nearby.connection.ConnectionsClient;
import com.google.android.gms.nearby.connection.DiscoveredEndpointInfo;
import com.google.android.gms.nearby.connection.DiscoveryOptions;
import com.google.android.gms.nearby.connection.EndpointDiscoveryCallback;
import com.google.android.gms.nearby.connection.Payload;
import com.google.android.gms.nearby.connection.PayloadCallback;
import com.google.android.gms.nearby.connection.PayloadTransferUpdate;
import com.google.android.gms.nearby.connection.Strategy;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Local multiplayer over Bluetooth / Wi-Fi with Google Nearby Connections (no internet needed).
 * One phone hosts (advertises), the other joins (discovers). Messages are small JSON strings.
 */
class NearbyManager {
    private static final int PERM_REQ = 4711;
    private static final Strategy STRATEGY = Strategy.P2P_POINT_TO_POINT;
    private final MainActivity a;
    private final ConnectionsClient cc;
    private final String serviceId;
    private String myName = "Pilot";
    private String endpoint = null;
    private String peerName = "";
    private Runnable pending = null;

    NearbyManager(MainActivity a) {
        this.a = a;
        this.cc = Nearby.getConnectionsClient(a);
        this.serviceId = a.getPackageName() + ".battle";
    }

    // ---- permissions ----
    private String[] needed() {
        List<String> p = new ArrayList<>();
        p.add(Manifest.permission.ACCESS_FINE_LOCATION);
        if (Build.VERSION.SDK_INT >= 31) {
            p.add(Manifest.permission.BLUETOOTH_SCAN);
            p.add(Manifest.permission.BLUETOOTH_ADVERTISE);
            p.add(Manifest.permission.BLUETOOTH_CONNECT);
        }
        if (Build.VERSION.SDK_INT >= 33) p.add(Manifest.permission.NEARBY_WIFI_DEVICES);
        List<String> missing = new ArrayList<>();
        for (String s : p) if (a.checkSelfPermission(s) != PackageManager.PERMISSION_GRANTED) missing.add(s);
        return missing.toArray(new String[0]);
    }

    private void withPermissions(Runnable r) {
        String[] miss = needed();
        if (miss.length == 0) { r.run(); return; }
        pending = r;
        a.runOnUiThread(() -> a.requestPermissions(miss, PERM_REQ));
    }

    void onPermissionsResult(int code, int[] results) {
        if (code != PERM_REQ) return;
        boolean ok = results.length > 0;
        for (int r : results) if (r != PackageManager.PERMISSION_GRANTED) ok = false;
        Runnable r = pending; pending = null;
        if (ok && r != null) r.run(); else emit("error", "text", "permission");
    }

    // ---- events to JS ----
    private void emit(String type, String k, String v) {
        try {
            JSONObject o = new JSONObject(); o.put("type", type);
            if (k != null) o.put(k, v);
            a.netEvent(o);
        } catch (Exception ignored) { }
    }

    private final PayloadCallback payloadCb = new PayloadCallback() {
        @Override public void onPayloadReceived(@NonNull String id, @NonNull Payload p) {
            if (p.getType() == Payload.Type.BYTES && p.asBytes() != null)
                emit("msg", "data", new String(p.asBytes(), StandardCharsets.UTF_8));
        }
        @Override public void onPayloadTransferUpdate(@NonNull String id, @NonNull PayloadTransferUpdate u) { }
    };

    private final ConnectionLifecycleCallback lifecycle = new ConnectionLifecycleCallback() {
        @Override public void onConnectionInitiated(@NonNull String id, @NonNull ConnectionInfo info) {
            peerName = info.getEndpointName();
            cc.acceptConnection(id, payloadCb);
        }
        @Override public void onConnectionResult(@NonNull String id, @NonNull ConnectionResolution res) {
            if (res.getStatus().isSuccess()) {
                endpoint = id;
                cc.stopAdvertising(); cc.stopDiscovery();
                emit("connected", "name", peerName);
            } else emit("error", "text", "" + res.getStatus().getStatusCode());
        }
        @Override public void onDisconnected(@NonNull String id) {
            endpoint = null; emit("disconnected", null, null);
        }
    };

    private final EndpointDiscoveryCallback discovery = new EndpointDiscoveryCallback() {
        @Override public void onEndpointFound(@NonNull String id, @NonNull DiscoveredEndpointInfo info) {
            cc.stopDiscovery();
            peerName = info.getEndpointName();
            cc.requestConnection(myName, id, lifecycle)
                    .addOnFailureListener(e -> emit("error", "text", e.getMessage()));
        }
        @Override public void onEndpointLost(@NonNull String id) { }
    };

    // ---- API used by the game ----
    void host(String name) {
        myName = name;
        withPermissions(() -> {
            stopQuiet();
            cc.startAdvertising(myName, serviceId, lifecycle, new AdvertisingOptions.Builder().setStrategy(STRATEGY).build())
                    .addOnSuccessListener(v -> emit("status", "key", "net_hosting"))
                    .addOnFailureListener(e -> emit("error", "text", e.getMessage()));
        });
    }

    void join(String name) {
        myName = name;
        withPermissions(() -> {
            stopQuiet();
            cc.startDiscovery(serviceId, discovery, new DiscoveryOptions.Builder().setStrategy(STRATEGY).build())
                    .addOnSuccessListener(v -> emit("status", "key", "net_searching"))
                    .addOnFailureListener(e -> emit("error", "text", e.getMessage()));
        });
    }

    void send(String data) {
        if (endpoint == null) return;
        cc.sendPayload(endpoint, Payload.fromBytes(data.getBytes(StandardCharsets.UTF_8)));
    }

    private void stopQuiet() {
        cc.stopAdvertising(); cc.stopDiscovery(); cc.stopAllEndpoints(); endpoint = null;
    }

    void stop() { stopQuiet(); }
}
