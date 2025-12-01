package com.tawasol.crm.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.tawasol.crm.presentation.auth.AuthViewModel
import com.tawasol.crm.presentation.auth.SignInScreen
import com.tawasol.crm.presentation.auth.SignUpScreen
import com.tawasol.crm.presentation.home.HomeScreen
import com.tawasol.crm.presentation.theme.TawasolCRMTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TawasolCRMTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    TawasolApp()
                }
            }
        }
    }
}

@Composable
fun TawasolApp() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = hiltViewModel()
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState(initial = false)
    val user by authViewModel.tokenManager.getUser().collectAsState(initial = null)
    
    LaunchedEffect(isLoggedIn) {
        if (isLoggedIn) {
            // Determine if user is client or organization member
            val userRole = user?.role ?: "organization"
            val destination = if (userRole == "client") "client_portal" else "organization"
            navController.navigate(destination) {
                popUpTo("signin") { inclusive = true }
            }
        } else {
            navController.navigate("signin") {
                popUpTo(0) { inclusive = true }
            }
        }
    }
    
    NavHost(
        navController = navController,
        startDestination = if (isLoggedIn) "organization" else "signin"
    ) {
        composable("signin") {
            SignInScreen(
                onNavigateToSignUp = {
                    navController.navigate("signup")
                },
                onSignInSuccess = {
                    // Navigation handled by LaunchedEffect
                }
            )
        }
        
        composable("signup") {
            SignUpScreen(
                onNavigateToSignIn = {
                    navController.popBackStack()
                },
                onSignUpSuccess = {
                    // Navigation handled by LaunchedEffect
                }
            )
        }
        
        composable("organization") {
            com.tawasol.crm.presentation.organization.OrganizationDashboard(
                onLogout = {
                    authViewModel.logout()
                    navController.navigate("signin") {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
        
        composable("client_portal") {
            com.tawasol.crm.presentation.client.ClientPortal(
                onLogout = {
                    authViewModel.logout()
                    navController.navigate("signin") {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
