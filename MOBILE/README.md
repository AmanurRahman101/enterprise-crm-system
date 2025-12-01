# Tawasol CRM - Mobile App (Android)

A native Android application for Tawasol CRM built with Kotlin and Jetpack Compose.

## 🏗️ Architecture

- **MVVM Pattern**: Separation of concerns with ViewModel, Repository, and UI layers
- **Jetpack Compose**: Modern declarative UI framework
- **Hilt**: Dependency injection
- **Retrofit**: REST API communication
- **Room**: Local database for offline support
- **Coroutines & Flow**: Asynchronous programming
- **Material 3**: UI components matching web design system

## 📋 Prerequisites

- Android Studio Hedgehog (2023.1.1) or later
- JDK 17
- Android SDK 34
- Kotlin 1.9.24+
- Gradle 8.5+

## 🎨 Design System

Matching the web application:
- **Primary Color**: Indigo-600 (#4F46E5)
- **Secondary**: Gray-700 (#374151)
- **Background**: White
- **Accent**: Indigo-700 (#4338CA)

## 🚀 Setup Instructions

### 1. Clone and Open Project

```bash
cd "c:\Web- my personal projects\tawasol\MOBILE"
```

Open the `MOBILE` folder in Android Studio.

### 2. Gradle Sync

Wait for Android Studio to automatically sync Gradle files. If not automatic:
- Click **File > Sync Project with Gradle Files**

### 3. Backend Configuration

The app connects to your local backend server. Make sure the backend is running:

```bash
cd Backend
npm start
```

For **Android Emulator**, the app uses `http://10.0.2.2:3000` (emulator's localhost)
For **Physical Device**, update `API_BASE_URL` in `app/build.gradle.kts` to your computer's IP address

### 4. Run the App

1. Create an Android Virtual Device (AVD) or connect a physical device
2. Click **Run** button (green play icon) or press `Shift + F10`
3. Select your device/emulator

## 📱 Features Implemented (Tasks 1-5)

### ✅ Task 1: Project Setup
- Kotlin Android project with Jetpack Compose
- MVVM architecture pattern
- Hilt dependency injection configured
- Gradle dependencies: Retrofit, Room, Coroutines, Socket.IO, Agora SDK

### ✅ Task 2: Design System & UI Theme
- Color scheme matching web (Indigo-600 primary)
- Typography system (matching web font sizes)
- Material 3 theme implementation
- Reusable Compose theme

### ✅ Task 3: Network Layer & API Integration
- Retrofit setup with ApiService interface
- All backend endpoints mirrored:
  - `/api/auth/*` - Authentication
  - `/api/organizations/*` - Organization management
  - `/api/deals/*` - Deals CRUD
  - `/api/contacts/*` - Contacts
  - `/api/issues/*` - Issues & JIRA
  - `/api/client/*` - Client portal endpoints
  - `/api/chatbot/*` - HudHud chatbot
- AuthInterceptor for JWT token injection
- Error handling with Resource wrapper
- OkHttp logging interceptor

### ✅ Task 4: Authentication Module
- SignIn screen with email/password
- SignUp screen with organization creation
- JWT token management with DataStore
- Auto-login functionality
- AuthViewModel with state management
- Token persistence across app restarts
- User data caching

### ✅ Task 5: MCP Client Integration
- SSE (Server-Sent Events) transport for MCP
- Connects to `/mcp/client/sse` (client mode)
- Connects to `/mcp/org/sse` (organization mode)
- McpClient with connection state management
- Tool discovery and availability tracking
- Automatic reconnection handling

## 📂 Project Structure

```
app/src/main/java/com/tawasol/crm/
├── data/
│   ├── local/
│   │   └── TokenManager.kt          # DataStore for token/user storage
│   ├── mcp/
│   │   └── McpClient.kt             # MCP SSE client
│   ├── model/
│   │   ├── Auth.kt                  # Auth models
│   │   ├── Organization.kt          # Organization models
│   │   ├── Deal.kt                  # Deal models
│   │   ├── Issue.kt                 # Issue models
│   │   └── Contact.kt               # Contact models
│   ├── remote/
│   │   ├── ApiService.kt            # Retrofit API interface
│   │   └── AuthInterceptor.kt       # JWT interceptor
│   └── repository/
│       └── AuthRepository.kt        # Auth data layer
├── di/
│   └── NetworkModule.kt             # Hilt DI module
├── presentation/
│   ├── auth/
│   │   ├── AuthViewModel.kt         # Auth state management
│   │   ├── SignInScreen.kt          # Sign in UI
│   │   └── SignUpScreen.kt          # Sign up UI
│   ├── home/
│   │   └── HomeScreen.kt            # Main screen placeholder
│   ├── theme/
│   │   ├── Color.kt                 # Color palette
│   │   ├── Type.kt                  # Typography
│   │   └── Theme.kt                 # Material 3 theme
│   └── MainActivity.kt              # Entry point
├── util/
│   └── Resource.kt                  # API response wrapper
└── TawasolApp.kt                    # Application class
```

## 🔧 Configuration

### Environment Variables (build.gradle.kts)

```kotlin
buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000\"")
buildConfigField("String", "WS_URL", "\"ws://10.0.2.2:3001\"")
buildConfigField("String", "MCP_CLIENT_URL", "\"http://10.0.2.2:3000/mcp/client/sse\"")
buildConfigField("String", "MCP_ORG_URL", "\"http://10.0.2.2:3000/mcp/org/sse\"")
```

### For Physical Device Testing

Replace `10.0.2.2` with your computer's IP address:

```kotlin
buildConfigField("String", "API_BASE_URL", "\"http://192.168.x.x:3000\"")
```

## 🧪 Testing

Run tests:
```bash
./gradlew test                    # Unit tests
./gradlew connectedAndroidTest    # Instrumentation tests
```

## 📝 Next Steps (Tasks 6-25)

Remaining features to implement:
- Organization Dashboard (Task 6)
- Client Portal Screens (Task 7)
- Deals Management (Task 8)
- Issues & JIRA Integration (Task 9)
- Contacts Module (Task 10)
- Real-time Features with Socket.IO (Task 11)
- Voice & Video Calls with Agora (Task 12)
- HudHud Chatbot UI (Task 13)
- ... and more

## 🐛 Troubleshooting

### Backend Connection Issues
- Ensure backend is running on port 3000
- Check firewall settings
- For emulator, use `10.0.2.2` instead of `localhost`
- For physical device, use computer's IP address

### Gradle Sync Failed
- Check internet connection
- File > Invalidate Caches > Invalidate and Restart
- Update Gradle wrapper if needed

### Build Errors
- Clean and rebuild: Build > Clean Project, then Build > Rebuild Project
- Check Kotlin version compatibility
- Ensure all dependencies are downloaded

## 📄 License

Same as parent Tawasol CRM project.

## 👥 Contributors

Muhammad Adnan Wasti - Lead Developer
