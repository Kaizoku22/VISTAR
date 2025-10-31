package com.example.vistarapp.utils

import android.content.Context
import android.os.Environment
import com.example.vistarapp.data.model.MarksheetHeader
import com.example.vistarapp.data.model.MarksEntry
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.Cell
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.element.Table
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import com.itextpdf.kernel.font.PdfFontFactory
import com.itextpdf.kernel.font.PdfFont
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*

class MarksheetPdfGenerator {
    
    companion object {
        fun generateMarksheetPdf(
            context: Context,
            marksheet: MarksheetHeader,
            marksEntries: List<MarksEntry>,
            studentName: String,
            rollNo: String
        ): File? {
            return try {
                // Create downloads directory if it doesn't exist
                val downloadsDir = File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "Marksheets")
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs()
                }
                
                // Create PDF file
                val fileName = "marksheet_${studentName.replace(" ", "_")}_${marksheet.exam_name?.replace(" ", "_")}.pdf"
                val pdfFile = File(downloadsDir, fileName)
                
                val writer = PdfWriter(FileOutputStream(pdfFile))
                val pdfDocument = PdfDocument(writer)
                val document = Document(pdfDocument)
                
                // Set up fonts
                val boldFont = PdfFontFactory.createFont()
                val regularFont = PdfFontFactory.createFont()
                
                // Add header
                document.add(
                    Paragraph("VISTAR - Student Marksheet")
                        .setFont(boldFont)
                        .setFontSize(18f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginBottom(20f)
                )
                
                // Add exam title
                document.add(
                    Paragraph("Regular Exam Mark Sheet")
                        .setFont(boldFont)
                        .setFontSize(14f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginBottom(20f)
                )
                
                // Student information table
                val studentInfoTable = Table(UnitValue.createPercentArray(floatArrayOf(30f, 70f)))
                    .setWidth(UnitValue.createPercentValue(100f))
                
                studentInfoTable.addCell(
                    Cell().add(Paragraph("Student Name").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                studentInfoTable.addCell(
                    Cell().add(Paragraph(studentName).setFont(regularFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                
                studentInfoTable.addCell(
                    Cell().add(Paragraph("Roll Number").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                studentInfoTable.addCell(
                    Cell().add(Paragraph(rollNo).setFont(regularFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                
                studentInfoTable.addCell(
                    Cell().add(Paragraph("Class/Grade").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                studentInfoTable.addCell(
                    Cell().add(Paragraph("N/A").setFont(regularFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                
                studentInfoTable.addCell(
                    Cell().add(Paragraph("Division").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                studentInfoTable.addCell(
                    Cell().add(Paragraph("A").setFont(regularFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                
                studentInfoTable.addCell(
                    Cell().add(Paragraph("School").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                studentInfoTable.addCell(
                    Cell().add(Paragraph("VIZ").setFont(regularFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                
                studentInfoTable.addCell(
                    Cell().add(Paragraph("Exam").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                studentInfoTable.addCell(
                    Cell().add(Paragraph(marksheet.exam_name ?: "Regular exam").setFont(regularFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                
                studentInfoTable.addCell(
                    Cell().add(Paragraph("Date").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                studentInfoTable.addCell(
                    Cell().add(Paragraph(marksheet.exam_date ?: "2024-10-10").setFont(regularFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                
                studentInfoTable.addCell(
                    Cell().add(Paragraph("Term").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                studentInfoTable.addCell(
                    Cell().add(Paragraph(marksheet.term ?: "First term").setFont(regularFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                
                studentInfoTable.addCell(
                    Cell().add(Paragraph("Grade").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                
                // Calculate overall grade
                val totalObtained = marksEntries.sumOf { it.obtained_marks ?: 0 }
                val totalMax = marksEntries.sumOf { it.max_marks ?: 0 }
                val percentage = if (totalMax > 0) (totalObtained.toDouble() / totalMax * 100) else 0.0
                val grade = calculateGrade(percentage)
                
                studentInfoTable.addCell(
                    Cell().add(Paragraph(grade).setFont(regularFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                
                studentInfoTable.addCell(
                    Cell().add(Paragraph("Percentage").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                studentInfoTable.addCell(
                    Cell().add(Paragraph("${String.format("%.2f", percentage)}%").setFont(regularFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                
                document.add(studentInfoTable)
                document.add(Paragraph("\n"))
                
                // Marks table
                val marksTable = Table(UnitValue.createPercentArray(floatArrayOf(40f, 20f, 20f, 20f)))
                    .setWidth(UnitValue.createPercentValue(100f))
                
                // Table headers
                marksTable.addHeaderCell(
                    Cell().add(Paragraph("Subject").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                        .setTextAlignment(TextAlignment.CENTER)
                )
                marksTable.addHeaderCell(
                    Cell().add(Paragraph("Total Marks").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                        .setTextAlignment(TextAlignment.CENTER)
                )
                marksTable.addHeaderCell(
                    Cell().add(Paragraph("Marks Obtained").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                        .setTextAlignment(TextAlignment.CENTER)
                )
                marksTable.addHeaderCell(
                    Cell().add(Paragraph("Percent").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                        .setTextAlignment(TextAlignment.CENTER)
                )
                
                // Add subject rows
                marksEntries.forEach { entry ->
                    val subjectPercentage = if ((entry.max_marks ?: 0) > 0) {
                        ((entry.obtained_marks ?: 0).toDouble() / (entry.max_marks ?: 1) * 100)
                    } else 0.0
                    
                    marksTable.addCell(
                        Cell().add(Paragraph(entry.subject_name ?: "Unknown").setFont(regularFont))
                            .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                    )
                    marksTable.addCell(
                        Cell().add(Paragraph("${entry.max_marks ?: 0}").setFont(regularFont))
                            .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                            .setTextAlignment(TextAlignment.CENTER)
                    )
                    marksTable.addCell(
                        Cell().add(Paragraph("${entry.obtained_marks ?: 0}").setFont(regularFont))
                            .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                            .setTextAlignment(TextAlignment.CENTER)
                    )
                    marksTable.addCell(
                        Cell().add(Paragraph("${String.format("%.1f", subjectPercentage)}%").setFont(regularFont))
                            .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                            .setTextAlignment(TextAlignment.CENTER)
                    )
                }
                
                // Add total row
                marksTable.addCell(
                    Cell().add(Paragraph("Total").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                )
                marksTable.addCell(
                    Cell().add(Paragraph("$totalMax").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                        .setTextAlignment(TextAlignment.CENTER)
                )
                marksTable.addCell(
                    Cell().add(Paragraph("$totalObtained").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                        .setTextAlignment(TextAlignment.CENTER)
                )
                marksTable.addCell(
                    Cell().add(Paragraph("${String.format("%.2f", percentage)}%").setFont(boldFont))
                        .setBorder(com.itextpdf.layout.borders.SolidBorder(1f))
                        .setTextAlignment(TextAlignment.CENTER)
                )
                
                document.add(marksTable)
                
                // Add footer note
                document.add(
                    Paragraph("\nThis is a system generated marksheet.")
                        .setFont(regularFont)
                        .setFontSize(10f)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginTop(20f)
                )
                
                document.close()
                pdfFile
                
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }
        
        private fun calculateGrade(percentage: Double): String {
            return when {
                percentage >= 90 -> "A+"
                percentage >= 80 -> "A"
                percentage >= 70 -> "B+"
                percentage >= 60 -> "B"
                percentage >= 50 -> "C+"
                percentage >= 40 -> "C"
                percentage >= 33 -> "D"
                else -> "F"
            }
        }
    }
}