import pypdf
import os

pdf_path = r"c:\Users\velpe\OneDrive\Documentos\ANTIGRAVITY\Innova\PRODUCTOS RECOMENDADOS.pdf"
print(f"File size: {os.path.getsize(pdf_path) / (1024*1024):.2f} MB")

reader = pypdf.PdfReader(pdf_path)
num_pages = len(reader.pages)
print(f"Number of pages: {num_pages}")

# Try to extract text from the first 5 pages
for i in range(min(5, num_pages)):
    print(f"--- PAGE {i+1} ---")
    text = reader.pages[i].extract_text()
    if text:
        print(text[:1000])
    else:
        print("[No text found on this page]")
