import pypdf

pdf_path = r"c:\Users\velpe\OneDrive\Documentos\ANTIGRAVITY\Innova\PRODUCTOS RECOMENDADOS.pdf"
reader = pypdf.PdfReader(pdf_path)

out_path = r"c:\Users\velpe\OneDrive\Documentos\ANTIGRAVITY\Innova\server\scratch\productos_recomendados_extracted.txt"

with open(out_path, "w", encoding="utf-8") as f:
    for i, page in enumerate(reader.pages):
        f.write(f"=== PAGE {i+1} ===\n")
        text = page.extract_text()
        if text:
            f.write(text)
        else:
            f.write("[No text found]\n")
        f.write("\n\n")

print(f"Successfully extracted text to {out_path}")
