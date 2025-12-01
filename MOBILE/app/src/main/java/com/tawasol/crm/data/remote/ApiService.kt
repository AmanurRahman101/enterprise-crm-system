package com.tawasol.crm.data.remote

import com.tawasol.crm.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // ============================================================
    // Authentication
    // ============================================================
    
    @POST("/api/auth/signup")
    suspend fun signUp(@Body request: SignUpRequest): Response<AuthResponse>
    
    @POST("/api/auth/signin")
    suspend fun signIn(@Body request: SignInRequest): Response<AuthResponse>
    
    @GET("/api/auth/verify")
    suspend fun verifyToken(): Response<AuthResponse>
    
    @POST("/api/auth/switch-organization")
    suspend fun switchOrganization(@Body request: SwitchOrganizationRequest): Response<SwitchOrganizationResponse>
    
    // ============================================================
    // Organizations
    // ============================================================
    
    @GET("/api/organizations")
    suspend fun getOrganizations(): Response<OrganizationResponse>
    
    @POST("/api/organizations")
    suspend fun createOrganization(@Body request: CreateOrganizationRequest): Response<OrganizationResponse>
    
    @GET("/api/organizations/{id}")
    suspend fun getOrganization(@Path("id") id: Int): Response<OrganizationResponse>
    
    // ============================================================
    // Deals
    // ============================================================
    
    @GET("/api/deals")
    suspend fun getDeals(): Response<DealsResponse>
    
    @GET("/api/deals/stages")
    suspend fun getDealStages(): Response<DealStagesResponse>
    
    @POST("/api/deals")
    suspend fun createDeal(@Body request: CreateDealRequest): Response<ApiResponse<Deal>>
    
    @PUT("/api/deals/{id}")
    suspend fun updateDeal(@Path("id") id: Int, @Body request: CreateDealRequest): Response<ApiResponse<Deal>>
    
    @DELETE("/api/deals/{id}")
    suspend fun deleteDeal(@Path("id") id: Int): Response<ApiResponse<Unit>>
    
    // ============================================================
    // Client Deals
    // ============================================================
    
    @GET("/api/client/deals")
    suspend fun getClientDeals(): Response<DealsResponse>
    
    // ============================================================
    // Issues
    // ============================================================
    
    @GET("/api/issues")
    suspend fun getIssues(): Response<IssuesResponse>
    
    @GET("/api/issues/{id}")
    suspend fun getIssue(@Path("id") id: Int): Response<ApiResponse<Issue>>
    
    @POST("/api/issues")
    suspend fun createIssue(@Body request: CreateIssueRequest): Response<ApiResponse<Issue>>
    
    @PUT("/api/issues/{id}")
    suspend fun updateIssue(@Path("id") id: Int, @Body request: CreateIssueRequest): Response<ApiResponse<Issue>>
    
    @DELETE("/api/issues/{id}")
    suspend fun deleteIssue(@Path("id") id: Int): Response<ApiResponse<Unit>>
    
    // ============================================================
    // Client Issues
    // ============================================================
    
    @GET("/api/client/issues")
    suspend fun getClientIssues(): Response<IssuesResponse>
    
    @POST("/api/client/issues")
    suspend fun createClientIssue(@Body request: CreateIssueRequest): Response<ApiResponse<Issue>>
    
    // ============================================================
    // Contacts
    // ============================================================
    
    @GET("/api/contacts")
    suspend fun getContacts(): Response<ContactsResponse>
    
    @GET("/api/contacts/{id}")
    suspend fun getContact(@Path("id") id: Int): Response<ApiResponse<Contact>>
    
    // ============================================================
    // Users
    // ============================================================
    
    @GET("/api/users")
    suspend fun getAllUsers(): Response<ApiResponse<List<User>>>
    
    // ============================================================
    // Chatbot
    // ============================================================
    
    @POST("/api/chatbot/message")
    suspend fun sendChatMessage(@Body request: ChatMessageRequest): Response<ChatMessageResponse>
    
    @POST("/api/chatbot/reset")
    suspend fun resetChatSession(@Body request: ChatResetRequest): Response<ApiResponse<String>>
    
    @GET("/api/chatbot/status")
    suspend fun getChatStatus(@Query("clientMode") clientMode: Boolean): Response<ChatStatusResponse>
}

// Chatbot models
data class ChatMessageRequest(
    val message: String,
    val isClientMode: Boolean
)

data class ChatMessageResponse(
    val success: Boolean,
    val response: String,
    val mode: String
)

data class ChatResetRequest(
    val isClientMode: Boolean
)

data class ChatStatusResponse(
    val success: Boolean,
    val messageCount: Int?,
    val mode: String?
)
