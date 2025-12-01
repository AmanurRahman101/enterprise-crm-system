package com.tawasol.crm.util

import android.util.Patterns

object ValidationUtils {
    
    /**
     * Validates email format
     */
    fun isValidEmail(email: String): Boolean {
        return email.isNotBlank() && Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }
    
    /**
     * Validates password strength
     * Minimum 8 characters, at least one letter and one number
     */
    fun isValidPassword(password: String): Boolean {
        if (password.length < 8) return false
        val hasLetter = password.any { it.isLetter() }
        val hasDigit = password.any { it.isDigit() }
        return hasLetter && hasDigit
    }
    
    /**
     * Validates phone number (basic check)
     */
    fun isValidPhone(phone: String): Boolean {
        val cleanPhone = phone.replace(Regex("[^0-9+]"), "")
        return cleanPhone.length >= 10 && cleanPhone.length <= 15
    }
    
    /**
     * Validates required field
     */
    fun isNotEmpty(text: String): Boolean {
        return text.isNotBlank()
    }
    
    /**
     * Validates minimum length
     */
    fun hasMinLength(text: String, minLength: Int): Boolean {
        return text.length >= minLength
    }
    
    /**
     * Validates maximum length
     */
    fun hasMaxLength(text: String, maxLength: Int): Boolean {
        return text.length <= maxLength
    }
    
    /**
     * Validates numeric value
     */
    fun isNumeric(text: String): Boolean {
        return text.toDoubleOrNull() != null
    }
    
    /**
     * Validates positive number
     */
    fun isPositiveNumber(text: String): Boolean {
        val number = text.toDoubleOrNull()
        return number != null && number > 0
    }
    
    /**
     * Get email error message
     */
    fun getEmailError(email: String): String? {
        return when {
            email.isBlank() -> "Email is required"
            !isValidEmail(email) -> "Invalid email format"
            else -> null
        }
    }
    
    /**
     * Get password error message
     */
    fun getPasswordError(password: String): String? {
        return when {
            password.isBlank() -> "Password is required"
            password.length < 8 -> "Password must be at least 8 characters"
            !password.any { it.isLetter() } -> "Password must contain at least one letter"
            !password.any { it.isDigit() } -> "Password must contain at least one number"
            else -> null
        }
    }
    
    /**
     * Get phone error message
     */
    fun getPhoneError(phone: String): String? {
        if (phone.isBlank()) return null // Phone is optional
        return when {
            !isValidPhone(phone) -> "Invalid phone number format"
            else -> null
        }
    }
    
    /**
     * Get required field error message
     */
    fun getRequiredFieldError(fieldName: String, value: String): String? {
        return if (value.isBlank()) "$fieldName is required" else null
    }
    
    /**
     * Get length error message
     */
    fun getLengthError(fieldName: String, value: String, minLength: Int, maxLength: Int): String? {
        return when {
            value.length < minLength -> "$fieldName must be at least $minLength characters"
            value.length > maxLength -> "$fieldName must not exceed $maxLength characters"
            else -> null
        }
    }
}
