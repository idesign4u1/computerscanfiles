from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
import os
import csv
from datetime import datetime
from typing import Optional
from app.services.storage import DatabaseManager

router = APIRouter()
db = DatabaseManager()

@router.get("/generate-pdf")
async def generate_pdf_report(path: Optional[str] = None, report_type: str = "full") -> FileResponse:
    """Generate PDF report of disk usage analysis"""
    try:
        # Try to import reportlab - if not available, return CSV instead
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            HAS_REPORTLAB = True
        except ImportError:
            HAS_REPORTLAB = False
            raise HTTPException(
                status_code=400,
                detail="PDF generation library not installed. Please install reportlab: pip install reportlab"
            )

        if not path:
            path = "/"
            if os.name == "nt":
                path = "C:\\"

        # Generate report filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"disk_report_{timestamp}.pdf"
        report_path = f"/tmp/{report_filename}"

        # Collect data for report
        file_count = 0
        total_size = 0
        file_types = {}

        for root, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if not d.startswith('.')]

            for file in files:
                try:
                    file_path = os.path.join(root, file)
                    size = os.path.getsize(file_path)
                    ext = os.path.splitext(file)[1].lower()

                    file_count += 1
                    total_size += size

                    if ext not in file_types:
                        file_types[ext] = {"count": 0, "size": 0}
                    file_types[ext]["count"] += 1
                    file_types[ext]["size"] += size
                except (OSError, PermissionError):
                    continue

        # Create PDF
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch

        doc = SimpleDocTemplate(report_path, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#3b82f6'),
            spaceAfter=30,
            alignment=1
        )
        story.append(Paragraph("Disk Space Analysis Report", title_style))
        story.append(Spacer(1, 0.2 * inch))

        # Summary info
        summary_style = ParagraphStyle(
            'Summary',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=12
        )

        def format_bytes(size):
            for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
                if size < 1024:
                    return f"{size:.2f} {unit}"
                size /= 1024
            return f"{size:.2f} PB"

        summary_data = [
            ['Report Generated:', datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
            ['Scanned Path:', path],
            ['Total Files:', str(file_count)],
            ['Total Size:', format_bytes(total_size)],
        ]

        summary_table = Table(summary_data, colWidths=[2 * inch, 4 * inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0f2fe')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))

        story.append(summary_table)
        story.append(Spacer(1, 0.3 * inch))

        # File type breakdown
        story.append(Paragraph("File Type Breakdown", styles['Heading2']))
        story.append(Spacer(1, 0.1 * inch))

        file_type_data = [['Extension', 'Count', 'Size']]
        for ext, stats in sorted(file_types.items(), key=lambda x: x[1]['size'], reverse=True)[:20]:
            file_type_data.append([
                ext or '(no extension)',
                str(stats['count']),
                format_bytes(stats['size'])
            ])

        file_type_table = Table(file_type_data, colWidths=[2 * inch, 1.5 * inch, 2.5 * inch])
        file_type_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ]))

        story.append(file_type_table)

        # Build PDF
        doc.build(story)

        return FileResponse(
            report_path,
            media_type='application/pdf',
            filename=report_filename
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")


@router.get("/generate-csv")
async def generate_csv_report(path: Optional[str] = None, report_type: str = "full") -> StreamingResponse:
    """Generate CSV report of disk usage analysis"""
    try:
        if not path:
            path = "/"
            if os.name == "nt":
                path = "C:\\"

        # Generate report filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"disk_report_{timestamp}.csv"

        # Collect data
        files_data = []

        for root, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if not d.startswith('.')]

            for file in files:
                try:
                    file_path = os.path.join(root, file)
                    size = os.path.getsize(file_path)
                    mod_time = os.path.getmtime(file_path)
                    ext = os.path.splitext(file)[1].lower()

                    files_data.append({
                        'filename': file,
                        'path': file_path,
                        'extension': ext,
                        'size_bytes': size,
                        'modified': datetime.fromtimestamp(mod_time).isoformat()
                    })
                except (OSError, PermissionError):
                    continue

        # Sort by size
        files_data.sort(key=lambda x: x['size_bytes'], reverse=True)

        def generate_csv():
            # Write CSV header
            fieldnames = ['filename', 'path', 'extension', 'size_bytes', 'modified']
            yield ','.join(fieldnames) + '\n'

            # Write data rows
            writer = csv.DictWriter(
                __file_like_wrapper([]),
                fieldnames=fieldnames,
                lineterminator='\n'
            )

            for row in files_data:
                csv_line = ','.join([
                    f'"{row[field].replace(chr(34), chr(34)*2)}"' if isinstance(row[field], str) else str(row[field])
                    for field in fieldnames
                ])
                yield csv_line + '\n'

        # Simple CSV generation without DictWriter
        def simple_generate_csv():
            yield 'filename,path,extension,size_bytes,modified\n'
            for row in files_data:
                filename = row['filename'].replace('"', '""')
                filepath = row['path'].replace('"', '""')
                yield f'"{filename}","{filepath}","{row["extension"]}",{row["size_bytes"]},"{row["modified"]}"\n'

        return StreamingResponse(
            simple_generate_csv(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={report_filename}"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV report: {str(e)}")


class __file_like_wrapper:
    """Helper class for CSV writer"""
    def __init__(self, items):
        self.items = items

    def write(self, item):
        self.items.append(item)
        return len(item)
