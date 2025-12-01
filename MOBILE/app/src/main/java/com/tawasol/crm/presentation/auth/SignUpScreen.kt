package com.tawasol.crm.presentation.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tawasol.crm.presentation.theme.*
import com.tawasol.crm.util.Resource

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SignUpScreen(
    onNavigateToSignIn: () -> Unit,
    onSignUpSuccess: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var fullName by remember { mutableStateOf("") }
    var organizationName by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    
    val signUpState by viewModel.signUpState.collectAsState()
    
    LaunchedEffect(signUpState) {
        when (signUpState) {
            is Resource.Success -> {
                onSignUpSuccess()
                viewModel.resetSignUpState()
            }
            else -> {}
        }
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Blue50, Indigo100)
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(40.dp))
            
            // Logo
            Text(
                text = "Tawasol",
                style = MaterialTheme.typography.displayLarge,
                color = Indigo600,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "CRM",
                style = MaterialTheme.typography.displayMedium,
                color = Gray700,
                fontWeight = FontWeight.Light
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Create Account",
                style = MaterialTheme.typography.headlineMedium,
                color = Gray900
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // Full Name
            OutlinedTextField(
                value = fullName,
                onValueChange = { fullName = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Full Name") },
                leadingIcon = {
                    Icon(Icons.Default.Person, contentDescription = "Name")
                },
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Indigo600,
                    focusedLabelColor = Indigo600
                )
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Email
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Email") },
                leadingIcon = {
                    Icon(Icons.Default.Email, contentDescription = "Email")
                },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next
                ),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Indigo600,
                    focusedLabelColor = Indigo600
                )
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Password
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Password") },
                leadingIcon = {
                    Icon(Icons.Default.Lock, contentDescription = "Password")
                },
                trailingIcon = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                            contentDescription = null
                        )
                    }
                },
                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Next
                ),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Indigo600,
                    focusedLabelColor = Indigo600
                )
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Organization Name (Optional)
            OutlinedTextField(
                value = organizationName,
                onValueChange = { organizationName = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Organization Name (Optional)") },
                leadingIcon = {
                    Icon(Icons.Default.Business, contentDescription = "Organization")
                },
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Indigo600,
                    focusedLabelColor = Indigo600
                )
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Error Message
            if (signUpState is Resource.Error) {
                Text(
                    text = (signUpState as Resource.Error).message ?: "Sign up failed",
                    color = Error,
                    style = MaterialTheme.typography.bodySmall
                )
                Spacer(modifier = Modifier.height(16.dp))
            }
            
            // Sign Up Button
            Button(
                onClick = {
                    if (email.isNotBlank() && password.isNotBlank() && fullName.isNotBlank()) {
                        viewModel.signUp(
                            email, 
                            password, 
                            fullName, 
                            organizationName.ifBlank { null }
                        )
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Indigo600
                ),
                enabled = signUpState !is Resource.Loading
            ) {
                if (signUpState is Resource.Loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = Color.White
                    )
                } else {
                    Text(
                        "Get Started",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Sign In Link
            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Already have an account?",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Gray700
                )
                TextButton(onClick = onNavigateToSignIn) {
                    Text(
                        "Sign In",
                        color = Indigo600,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}
