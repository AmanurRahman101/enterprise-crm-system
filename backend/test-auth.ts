/**
 * Authentication API Test Script
 * Tests all authentication endpoints
 */

const BASE_URL = 'http://localhost:5000/api/auth';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

// Store tokens for testing
let accessToken = '';
let refreshToken = '';
let testUserId = '';

// Test helper function
async function test(name: string, fn: () => Promise<void>) {
  try {
    process.stdout.write(`${colors.blue}Testing: ${name}${colors.reset}... `);
    await fn();
    console.log(`${colors.green}✓ PASSED${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.error(`  Error: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

// HTTP request helper
async function request(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    token?: string;
  } = {}
): Promise<any> {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = (data as any).message || `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

// Test Suite
async function runTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 Tawasol CRM - Authentication API Tests');
  console.log('='.repeat(50) + '\n');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Register new user
  totalTests++;
  if (await test('Register new user', async () => {
    const timestamp = Date.now();
    const response = await request('/register', {
      method: 'POST',
      body: {
        email: `testuser${timestamp}@example.com`,
        password: 'Test1234!',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      }
    });

    if (!response.success || !response.data.user || !response.data.tokens) {
      throw new Error('Invalid response structure');
    }

    accessToken = response.data.tokens.accessToken;
    refreshToken = response.data.tokens.refreshToken;
    testUserId = response.data.user.id;
  })) passedTests++;

  // Test 2: Login with existing user
  totalTests++;
  if (await test('Login with seeded user', async () => {
    const response = await request('/login', {
      method: 'POST',
      body: {
        email: 'admin@tawasol.com',
        password: 'Password123!'
      }
    });

    if (!response.success || !response.data.user || !response.data.tokens) {
      throw new Error('Invalid response structure');
    }

    // Update tokens to use admin account for remaining tests
    accessToken = response.data.tokens.accessToken;
    refreshToken = response.data.tokens.refreshToken;
  })) passedTests++;

  // Test 3: Get current user profile
  totalTests++;
  if (await test('Get current user profile', async () => {
    const response = await request('/me', {
      method: 'GET',
      token: accessToken
    });

    if (!response.success || !response.data || !response.data.email) {
      throw new Error('Invalid response structure');
    }
  })) passedTests++;

  // Test 4: Update user profile
  totalTests++;
  if (await test('Update user profile', async () => {
    const response = await request('/me', {
      method: 'PUT',
      token: accessToken,
      body: {
        firstName: 'Updated',
        lastName: 'Name'
      }
    });

    if (!response.success || !response.data) {
      throw new Error('Invalid response structure');
    }
  })) passedTests++;

  // Test 5: Refresh access token
  totalTests++;
  if (await test('Refresh access token', async () => {
    const response = await request('/refresh', {
      method: 'POST',
      body: {
        refreshToken
      }
    });

    if (!response.success || !response.data.accessToken) {
      throw new Error('Invalid response structure');
    }

    // Update access token
    accessToken = response.data.accessToken;
  })) passedTests++;

  // Test 6: Change password
  totalTests++;
  if (await test('Change password', async () => {
    const response = await request('/change-password', {
      method: 'POST',
      token: accessToken,
      body: {
        currentPassword: 'Password123!',
        newPassword: 'NewPassword123!'
      }
    });

    if (!response.success) {
      throw new Error('Password change failed');
    }
  })) passedTests++;

  // Test 7: Login with new password
  totalTests++;
  if (await test('Login with new password', async () => {
    const response = await request('/login', {
      method: 'POST',
      body: {
        email: 'admin@tawasol.com',
        password: 'NewPassword123!'
      }
    });

    if (!response.success) {
      throw new Error('Login with new password failed');
    }

    accessToken = response.data.tokens.accessToken;
  })) passedTests++;

  // Test 8: Logout
  totalTests++;
  if (await test('Logout', async () => {
    const response = await request('/logout', {
      method: 'POST'
    });

    if (!response.success) {
      throw new Error('Logout failed');
    }
  })) passedTests++;

  // Test 9: Unauthorized access (without token)
  totalTests++;
  if (await test('Unauthorized access protection', async () => {
    try {
      await request('/me', {
        method: 'GET'
      });
      throw new Error('Should have failed without token');
    } catch (error) {
      // Expected to fail
      if (error instanceof Error && error.message.includes('HTTP 401')) {
        return; // Success
      }
      throw error;
    }
  })) passedTests++;

  // Test 10: Invalid credentials
  totalTests++;
  if (await test('Login with invalid credentials', async () => {
    try {
      await request('/login', {
        method: 'POST',
        body: {
          email: 'admin@tawasol.com',
          password: 'WrongPassword123!'
        }
      });
      throw new Error('Should have failed with wrong password');
    } catch (error) {
      // Expected to fail
      if (error instanceof Error && error.message.includes('HTTP 401')) {
        return; // Success
      }
      throw error;
    }
  })) passedTests++;

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log(`${colors.green}✓ All tests passed!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Some tests failed${colors.reset}`);
  }
  
  console.log('='.repeat(50) + '\n');

  // Reset admin password back to original
  if (accessToken) {
    console.log('🔄 Resetting admin password to original...');
    try {
      await request('/change-password', {
        method: 'POST',
        token: accessToken,
        body: {
          currentPassword: 'NewPassword123!',
          newPassword: 'Password123!'
        }
      });
      console.log(`${colors.green}✓ Password reset complete${colors.reset}\n`);
    } catch (error) {
      console.log(`${colors.yellow}⚠ Could not reset password${colors.reset}\n`);
    }
  }

  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
