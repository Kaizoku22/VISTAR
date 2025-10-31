package com.example.vistarapp.utils

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File

class DownloadManager {
    
    companion object {
        fun shareOrOpenPdf(context: Context, pdfFile: File) {
            try {
                val uri = FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    pdfFile
                )
                
                val intent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, "application/pdf")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                }
                
                // Check if there's an app that can handle PDF files
                if (intent.resolveActivity(context.packageManager) != null) {
                    context.startActivity(intent)
                } else {
                    // If no PDF viewer is available, create a share intent
                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                        type = "application/pdf"
                        putExtra(Intent.EXTRA_STREAM, uri)
                        flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                    }
                    
                    val chooser = Intent.createChooser(shareIntent, "Open PDF with...")
                    chooser.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    context.startActivity(chooser)
                }
                
                Toast.makeText(
                    context,
                    "Marksheet PDF saved to: ${pdfFile.absolutePath}",
                    Toast.LENGTH_LONG
                ).show()
                
            } catch (e: Exception) {
                e.printStackTrace()
                Toast.makeText(
                    context,
                    "Error opening PDF: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
        
        fun downloadToPublicDirectory(context: Context, sourceFile: File, fileName: String) {
            try {
                val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                
                // Copy file to public downloads directory
                val publicDownloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val publicFile = File(publicDownloadsDir, fileName)
                
                sourceFile.copyTo(publicFile, overwrite = true)
                
                // Notify download manager about the new file
                val request = DownloadManager.Request(Uri.fromFile(publicFile))
                    .setTitle("Marksheet PDF")
                    .setDescription("Student marksheet downloaded")
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
                
                downloadManager.enqueue(request)
                
                Toast.makeText(
                    context,
                    "Marksheet downloaded to Downloads folder",
                    Toast.LENGTH_SHORT
                ).show()
                
            } catch (e: Exception) {
                e.printStackTrace()
                Toast.makeText(
                    context,
                    "Error downloading PDF: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
}