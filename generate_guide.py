import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER

def generate_quick_guide(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles for Nordic Light Theme feel
    title_style = ParagraphStyle(
        name='MainTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=HexColor('#2D3748'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        name='SectionHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=HexColor('#7C9082'), # Sage Green
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        name='NormalBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=HexColor('#4A5568'),
        spaceAfter=10,
        leading=16,
        fontName='Helvetica'
    )
    
    bullet_style = ParagraphStyle(
        name='BulletPoint',
        parent=body_style,
        leftIndent=20,
        bulletIndent=10,
        spaceAfter=6
    )

    story = []

    # Title
    story.append(Paragraph("DataClean AI: Quick Start Guide", title_style))
    story.append(Spacer(1, 10))
    
    # Introduction
    story.append(Paragraph("Welcome to DataClean AI!", heading_style))
    story.append(Paragraph(
        "DataClean AI is a state-of-the-art, automated data cleaning and imputation engine. "
        "It uses advanced statistical analysis and XGBoost-based machine learning to automatically "
        "detect anomalies and suggest the optimal cleaning strategies for your dataset.",
        body_style
    ))
    
    # Step 1
    story.append(Paragraph("Step 1: Mount Your Specimen (Upload Data)", heading_style))
    story.append(Paragraph(
        "Start by navigating to the <b>Upload Dataset</b> tab. You can drag and drop your data files directly into the dropzone.", body_style
    ))
    story.append(Paragraph("• Supported formats: CSV, Excel (.xlsx, .xls), JSON.", bullet_style))
    story.append(Paragraph("• Maximum file size: 100 MB.", bullet_style))
    story.append(Paragraph("Once uploaded, the AI will parse your data and make it available in the memory workspace.", body_style))
    
    # Step 2
    story.append(Paragraph("Step 2: Review the Quality Scan", heading_style))
    story.append(Paragraph(
        "Go to the <b>Quality Report</b> tab to view the automated health analysis. The AI evaluates your data across six critical dimensions:", body_style
    ))
    story.append(Paragraph("• <b>Completeness:</b> Detection of missing or NULL values.", bullet_style))
    story.append(Paragraph("• <b>Consistency:</b> Formatting irregularities and casing mismatches.", bullet_style))
    story.append(Paragraph("• <b>Accuracy:</b> Identification of extreme outliers.", bullet_style))
    story.append(Paragraph("• <b>Uniqueness:</b> Detection of duplicated records.", bullet_style))
    story.append(Paragraph("• <b>Validity:</b> Data type adherence.", bullet_style))
    story.append(Paragraph("• <b>Integrity:</b> Structural cohesion.", bullet_style))
    
    # Step 3
    story.append(Paragraph("Step 3: Apply AI Recommendations", heading_style))
    story.append(Paragraph(
        "Navigate to <b>AI Recommendations</b>. Here, the XGBoost engine will suggest specific actions to fix detected issues.", body_style
    ))
    story.append(Paragraph(
        "For example, it might suggest <i>KNN Imputation</i> for missing salaries if it detects non-linear relationships, "
        "or <i>Winsorization</i> for extreme outliers to preserve data mass.", body_style
    ))
    story.append(Paragraph(
        "Click <b>Apply All Fixes</b> to automatically execute the AI's suggestions and instantly improve your data.", body_style
    ))

    # Step 4
    story.append(Paragraph("Step 4: Manual Cleaning (Optional)", heading_style))
    story.append(Paragraph(
        "If you want granular control, go to <b>Data Cleaning</b>. You can build a sequential mutation pipeline step-by-step.", body_style
    ))
    story.append(Paragraph(
        "Available tools include Z-Score outlier removal, Mode/Median imputation, Log Transformations, One-Hot Encoding, and more.", body_style
    ))
    
    # Step 5
    story.append(Paragraph("Step 5: Exporting the Cleaned Data", heading_style))
    story.append(Paragraph(
        "Once you are satisfied with the Before/After diffs and the new Quality Score, navigate to <b>Export</b>.", body_style
    ))
    story.append(Paragraph("• Download your fully cleaned dataset as a CSV.", bullet_style))
    story.append(Paragraph("• Download a final PDF Quality Report to share with stakeholders.", bullet_style))

    story.append(Spacer(1, 30))
    story.append(Paragraph("<i>Need Help?</i> Use the built-in AI Chat Assistant in the bottom right corner of the application to ask any questions about data science techniques!", body_style))

    # Build PDF
    doc.build(story)
    print(f"PDF generated successfully at: {output_path}")

if __name__ == "__main__":
    output = os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop", "demo", "DataClean_AI_Quick_Guide.pdf")
    generate_quick_guide(output)
