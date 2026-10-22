# Merz-Automobile – Rechnung (neues Design)

| Datei | Inhalt |
|---|---|
| `Merz-Automobile_Rechnung.docx` | Kaufvertrag und Rechnung + AGB, in Word bearbeitbar |
| `Merz-Automobile_Rechnung.pdf` | Dieselbe Rechnung als PDF |
| `logo/merz-logo-dunkel.*` | Neues Logo für helle Hintergründe (PNG + SVG) |
| `logo/merz-logo-hell.*` | Neues Logo für dunkle Hintergründe (PNG + SVG) |
| `logo/merz-monogramm.*` | Nur das „M“-Zeichen (z. B. Social-Media-Profilbild) |
| `quellcode/` | Skripte, mit denen Logo und Rechnung erzeugt werden |

Neu erzeugen (Node.js mit den Paketen `docx` und `playwright`):

```bash
node quellcode/mklogo.js                                   # Logo
node quellcode/rechnung.js Merz-Automobile_Rechnung.docx   # Rechnung
```
