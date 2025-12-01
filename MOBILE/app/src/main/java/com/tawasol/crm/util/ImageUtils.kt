package com.tawasol.crm.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import kotlin.math.min

object ImageUtils {
    
    /**
     * Compress image to reduce file size
     * @param context Application context
     * @param imageUri URI of the image
     * @param maxSizeKB Maximum size in KB (default 500KB)
     * @return Compressed image file or null if error
     */
    fun compressImage(context: Context, imageUri: Uri, maxSizeKB: Int = 500): File? {
        try {
            val inputStream = context.contentResolver.openInputStream(imageUri)
            val originalBitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()
            
            if (originalBitmap == null) return null
            
            // Calculate scaled dimensions
            val maxDimension = 1024
            val scale = min(
                maxDimension.toFloat() / originalBitmap.width,
                maxDimension.toFloat() / originalBitmap.height
            )
            
            val scaledWidth = (originalBitmap.width * scale).toInt()
            val scaledHeight = (originalBitmap.height * scale).toInt()
            
            val scaledBitmap = Bitmap.createScaledBitmap(
                originalBitmap,
                scaledWidth,
                scaledHeight,
                true
            )
            
            // Compress with quality adjustment
            var quality = 90
            var outputStream = ByteArrayOutputStream()
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
            
            // Reduce quality until size is acceptable
            while (outputStream.toByteArray().size / 1024 > maxSizeKB && quality > 10) {
                outputStream = ByteArrayOutputStream()
                quality -= 10
                scaledBitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
            }
            
            // Save to file
            val tempFile = File.createTempFile("compressed_", ".jpg", context.cacheDir)
            val fileOutputStream = FileOutputStream(tempFile)
            fileOutputStream.write(outputStream.toByteArray())
            fileOutputStream.close()
            
            originalBitmap.recycle()
            scaledBitmap.recycle()
            
            return tempFile
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }
    
    /**
     * Get file extension from URI
     */
    fun getFileExtension(context: Context, uri: Uri): String {
        val contentResolver = context.contentResolver
        val mimeType = contentResolver.getType(uri)
        return when (mimeType) {
            "image/jpeg", "image/jpg" -> "jpg"
            "image/png" -> "png"
            "image/gif" -> "gif"
            "image/webp" -> "webp"
            else -> "jpg"
        }
    }
    
    /**
     * Validate image size
     */
    fun isValidImageSize(context: Context, uri: Uri, maxSizeMB: Int = 10): Boolean {
        try {
            val inputStream = context.contentResolver.openInputStream(uri)
            val sizeInBytes = inputStream?.available() ?: 0
            inputStream?.close()
            
            val sizeInMB = sizeInBytes / (1024 * 1024)
            return sizeInMB <= maxSizeMB
        } catch (e: Exception) {
            return false
        }
    }
}
