package com.inksquadron.game;

import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;

/**
 * Google Play Games Services v2: sign-in, achievements, leaderboards.
 * Disabled until a real project id is put in res/values/ids.xml (game_services_project_id).
 * Each achievement / leaderboard id is looked up by name (ach_first_win, lb_arcade, …).
 */
class PgsManager {
    private final MainActivity a;
    private boolean configured = false;
    private volatile boolean signedIn = false;

    PgsManager(MainActivity a) { this.a = a; }

    void start() {
        String id = a.getString(R.string.game_services_project_id);
        configured = id != null && id.matches("[0-9]{6,}") && !id.matches("0+");
        if (!configured) return;
        try {
            PlayGamesSdk.initialize(a);
            PlayGames.getGamesSignInClient(a).isAuthenticated().addOnCompleteListener(t ->
                    signedIn = t.isSuccessful() && t.getResult().isAuthenticated());
        } catch (Exception e) { configured = false; }
    }

    boolean isConfigured() { return configured; }

    void signIn() {
        if (!configured) return;
        a.runOnUiThread(() -> PlayGames.getGamesSignInClient(a).signIn().addOnCompleteListener(t ->
                signedIn = t.isSuccessful() && t.getResult().isAuthenticated()));
    }

    private String idFor(String key) {
        int res = a.getResources().getIdentifier(key, "string", a.getPackageName());
        if (res == 0) return null;
        String v = a.getString(res);
        return v == null || v.trim().isEmpty() ? null : v.trim();
    }

    void achievement(String key, int inc) {
        if (!configured || !signedIn) return;
        String id = idFor(key); if (id == null) return;
        a.runOnUiThread(() -> {
            if (inc > 0) PlayGames.getAchievementsClient(a).increment(id, inc);
            else PlayGames.getAchievementsClient(a).unlock(id);
        });
    }

    void score(String key, int value) {
        if (!configured || !signedIn) return;
        String id = idFor(key); if (id == null) return;
        a.runOnUiThread(() -> PlayGames.getLeaderboardsClient(a).submitScore(id, value));
    }

    void showAchievements() {
        if (!configured) return;
        if (!signedIn) { signIn(); return; }
        a.runOnUiThread(() -> PlayGames.getAchievementsClient(a).getAchievementsIntent()
                .addOnSuccessListener(intent -> a.startActivityForResult(intent, 9001)));
    }

    void showLeaderboards() {
        if (!configured) return;
        if (!signedIn) { signIn(); return; }
        a.runOnUiThread(() -> PlayGames.getLeaderboardsClient(a).getAllLeaderboardsIntent()
                .addOnSuccessListener(intent -> a.startActivityForResult(intent, 9002)));
    }
}
