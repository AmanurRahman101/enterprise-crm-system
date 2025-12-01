# ANDROID STUDIO GUIDE

## How to Run the Tawasol CRM Android App

### Step 1: Prerequisites
✅ Install **Android Studio Hedgehog (2023.1.1)** or later
✅ Install **JDK 17** or later
✅ Ensure your **Backend server** is running on port 3000

---

### Step 2: Open Project in Android Studio

1. **Launch Android Studio**
2. Click **File → Open**
3. Navigate to: `c:\Web- my personal projects\tawasol\MOBILE`
4. Click **OK**

---

### Step 3: Gradle Sync

Android Studio will automatically start syncing Gradle files.

**If sync fails:**
- Click the **Sync Project with Gradle Files** icon in the toolbar
- Or: **File → Sync Project with Gradle Files**

**Wait for the sync to complete** (may take 2-5 minutes on first run)

---

### Step 4: Configure Backend URL

#### For Android Emulator:
The app is already configured for emulator with `10.0.2.2:3000`

#### For Physical Device:
1. Find your computer's IP address:
   - Windows: Open CMD and run `ipconfig`
   - Mac/Linux: Run `ifconfig`
   - Look for IPv4 address (e.g., `192.168.1.100`)

2. Update the base URL:
   - Open: `app/src/main/java/com/tawasol/crm/data/remote/ApiService.kt`
   - Change line 14:
   ```kotlin
   private const val BASE_URL = "http://YOUR_IP_ADDRESS:3000/api/"
   // Example: "http://192.168.1.100:3000/api/"
   ```

3. Update WebSocket URL:
   - Open: `app/src/main/java/com/tawasol/crm/di/SocketModule.kt`
   - Change line 20:
   ```kotlin
   private const val SOCKET_URL = "http://YOUR_IP_ADDRESS:3001"
   ```

---

### Step 5: Start Backend Server

Make sure your backend is running:

```bash
cd "c:\Web- my personal projects\tawasol\Backend"
npm install
npm start
```

Verify it's running at: http://localhost:3000

---

### Step 6: Run the App

#### Option A: Using Emulator (Recommended for Testing)

1. **Create Virtual Device (if needed):**
   - Click **Tools → Device Manager**
   - Click **Create Device**
   - Select **Pixel 6** or any phone
   - Choose **API 34** (Android 14)
   - Click **Finish**

2. **Run the App:**
   - Select your virtual device from the device dropdown
   - Click the **Run** button (▶️) or press **Shift + F10**

3. **Wait for the app to launch** (first build may take 3-5 minutes)

#### Option B: Using Physical Device

1. **Enable Developer Mode on your phone:**
   - Go to **Settings → About Phone**
   - Tap **Build Number** 7 times
   - Developer Options will be enabled

2. **Enable USB Debugging:**
   - Go to **Settings → Developer Options**
   - Turn on **USB Debugging**

3. **Connect your phone:**
   - Connect via USB cable
   - Accept the debugging prompt on your phone

4. **Run the App:**
   - Select your device from the device dropdown
   - Click the **Run** button (▶️)

---

### Step 7: First Run Setup

When the app launches:

1. **Sign Up:**
   - Click "Don't have an account? Sign Up"
   - Enter your details:
     - Email: `admin@example.com`
     - Password: `password123`
     - Full Name: `Admin User`
     - Organization: `Test Company`
   - Click **Sign Up**

2. **Or Sign In** (if you already have an account):
   - Email: `admin@example.com`
   - Password: `password123`

---

## Troubleshooting

### Problem: "SDK location not found"
**Solution:**
1. Create a file named `local.properties` in the MOBILE folder
2. Add this line (adjust path to your SDK):
```
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

### Problem: "Unable to resolve dependency"
**Solution:**
1. Check internet connection
2. Click **File → Invalidate Caches → Invalidate and Restart**
3. Run: `./gradlew clean build --refresh-dependencies`

### Problem: "Network request failed" on emulator
**Solution:**
- Ensure backend URL is `http://10.0.2.2:3000/api/`
- Check backend is running on port 3000

### Problem: "Network request failed" on physical device
**Solution:**
- Update BASE_URL to use your computer's IP
- Ensure phone and computer are on same WiFi network
- Check firewall isn't blocking port 3000

### Problem: Build fails with Hilt errors
**Solution:**
- Click **Build → Rebuild Project**
- If still fails: **Build → Clean Project** then rebuild

### Problem: Room database errors
**Solution:**
- Uninstall app from device/emulator
- Run again (fresh install)

---

## Build Configurations

### Debug Build (Development)
- Already configured
- Includes debugging tools
- No obfuscation
- Larger APK size

### Release Build (Production)
1. Click **Build → Generate Signed Bundle / APK**
2. Select **APK**
3. Create new keystore (or use existing)
4. Fill in keystore details
5. Select **release** build variant
6. Click **Finish**

APK will be at: `app/build/outputs/apk/release/app-release.apk`

---

## Project Structure Overview

```
MOBILE/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/tawasol/crm/
│   │   │   │   ├── data/           # Data layer
│   │   │   │   ├── di/             # Dependency Injection
│   │   │   │   ├── presentation/   # UI & ViewModels
│   │   │   │   └── util/           # Utilities
│   │   │   └── AndroidManifest.xml
│   │   └── test/                   # Unit tests
│   ├── build.gradle.kts            # App dependencies
│   └── proguard-rules.pro          # ProGuard rules
├── gradle/                         # Gradle wrapper
└── build.gradle.kts                # Project config
```

---

## Running Tests

### Unit Tests:
```bash
./gradlew test
```

Or in Android Studio:
- Right-click `app/src/test` → **Run Tests**

### Instrumentation Tests:
```bash
./gradlew connectedAndroidTest
```

---

## Key Features to Test

1. ✅ **Login/Signup** - Authentication flow
2. ✅ **Deals Pipeline** - View and filter deals by stage
3. ✅ **Issues Tracking** - Create and view issues
4. ✅ **Contacts** - Online status indicators
5. ✅ **Search** - Search deals, issues, contacts
6. ✅ **Filters** - Filter by status, priority, type
7. ✅ **HudHud AI** - Chat with AI assistant
8. ✅ **Profile** - View and edit profile
9. ✅ **Settings** - App preferences
10. ✅ **Offline Mode** - Works without internet (cached data)

---

## Performance Tips

- **First build** is slow (3-5 min) - downloads dependencies
- **Subsequent builds** are faster (30-60 sec)
- **Use emulator** for faster development iteration
- **Enable instant run** for hot reload (already enabled)

---

## Need Help?

**Logs:**
- View logs in Android Studio: **View → Tool Windows → Logcat**
- Filter by app name: `com.tawasol.crm`

**Clean Build:**
```bash
./gradlew clean build
```

**Rebuild Project:**
- **Build → Rebuild Project**

**Restart Android Studio:**
- **File → Invalidate Caches → Invalidate and Restart**

---

## Quick Start Checklist

- [ ] Android Studio installed
- [ ] JDK 17 installed
- [ ] Backend server running on port 3000
- [ ] Project opened in Android Studio
- [ ] Gradle sync completed
- [ ] Backend URL configured correctly
- [ ] Emulator created OR physical device connected
- [ ] App running successfully

---

**You're all set! Happy coding! 🚀**
