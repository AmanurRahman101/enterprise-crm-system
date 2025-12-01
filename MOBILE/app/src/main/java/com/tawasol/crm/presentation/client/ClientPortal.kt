package com.tawasol.crm.presentation.client

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController

sealed class ClientScreen(
    val route: String,
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    object Deals : ClientScreen(
        "client_deals",
        "My Deals",
        Icons.Filled.Assignment,
        Icons.Outlined.Assignment
    )
    object Issues : ClientScreen(
        "client_issues",
        "My Issues",
        Icons.Filled.BugReport,
        Icons.Outlined.BugReport
    )
    object More : ClientScreen(
        "client_more",
        "More",
        Icons.Filled.Menu,
        Icons.Outlined.Menu
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClientPortal(
    onLogout: () -> Unit = {}
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    
    val screens = listOf(
        ClientScreen.Deals,
        ClientScreen.Issues,
        ClientScreen.More
    )
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        screens.find { it.route == currentRoute }?.title ?: "Tawasol CRM"
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = com.tawasol.crm.presentation.theme.Indigo600,
                    titleContentColor = androidx.compose.ui.graphics.Color.White
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = androidx.compose.ui.graphics.Color.White,
                contentColor = com.tawasol.crm.presentation.theme.Indigo600
            ) {
                screens.forEach { screen ->
                    NavigationBarItem(
                        icon = {
                            Icon(
                                imageVector = if (currentRoute == screen.route) 
                                    screen.selectedIcon 
                                else 
                                    screen.unselectedIcon,
                                contentDescription = screen.title
                            )
                        },
                        label = { Text(screen.title) },
                        selected = currentRoute == screen.route,
                        onClick = {
                            if (currentRoute != screen.route) {
                                navController.navigate(screen.route) {
                                    popUpTo(ClientScreen.Deals.route) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = com.tawasol.crm.presentation.theme.Indigo600,
                            selectedTextColor = com.tawasol.crm.presentation.theme.Indigo600,
                            unselectedIconColor = com.tawasol.crm.presentation.theme.Gray500,
                            unselectedTextColor = com.tawasol.crm.presentation.theme.Gray500,
                            indicatorColor = com.tawasol.crm.presentation.theme.Indigo100
                        )
                    )
                }
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = ClientScreen.Deals.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(ClientScreen.Deals.route) {
                ClientDealsScreen()
            }
            composable(ClientScreen.Issues.route) {
                ClientIssuesScreen()
            }
            composable(ClientScreen.More.route) {
                com.tawasol.crm.presentation.organization.MoreScreen(onLogout = onLogout)
            }
        }
    }
}
