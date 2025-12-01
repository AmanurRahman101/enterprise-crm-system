package com.tawasol.crm.util

import android.content.Intent
import android.net.Uri

object DeepLinkUtils {
    
    /**
     * Parse deep link intent and extract data
     */
    fun parseDeepLink(intent: Intent): DeepLinkData? {
        val data = intent.data ?: return null
        
        return when {
            // Deal deep links
            data.scheme == "tawasol" && data.host == "deal" -> {
                val dealId = data.getQueryParameter("id")?.toIntOrNull()
                if (dealId != null) {
                    DeepLinkData.Deal(dealId)
                } else null
            }
            
            data.scheme == "https" && data.pathSegments.firstOrNull() == "deals" -> {
                val dealId = data.pathSegments.getOrNull(1)?.toIntOrNull()
                if (dealId != null) {
                    DeepLinkData.Deal(dealId)
                } else null
            }
            
            // Issue deep links
            data.scheme == "tawasol" && data.host == "issue" -> {
                val issueId = data.getQueryParameter("id")?.toIntOrNull()
                if (issueId != null) {
                    DeepLinkData.Issue(issueId)
                } else null
            }
            
            data.scheme == "https" && data.pathSegments.firstOrNull() == "issues" -> {
                val issueId = data.pathSegments.getOrNull(1)?.toIntOrNull()
                if (issueId != null) {
                    DeepLinkData.Issue(issueId)
                } else null
            }
            
            // Contact deep links
            data.scheme == "tawasol" && data.host == "contact" -> {
                val contactId = data.getQueryParameter("id")?.toIntOrNull()
                if (contactId != null) {
                    DeepLinkData.Contact(contactId)
                } else null
            }
            
            data.scheme == "https" && data.pathSegments.firstOrNull() == "contacts" -> {
                val contactId = data.pathSegments.getOrNull(1)?.toIntOrNull()
                if (contactId != null) {
                    DeepLinkData.Contact(contactId)
                } else null
            }
            
            // Chat deep link
            data.scheme == "tawasol" && data.host == "chat" -> {
                DeepLinkData.Chat
            }
            
            // Call deep link
            data.scheme == "tawasol" && data.host == "call" -> {
                val channelName = data.getQueryParameter("channel")
                val isVideo = data.getQueryParameter("video")?.toBoolean() ?: false
                if (channelName != null) {
                    DeepLinkData.Call(channelName, isVideo)
                } else null
            }
            
            else -> null
        }
    }
    
    /**
     * Create deep link URI for deal
     */
    fun createDealDeepLink(dealId: Int): Uri {
        return Uri.parse("tawasol://deal?id=$dealId")
    }
    
    /**
     * Create deep link URI for issue
     */
    fun createIssueDeepLink(issueId: Int): Uri {
        return Uri.parse("tawasol://issue?id=$issueId")
    }
    
    /**
     * Create deep link URI for contact
     */
    fun createContactDeepLink(contactId: Int): Uri {
        return Uri.parse("tawasol://contact?id=$contactId")
    }
    
    /**
     * Create deep link URI for chat
     */
    fun createChatDeepLink(): Uri {
        return Uri.parse("tawasol://chat")
    }
    
    /**
     * Create deep link URI for call
     */
    fun createCallDeepLink(channelName: String, isVideo: Boolean): Uri {
        return Uri.parse("tawasol://call?channel=$channelName&video=$isVideo")
    }
}

/**
 * Sealed class representing different deep link types
 */
sealed class DeepLinkData {
    data class Deal(val dealId: Int) : DeepLinkData()
    data class Issue(val issueId: Int) : DeepLinkData()
    data class Contact(val contactId: Int) : DeepLinkData()
    data class Call(val channelName: String, val isVideo: Boolean) : DeepLinkData()
    object Chat : DeepLinkData()
}
