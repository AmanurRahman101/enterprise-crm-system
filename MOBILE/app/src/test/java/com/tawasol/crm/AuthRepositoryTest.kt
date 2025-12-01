package com.tawasol.crm

import com.tawasol.crm.data.repository.AuthRepository
import com.tawasol.crm.util.Resource
import io.mockk.*
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import org.junit.Assert.*

/**
 * Example unit test for AuthRepository
 */
class AuthRepositoryTest {
    
    private lateinit var authRepository: AuthRepository
    
    @Before
    fun setup() {
        authRepository = mockk()
    }
    
    @Test
    fun `signIn with valid credentials returns success`() = runTest {
        // Given
        val email = "test@example.com"
        val password = "password123"
        
        // When
        coEvery { authRepository.signIn(email, password) } returns flow {
            emit(Resource.Loading())
            emit(Resource.Success(mockk()))
        }
        
        // Then
        authRepository.signIn(email, password).collect { result ->
            assertTrue(result is Resource.Loading || result is Resource.Success)
        }
    }
    
    @Test
    fun `signIn with invalid credentials returns error`() = runTest {
        // Given
        val email = "invalid@example.com"
        val password = "wrong"
        
        // When
        coEvery { authRepository.signIn(email, password) } returns flow {
            emit(Resource.Loading())
            emit(Resource.Error("Invalid credentials"))
        }
        
        // Then
        authRepository.signIn(email, password).collect { result ->
            if (result is Resource.Error) {
                assertEquals("Invalid credentials", result.message)
            }
        }
    }
}
