from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

class ReportGenerator:
    def generate_pdf(self, dataset_id: int, analysis: dict, recommendations: list, quality_score: dict, output_path: str):
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph(f"Data Quality & Cleaning Report (Dataset ID: {dataset_id})", styles['Title']))
        elements.append(Spacer(1, 12))

        # Quality Score
        elements.append(Paragraph("Overall Quality Score", styles['Heading2']))
        score = quality_score.get('overall_score', 0)
        elements.append(Paragraph(f"Score: {score:.2f} / 100", styles['Normal']))
        elements.append(Spacer(1, 12))

        # Column Analysis Summary
        elements.append(Paragraph("Column Analysis Summary", styles['Heading2']))
        columns = analysis.get('columns', [])
        
        data = [["Column", "Type", "Missing %", "Outliers"]]
        for col in columns:
            data.append([
                col.get('column_name', ''),
                col.get('dtype', ''),
                f"{col.get('missing_pct', 0):.2f}%",
                str(col.get('outliers_iqr', 0))
            ])
            
        t = Table(data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.beige),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        elements.append(t)
        elements.append(Spacer(1, 12))
        
        # Recommendations
        elements.append(Paragraph("Cleaning Recommendations", styles['Heading2']))
        rec_data = [["Column", "Technique", "Confidence"]]
        for rec in recommendations:
            if isinstance(rec, dict):
                col = rec.get('column', '')
                tech = rec.get('technique') or rec.get('recommendation', '')
                conf_val = rec.get('confidence')
                conf_str = f"{conf_val * 100 if conf_val and conf_val <= 1 else (conf_val or 0):.1f}%"
                rec_data.append([str(col), str(tech), conf_str])
            else:
                col = getattr(rec, 'column', '')
                tech = getattr(rec, 'technique', getattr(rec, 'recommendation', ''))
                conf_val = getattr(rec, 'confidence', 0)
                conf_str = f"{conf_val * 100 if conf_val and conf_val <= 1 else (conf_val or 0):.1f}%"
                rec_data.append([str(col), str(tech), conf_str])
                
        t2 = Table(rec_data)
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.lightblue),
            ('TEXTCOLOR', (0,0), (-1,0), colors.black),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('GRID', (0,0), (-1,-1), 1, colors.black)
        ]))
        elements.append(t2)

        doc.build(elements)
