# Ink Squadron 1.0 – Οδηγός κυκλοφορίας στο Google Play

## Τι είναι ήδη έτοιμο
- **Android 16 (API 36)**, όπως ζητά το Google Play για νέες εφαρμογές από 31/8/2026. Έκδοση **1.0** (versionCode 3).
- **AdMob**: η εφαρμογή `ca-app-pub-9998734808633197~2489563313` και δύο ad units, το App Open (`…/9984909953`) και το Interstitial (`…/8671828284`). Τα **release** builds δείχνουν τις πραγματικές διαφημίσεις. Τα **debug** builds δείχνουν διαφημίσεις δοκιμής της Google, για να μη μετρήσουν ποτέ τα δικά σου κλικ.
- **Πολιτική απορρήτου**: `docs/privacy.html`.
- **Γραφικά για το Store** στο `docs/store/`: εικονίδιο 512×512, feature graphic 1024×500 και 6 screenshots 1080×1920.
- **Κείμενα για το Store σε 8 γλώσσες**: `docs/store/listing.md`.
- **Κλειδί υπογραφής** (upload key): `ink-squadron-upload.jks`, δημιουργήθηκε στις 7/11/2026.
  - SHA-1: `35:DE:D0:38:35:2E:B9:10:A3:84:8E:C2:D6:91:C8:59:B5:54:8D:BC`
  - SHA-256: `B2:D8:6B:0B:AF:82:71:7E:95:30:93:62:FA:0C:6B:B4:99:D9:59:0F:F0:CF:B6:93:71:43:AA:F2:E0:A4:28:C3`

## 1. GitHub: secrets για το υπογεγραμμένο build (μία φορά)
Repo → **Settings → Secrets and variables → Actions → New repository secret**. Πρόσθεσε τα παρακάτω τέσσερα:

| Όνομα | Τιμή |
|---|---|
| `KEYSTORE_BASE64` | όλο το περιεχόμενο του `keystore_base64.txt` |
| `KEYSTORE_PASSWORD` | ο κωδικός από το `credentials.txt` |
| `KEY_PASSWORD` | ο ίδιος κωδικός |
| `KEY_ALIAS` | `inksquadron` |

Μετά: **Actions → Build Ink Squadron APK → Run workflow** (ή ένα οποιοδήποτε push). Στο artifact **InkSquadron-release** θα βρεις το `app-release.aab`.

⚠️ Κράτα το `.jks` και το `credentials.txt` σε **δύο** ασφαλή σημεία, για παράδειγμα σε password manager και σε ένα USB. Αν χαθούν, η Google μπορεί να αλλάξει το upload key, αλλά θέλει χρόνο.

## 2. GitHub Pages (για τη διεύθυνση της πολιτικής απορρήτου)
Repo → **Settings → Pages → Source: Deploy from a branch → main / docs → Save**.
Η πολιτική θα βρίσκεται στο: `https://nickar82.github.io/Ink-Squadron/privacy.html`

## 3. AdMob: μήνυμα συγκατάθεσης GDPR
AdMob → **Privacy & messaging → European regulations → Create message**: επίλεξε το Ink Squadron, βάλε τη διεύθυνση της πολιτικής απορρήτου και κάνε **Publish**. Χωρίς αυτό, οι χρήστες στην ΕΕ (και στην Ελλάδα) δεν βλέπουν τη φόρμα συγκατάθεσης και τα έσοδα εκεί πέφτουν πολύ.

## 4. Play Console: δημιουργία εφαρμογής
**Create app** με τα εξής:
- Όνομα: *Ink Squadron*
- Προεπιλεγμένη γλώσσα: English (US)
- Τύπος: **Game**
- Free
- Αποδοχή των δηλώσεων

### App content (στήλη αριστερά: Policy → App content)
| Ενότητα | Απάντηση |
|---|---|
| Privacy policy | `https://nickar82.github.io/Ink-Squadron/privacy.html` |
| Ads | **Yes, my app contains ads** |
| App access | All functionality is available without special access |
| Target audience | **13–15, 16–17, 18+** (όχι κάτω των 13). Στο «Could appeal to children?» → No |
| Content rating | Ερωτηματολόγιο IARC → κατηγορία **Game**. Βία: ναι, *fantasy/cartoon* (αεροπλάνα από μελάνι, χωρίς αίμα και ανθρώπους). Όλα τα υπόλοιπα: όχι. Αναμενόμενο αποτέλεσμα: PEGI 7 / Everyone |
| Data safety | δες παρακάτω |
| Government app / Financial / Health / News | No |
| Advertising ID | **Yes**: χρησιμοποιείται για **Advertising or marketing** και **Analytics** (από το AdMob) |

### Data safety (ακριβείς απαντήσεις)
- Συλλέγει ή μοιράζεται δεδομένα; **Yes**
- Κρυπτογράφηση κατά τη μεταφορά: **Yes** (το AdMob χρησιμοποιεί HTTPS)
- Διαγραφή δεδομένων κατόπιν αιτήματος: **No** (δεν υπάρχουν λογαριασμοί, και τα δεδομένα του παιχνιδιού μένουν στο κινητό)
- Τύποι δεδομένων (όλοι **Collected + Shared**, *not required*, μέσω του Google AdMob SDK):
  - **Location → Approximate location** → Advertising, Analytics
  - **App activity → App interactions** → Advertising, Analytics
  - **App info and performance → Crash logs, Diagnostics** → Analytics
  - **Device or other IDs → Device or other IDs** → Advertising, Fraud prevention
- **Δεν** συλλέγονται όνομα, email, επαφές, ακριβής τοποθεσία, φωτογραφίες ή μηνύματα. Τα ονόματα πιλότων και η πρόοδος μένουν μόνο στη συσκευή.

### Store listing (Grow → Store presence → Main store listing)
- Κείμενα: από το `docs/store/listing.md`. Πρόσθεσε μεταφράσεις με **Manage translations**.
- App icon: `docs/store/icon_512.png`
- Feature graphic: `docs/store/feature_graphic_1024x500.png`
- Phone screenshots: τα `docs/store/play_*.png` (6 αρχεία)
- Category: **Games → Casual** (ή Strategy). Tags: *Casual, Board, Strategy, Offline*
- Contact email: το email σου (εμφανίζεται δημόσια)

## 5. Πρώτη κυκλοφορία
Επειδή ο λογαριασμός developer είναι προσωπικός και καινούργιος, η Google ζητά πρώτα **closed testing με τουλάχιστον 12 testers για 14 συνεχόμενες μέρες**, πριν ανοίξει το Production.
1. **Testing → Closed testing → Create track** και πρόσθεσε μια λίστα με email (12+ φίλοι με Android).
2. **Create release** → ανέβασε το `app-release.aab` → Release notes:
   `Πρώτη έκδοση του Ink Squadron! / First release of Ink Squadron!`
3. Αφού περάσουν οι 14 μέρες: **Production → Apply for access** και μετά **Promote release**.

## 6. Μετά την κυκλοφορία
- AdMob → **Apps → Ink Squadron → Link to app store**. Εμφανίζεται μόλις το παιχνίδι γίνει δημόσιο στο Play.
- Προαιρετικά: `app-ads.txt` στο site του developer. Βάλε το GitHub Pages ως website στο Play Console και πρόσθεσε το αρχείο στο `docs/`.
- Google Play Games (achievements και leaderboards): προγραμματισμένο για την 1.1.
