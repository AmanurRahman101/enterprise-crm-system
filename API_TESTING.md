# API Testing Collection for Tawasol CRM

## Base URL
```
http://localhost:3000
```

---

## 1. Health Check

### GET /health
Check if the server is running.

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

**Browser:**
```
http://localhost:3000/health
```

---

## 2. Company Signup

### POST /rpc/signupCompany
Register a new company.

**PowerShell:**
```powershell
$body = @{
    companyName = "Tech Solutions Inc"
    email = "tech@solutions.com"
    password = "secure123"
    phone = "+1234567890"
    address = "123 Tech Street, Silicon Valley"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/rpc/signupCompany" -Method Post -ContentType "application/json" -Body $body
```

**JavaScript (Browser Console):**
```javascript
fetch('http://localhost:3000/rpc/signupCompany', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyName: "Tech Solutions Inc",
    email: "tech@solutions.com",
    password: "secure123",
    phone: "+1234567890",
    address: "123 Tech Street, Silicon Valley"
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Company registered successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "company": {
    "id": 1,
    "company_name": "Tech Solutions Inc",
    "email": "tech@solutions.com",
    "phone": "+1234567890",
    "address": "123 Tech Street, Silicon Valley"
  }
}
```

---

## 3. Company Signin

### POST /rpc/signinCompany
Login as a company.

**PowerShell:**
```powershell
$body = @{
    email = "tech@solutions.com"
    password = "secure123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/rpc/signinCompany" -Method Post -ContentType "application/json" -Body $body
$token = $response.token
Write-Host "Token: $token"
```

**JavaScript:**
```javascript
fetch('http://localhost:3000/rpc/signinCompany', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "tech@solutions.com",
    password: "secure123"
  })
})
.then(res => res.json())
.then(data => {
  console.log(data)
  // Save token for authenticated requests
  localStorage.setItem('token', data.token)
})
```

---

## 4. Customer Signup

### POST /rpc/signupCustomer
Register a new customer.

**PowerShell:**
```powershell
$body = @{
    fullName = "John Doe"
    email = "john@example.com"
    password = "secure123"
    phone = "+0987654321"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/rpc/signupCustomer" -Method Post -ContentType "application/json" -Body $body
```

**JavaScript:**
```javascript
fetch('http://localhost:3000/rpc/signupCustomer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: "John Doe",
    email: "john@example.com",
    password: "secure123",
    phone: "+0987654321"
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

---

## 5. Customer Signin

### POST /rpc/signinCustomer
Login as a customer.

**PowerShell:**
```powershell
$body = @{
    email = "john@example.com"
    password = "secure123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/rpc/signinCustomer" -Method Post -ContentType "application/json" -Body $body
$token = $response.token
Write-Host "Token: $token"
```

---

## 6. Get Company Profile (Protected)

### GET /rpc/getCompanyProfile
Get company profile (requires company token).

**PowerShell:**
```powershell
# First, get the token from signin
$body = @{
    email = "tech@solutions.com"
    password = "secure123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/rpc/signinCompany" -Method Post -ContentType "application/json" -Body $body
$token = $response.token

# Then, use the token to get profile
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/rpc/getCompanyProfile" -Method Get -Headers $headers
```

**JavaScript:**
```javascript
const token = localStorage.getItem('token')

fetch('http://localhost:3000/rpc/getCompanyProfile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log(data))
```

---

## 7. Get Customer Profile (Protected)

### GET /rpc/getCustomerProfile
Get customer profile (requires customer token).

**PowerShell:**
```powershell
# First, get the token from signin
$body = @{
    email = "john@example.com"
    password = "secure123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/rpc/signinCustomer" -Method Post -ContentType "application/json" -Body $body
$token = $response.token

# Then, use the token to get profile
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/rpc/getCustomerProfile" -Method Get -Headers $headers
```

---

## 8. Verify Token

### GET /rpc/verifyToken
Verify if a token is valid.

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"

$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/rpc/verifyToken" -Method Get -Headers $headers
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Email and password are required."
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Company role required."
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Company with this email already exists."
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server error during registration."
}
```

---

## Complete Test Flow (PowerShell)

```powershell
# 1. Company Signup
$companyData = @{
    companyName = "My Company"
    email = "mycompany@test.com"
    password = "password123"
    phone = "+1111111111"
} | ConvertTo-Json

$companySignup = Invoke-RestMethod -Uri "http://localhost:3000/rpc/signupCompany" -Method Post -ContentType "application/json" -Body $companyData
Write-Host "Company Token: $($companySignup.token)"

# 2. Customer Signup
$customerData = @{
    fullName = "Jane Smith"
    email = "jane@test.com"
    password = "password123"
    phone = "+2222222222"
} | ConvertTo-Json

$customerSignup = Invoke-RestMethod -Uri "http://localhost:3000/rpc/signupCustomer" -Method Post -ContentType "application/json" -Body $customerData
Write-Host "Customer Token: $($customerSignup.token)"

# 3. Test Company Protected Route
$companyHeaders = @{
    "Authorization" = "Bearer $($companySignup.token)"
}
$companyProfile = Invoke-RestMethod -Uri "http://localhost:3000/rpc/getCompanyProfile" -Method Get -Headers $companyHeaders
Write-Host "Company Profile: $($companyProfile | ConvertTo-Json)"

# 4. Test Customer Protected Route
$customerHeaders = @{
    "Authorization" = "Bearer $($customerSignup.token)"
}
$customerProfile = Invoke-RestMethod -Uri "http://localhost:3000/rpc/getCustomerProfile" -Method Get -Headers $customerHeaders
Write-Host "Customer Profile: $($customerProfile | ConvertTo-Json)"
```

---

## Notes

- All timestamps are in UTC
- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire in 7 days
- Include `Authorization: Bearer <token>` header for protected routes
- Tokens are returned on successful signup/signin
