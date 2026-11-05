# Keep the JavaScript bridge methods called from the game
-keepclassmembers class com.inksquadron.game.MainActivity$GameBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
