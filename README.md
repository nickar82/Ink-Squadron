# Ink Squadron – Android (v2.0)

Αερομαχίες σε τετράδιο με ζάρι και μαρκαδόρο: «Draw your battle. Lead your squadron.»

📖 **Εγχειρίδιο παίκτη:** [`docs/Ink_Squadron_Player_Manual.pdf`](docs/Ink_Squadron_Player_Manual.pdf) (και σε [HTML](docs/Ink_Squadron_Player_Manual.html))
🎵 **Δείγμα μουσικής:** [`docs/InkSquadron_music_preview.mp3`](docs/InkSquadron_music_preview.mp3)

## Τι περιέχει
- **Classic**: 100 επίπεδα, ταμπλό με ζάρια και γύρους.
  - Τύποι εχθρικών σκαφών: θωρακισμένο, αναχαιτιστικό, βομβαρδιστικό με 4 όπλα, βαρύ (tank), ελεύθερος σκοπευτής (sniper).
  - **Boss** κάθε 5 επίπεδα: έχει κομμάτια που σπάνε (φτερά, μπροστινό όπλο, κινητήρες, πυρήνας) και κινείται προς 4 κατευθύνσεις.
  - Επιδρομή βομβαρδιστικού που πρέπει να καταρρίψεις πριν περάσει, ενισχύσεις και οχυρά που καταστρέφονται (μετά το επίπεδο 20).
  - **Supply drop**: όταν κολλάς σε ένα επίπεδο, την επόμενη φορά ξεκινάς με επιπλέον ασπίδες και ρουκέτες.
- **Arcade**: μάχη σε πραγματικό χρόνο. Κρατάς πατημένο ένα όπλο για να τραβήξεις γραμμή, και κάθε όπλο έχει δικό του μελάνι που ξαναγεμίζει. Έχει κύματα εχθρών, πίστα μπόνους κάθε 5 κύματα και κέρματα με οθόνη **CONTINUE?** που μετράει αντίστροφα.
- **Time Attack**: 60, 120 ή 180 δευτερόλεπτα, με κέρματα για συνέχεια.
- **1 VS 1**:
  - στο ίδιο κινητό, σε γύρους ή σε πραγματικό χρόνο (με πολλά δάχτυλα ταυτόχρονα)
  - προαιρετικό χρονόμετρο ανά γύρο
  - ή σε **δύο κινητά μέσω Wi-Fi/Bluetooth** (Google Nearby, χωρίς internet)
- 8 γλώσσες: η γλώσσα επιλέγεται με σημαία στο πρώτο άνοιγμα και αλλάζει από τις Ρυθμίσεις.
- **Εποχικά θέματα** που ενεργοποιούνται αυτόματα: Halloween, Χριστούγεννα, Αγίου Βαλεντίνου, καλοκαίρι.
- Εκρήξεις από μελάνι και μουτζούρα πάνω στα κατεστραμμένα σκάφη, φτιαγμένες από τα σχέδιά σου.
- Μουσική synthwave σε στυλ Commodore 64, που παράγεται από τον κώδικα, και ηχητικά εφέ.
- 18 επιτεύγματα και 5 πίνακες κατάταξης (leaderboards) στο **Google Play Games**.
- Διαφημίσεις **AdMob**:
  - φόρμα συναίνεσης GDPR (UMP)
  - διαφήμιση App Open στο άνοιγμα
  - interstitial κάθε 5 επίπεδα και όταν βγαίνεις από μάχη στο μενού

## Ρύθμιση λογαριασμών (ένα αρχείο: `app/src/main/res/values/ids.xml`)

### AdMob
1. Στο admob.google.com: **Apps → Add app** (Android).
2. Δημιούργησε δύο ad units, ένα **App open** και ένα **Interstitial**.
3. Βάλε τα IDs στο `ids.xml`, στις τιμές `admob_app_id`, `admob_app_open` και `admob_interstitial`.

Μέχρι να το κάνεις, το παιχνίδι δείχνει τις **δοκιμαστικές** διαφημίσεις της Google. Μην ανεβάσεις στο Google Play με τα test IDs, και μην πατάς ποτέ τις δικές σου πραγματικές διαφημίσεις.

### Google Play Games
1. Στο Play Console: **Grow → Play Games Services → Setup**.
2. Δημιούργησε project και σύνδεσέ το με την εφαρμογή.
3. Πρόσθεσε το SHA-1 του κλειδιού υπογραφής:
   - **Release key:** το βρίσκεις στο Play Console → App integrity.
   - **Debug key:** με την εντολή `./gradlew signingReport`.
4. Βάλε το αριθμητικό project ID στο `game_services_project_id`.
5. Δημιούργησε τα επιτεύγματα (τα ονόματα και οι περιγραφές είναι στο εγχειρίδιο) και τους πίνακες κατάταξης.
6. Βάλε το ID κάθε επιτεύγματος και πίνακα (μοιάζει με `CgkI…`) στο αντίστοιχο `ach_…` / `lb_…` του `ids.xml`.

Όσο το project ID είναι `0`, το Play Games είναι απλώς ανενεργό. Τα επιτεύγματα καταγράφονται κανονικά μέσα στο παιχνίδι.

## Πώς βγάζεις APK
- **GitHub (αυτόματα):** κάθε push σε οποιοδήποτε branch βγάζει APK. Το κατεβάζεις από **Actions →** το τελευταίο run **→ Artifacts → InkSquadron-debug-apk**.
- **Android Studio:** File → Open → αυτός ο φάκελος → Build → Build APK(s).

### Υπογεγραμμένη έκδοση για Google Play
1. Φτιάξε keystore:
   ```
   keytool -genkey -v -keystore release.jks -alias ink -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Στο GitHub πρόσθεσε τα secrets `KEYSTORE_BASE64` (το αποτέλεσμα του `base64 -w0 release.jks`), `KEYSTORE_PASSWORD`, `KEY_ALIAS` και `KEY_PASSWORD`.
3. Το workflow θα βγάλει υπογεγραμμένο `.aab` (για το Play Console) και `.apk`.
4. **Κράτα το keystore σε ασφαλές μέρος.** Χωρίς αυτό δεν μπορείς να βγάλεις ενημερώσεις.

## Δομή
```
app/src/main/assets/index.html       ← το παιχνίδι (HTML5 canvas, offline)
app/src/main/assets/js/              ← core, rules, game, realtime, menus, i18n, music, season, net, services, sprites…
app/src/main/java/.../MainActivity   ← WebView, fullscreen, Back, δόνηση
   AdsManager.java                   ← AdMob + φόρμα συναίνεσης
   PgsManager.java                   ← Google Play Games
   NearbyManager.java                ← Wi-Fi/Bluetooth multiplayer
app/src/main/res/values/ids.xml      ← όλα τα IDs σε ένα σημείο
docs/                                ← εγχειρίδιο παίκτη (PDF/HTML), δείγμα μουσικής
```
Για γρήγορες δοκιμές ανοίγεις το `app/src/main/assets/index.html` σε browser. Εκεί δουλεύουν όλα εκτός από το Wi-Fi/Bluetooth, τις διαφημίσεις και το Play Games.
