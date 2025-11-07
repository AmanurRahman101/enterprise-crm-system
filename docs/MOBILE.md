# Tawasol CRM - Mobile Documentation

## Overview

Two native Android applications:
1. **Employee App** - Internal CRM access for staff
2. **Customer App** - Customer support and ticket management

## Technology Stack

- **Language**: Kotlin
- **Architecture**: MVVM (Model-View-ViewModel)
- **Networking**: Retrofit + OkHttp
- **Dependency Injection**: Hilt
- **Async**: Coroutines + Flow
- **UI**: Jetpack Compose / XML Layouts
- **Database**: Room (for offline storage)

## Project Structure

```
mobile/
├── employee-app/
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/com/tawasol/employee/
│   │   │   │   │   ├── data/          # Data layer
│   │   │   │   │   │   ├── api/       # API interfaces
│   │   │   │   │   │   ├── model/     # Data models
│   │   │   │   │   │   └── repository/ # Repositories
│   │   │   │   │   ├── ui/            # UI layer
│   │   │   │   │   │   ├── contacts/
│   │   │   │   │   │   ├── deals/
│   │   │   │   │   │   └── tasks/
│   │   │   │   │   ├── viewmodel/     # ViewModels
│   │   │   │   │   ├── di/            # Dependency Injection
│   │   │   │   │   └── utils/         # Utilities
│   │   │   │   └── AndroidManifest.xml
│   │   │   └── test/
│   │   └── build.gradle
│   └── gradle files
│
└── customer-app/
    └── (similar structure)
```

## Getting Started

### Prerequisites
- Android Studio Arctic Fox or later
- JDK 11+
- Android SDK 24+ (Target SDK 34)

### Setup

1. **Open in Android Studio**
   - File → Open → Select `mobile/employee-app`

2. **Sync Gradle**
   - Let Android Studio download dependencies

3. **Configure API URL**
   - Edit `local.properties` or build config
   ```
   API_BASE_URL=http://10.0.2.2:5000/api/v1
   ```
   Note: 10.0.2.2 is localhost from Android emulator

4. **Run App**
   - Select device/emulator
   - Click Run ▶️

## Architecture

### MVVM Pattern

```
View (Activity/Fragment)
    ↓
ViewModel
    ↓
Repository
    ↓
Data Source (API / Database)
```

### Key Components

1. **Data Layer**
   - API interfaces (Retrofit)
   - Data models
   - Repositories (single source of truth)

2. **Domain Layer**
   - Use cases (business logic)
   - Domain models

3. **Presentation Layer**
   - ViewModels (UI state)
   - Activities/Fragments (UI)

## Code Examples

### API Interface

```kotlin
interface ContactApi {
    @GET("contacts")
    suspend fun getContacts(): Response<List<Contact>>
    
    @GET("contacts/{id}")
    suspend fun getContactById(@Path("id") id: String): Response<Contact>
    
    @POST("contacts")
    suspend fun createContact(@Body contact: Contact): Response<Contact>
}
```

### Repository

```kotlin
class ContactRepository @Inject constructor(
    private val api: ContactApi,
    private val dao: ContactDao
) {
    suspend fun getContacts(): Result<List<Contact>> {
        return try {
            val response = api.getContacts()
            if (response.isSuccessful) {
                response.body()?.let { contacts ->
                    dao.insertAll(contacts) // Cache locally
                    Result.success(contacts)
                } ?: Result.failure(Exception("Empty response"))
            } else {
                Result.failure(Exception("Error: ${response.code()}"))
            }
        } catch (e: Exception) {
            // Return cached data if available
            val cached = dao.getAllContacts()
            if (cached.isNotEmpty()) {
                Result.success(cached)
            } else {
                Result.failure(e)
            }
        }
    }
}
```

### ViewModel

```kotlin
@HiltViewModel
class ContactViewModel @Inject constructor(
    private val repository: ContactRepository
) : ViewModel() {
    
    private val _contacts = MutableStateFlow<List<Contact>>(emptyList())
    val contacts: StateFlow<List<Contact>> = _contacts.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    fun loadContacts() {
        viewModelScope.launch {
            _isLoading.value = true
            repository.getContacts()
                .onSuccess { _contacts.value = it }
                .onFailure { /* Handle error */ }
            _isLoading.value = false
        }
    }
}
```

### Activity/Fragment

```kotlin
@AndroidEntryPoint
class ContactListActivity : AppCompatActivity() {
    
    private val viewModel: ContactViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_contact_list)
        
        // Observe contacts
        lifecycleScope.launch {
            viewModel.contacts.collect { contacts ->
                updateUI(contacts)
            }
        }
        
        viewModel.loadContacts()
    }
}
```

## Employee App Features

### Phase 1
- ✅ Authentication
- ✅ Contact browsing
- ✅ Deal pipeline view
- ✅ Task management
- ✅ Offline sync
- ✅ Push notifications

### Phase 2
- VoIP calling
- AI assistant integration
- Real-time updates

## Customer App Features

### Phase 1
- ✅ Ticket submission
- ✅ Ticket tracking
- ✅ Push notifications
- ✅ In-app chat

### Phase 2
- VoIP support calls
- Knowledge base
- Self-service portal

## Best Practices

### Kotlin Guidelines
- Use data classes for models
- Prefer `val` over `var`
- Use coroutines for async operations
- Leverage Kotlin extensions

### Android Guidelines
- Follow Material Design
- Support dark mode
- Handle configuration changes
- Implement proper lifecycle management
- Use LiveData/Flow for reactive UI

### Security
- Store tokens securely (EncryptedSharedPreferences)
- Validate SSL certificates
- Obfuscate code with ProGuard
- Never hardcode secrets

## Testing

### Unit Tests
```bash
./gradlew test
```

### Instrumented Tests
```bash
./gradlew connectedAndroidTest
```

## Build & Release

### Debug Build
```bash
./gradlew assembleDebug
```

### Release Build
```bash
./gradlew assembleRelease
```

### Signing Config
Edit `app/build.gradle`:
```groovy
signingConfigs {
    release {
        storeFile file("keystore.jks")
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias "tawasol"
        keyPassword System.getenv("KEY_PASSWORD")
    }
}
```

## Troubleshooting

### Common Issues

1. **Build failures**
   - Clean project: Build → Clean Project
   - Invalidate caches: File → Invalidate Caches

2. **Network errors**
   - Check API URL configuration
   - Verify internet permission in manifest
   - Test with Postman first

3. **Dependency conflicts**
   - Check `build.gradle` versions
   - Use dependency resolution strategy

## Next Steps

1. Set up Android project structure
2. Implement authentication screens
3. Build contact list interface
4. Create deal pipeline view
5. Implement offline sync with Room
6. Add push notifications
