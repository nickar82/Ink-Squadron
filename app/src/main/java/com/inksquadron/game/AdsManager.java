package com.inksquadron.game;

import android.os.SystemClock;

import androidx.annotation.NonNull;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.appopen.AppOpenAd;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * AdMob: Google consent form (GDPR) first, then
 *  - App Open ad once at launch ("before gameplay")
 *  - Interstitial when the game asks (every 5 cleared levels, quit-to-menu)
 * Ad unit ids live in res/values/ids.xml (Google TEST ids by default).
 */
class AdsManager {
    private final MainActivity a;
    private final AtomicBoolean started = new AtomicBoolean(false);
    private ConsentInformation consent;
    private InterstitialAd interstitial;
    private boolean appOpenShown = false;
    private final long launchTime = SystemClock.elapsedRealtime();

    AdsManager(MainActivity a) { this.a = a; }

    void start() {
        consent = UserMessagingPlatform.getConsentInformation(a);
        ConsentRequestParameters params = new ConsentRequestParameters.Builder().build();
        consent.requestConsentInfoUpdate(a, params,
                () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(a, formError -> {
                    if (consent.canRequestAds()) initAds();
                }),
                requestError -> { if (consent.canRequestAds()) initAds(); });
        if (consent.canRequestAds()) initAds();
    }

    private void initAds() {
        if (started.getAndSet(true)) return;
        MobileAds.initialize(a, status -> {
            loadAppOpen();
            loadInterstitial();
        });
    }

    private void loadAppOpen() {
        AppOpenAd.load(a, a.getString(R.string.admob_app_open), new AdRequest.Builder().build(),
                new AppOpenAd.AppOpenAdLoadCallback() {
                    @Override public void onAdLoaded(@NonNull AppOpenAd ad) {
                        // only show if it arrives quickly after launch, never in the middle of play
                        if (appOpenShown || SystemClock.elapsedRealtime() - launchTime > 6000) return;
                        appOpenShown = true;
                        a.runOnUiThread(() -> ad.show(a));
                    }
                    @Override public void onAdFailedToLoad(@NonNull LoadAdError e) { }
                });
    }

    private void loadInterstitial() {
        a.runOnUiThread(() -> InterstitialAd.load(a, a.getString(R.string.admob_interstitial), new AdRequest.Builder().build(),
                new InterstitialAdLoadCallback() {
                    @Override public void onAdLoaded(@NonNull InterstitialAd ad) { interstitial = ad; }
                    @Override public void onAdFailedToLoad(@NonNull LoadAdError e) { interstitial = null; }
                }));
    }

    /** Called from JS; JS is told when the ad is gone (or if there was none). */
    void showInterstitial() {
        a.runOnUiThread(() -> {
            if (interstitial == null) { done(); if (started.get()) loadInterstitial(); return; }
            InterstitialAd ad = interstitial; interstitial = null;
            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override public void onAdDismissedFullScreenContent() { done(); loadInterstitial(); }
                @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError e) { done(); loadInterstitial(); }
            });
            ad.show(a);
        });
    }

    private void done() { a.js("window.inkAdClosed && window.inkAdClosed()"); }

    void showPrivacyOptions() {
        a.runOnUiThread(() -> UserMessagingPlatform.showPrivacyOptionsForm(a, formError -> { }));
    }
}
