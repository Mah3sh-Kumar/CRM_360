import csv
import io
from fastapi.responses import StreamingResponse
from app.schemas.report import ReportResponse

def generate_csv_response(report: ReportResponse, filename: str = "report.csv"):
    def iter_csv():
        import io, csv
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=report.columns)
        writer.writeheader()
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        for row in report.data:
            writer.writerow(row)
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
            
    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def generate_xlsx_response(report: ReportResponse, filename: str = "report.xlsx"):
    import xlsxwriter
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    worksheet = workbook.add_worksheet()
    
    # Write header
    for col_num, column_title in enumerate(report.columns):
        worksheet.write(0, col_num, column_title)
        
    # Write data
    for row_num, row_data in enumerate(report.data):
        for col_num, col_name in enumerate(report.columns):
            worksheet.write(row_num + 1, col_num, str(row_data.get(col_name, "")))
            
    workbook.close()
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

def generate_pdf_response(report: ReportResponse, filename: str = "report.pdf"):
    from fpdf import FPDF
    
    class PDF(FPDF):
        def header(self):
            self.set_font("helvetica", "B", 14)
            self.cell(0, 10, report.title, new_x="LMARGIN", new_y="NEXT", align="C")
            self.ln(5)
            
    pdf = PDF()
    pdf.add_page()
    pdf.set_font("helvetica", size=10)
    
    # Calculate column width
    epw = pdf.w - 2 * pdf.l_margin
    col_width = epw / len(report.columns) if report.columns else epw
    
    # Header
    pdf.set_font("helvetica", "B", 10)
    for col in report.columns:
        pdf.cell(col_width, 10, str(col), border=1, align="C")
    pdf.ln()
    
    # Data
    pdf.set_font("helvetica", size=10)
    for row in report.data:
        for col in report.columns:
            val = str(row.get(col, ""))
            # Truncate to fit simply
            pdf.cell(col_width, 10, val[:20], border=1, align="C")
        pdf.ln()
        
    output = pdf.output()
    
    return StreamingResponse(
        iter([bytes(output)]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

def export_report(report: ReportResponse, format: str, filename: str = "report"):
    if format == "csv":
        return generate_csv_response(report, f"{filename}.csv")
    elif format == "xlsx":
        return generate_xlsx_response(report, f"{filename}.xlsx")
    elif format == "pdf":
        return generate_pdf_response(report, f"{filename}.pdf")
    else:
        # Default json
        return report
