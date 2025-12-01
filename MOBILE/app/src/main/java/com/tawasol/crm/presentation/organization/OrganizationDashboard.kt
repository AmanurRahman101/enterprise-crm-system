package com.tawasol.crm.presentation.organization

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

sealed class OrgScreen(
    val route: String,
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    object Overview : OrgScreen(
        "overview",
        "Overview",
        Icons.Filled.Dashboard,
        Icons.Outlined.Dashboard
    )
    object Deals : OrgScreen(
        "deals",
        "Deals",
        Icons.Filled.TrendingUp,
        Icons.Outlined.TrendingUp
    )
    object Contacts : OrgScreen(
        "contacts",
        "Contacts",
        Icons.Filled.Contacts,
        Icons.Outlined.Contacts
    )
    object Issues : OrgScreen(
        "issues",
        "Issues",
        Icons.Filled.BugReport,
        Icons.Outlined.BugReport
    )
    object More : OrgScreen(
        "more",
        "More",
        Icons.Filled.Menu,
        Icons.Outlined.Menu
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrganizationDashboard(
    onLogout: () -> Unit = {}
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    
    val screens = listOf(
        OrgScreen.Overview,
        OrgScreen.Deals,
        OrgScreen.Contacts,
        OrgScreen.Issues,
        OrgScreen.More
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
                                    popUpTo(OrgScreen.Overview.route) {
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
            startDestination = OrgScreen.Overview.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(OrgScreen.Overview.route) {
                OverviewScreen()
            }
            composable(OrgScreen.Deals.route) {
                DealsScreen()
            }
            composable(OrgScreen.Contacts.route) {
                ContactsScreen()
            }
            composable(OrgScreen.Issues.route) {
                IssuesScreen()
            }
            composable(OrgScreen.More.route) {
                MoreScreen(onLogout = onLogout)
            }
        }
    }
}
