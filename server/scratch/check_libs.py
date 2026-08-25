import sys

for lib in ['pypdf', 'PyPDF2', 'pdfplumber', 'fitz', 'pdfminer']:
    try:
        __import__(lib)
        print(f"{lib}: available")
    except ImportError:
        print(f"{lib}: NOT available")
