"""
Script zum Generieren der OpenAPI-Spezifikation aus der FastAPI-App
"""
import json
import sys
from pathlib import Path

# Füge das src-Verzeichnis zum Python-Pfad hinzu
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from src.main import app

if __name__ == "__main__":
    openapi_schema = app.openapi()

    output_file = backend_dir / "openapi.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)

    print(f"OpenAPI-Spezifikation wurde erfolgreich nach {output_file} geschrieben")
    print(f"Anzahl der Endpoints: {len(openapi_schema.get('paths', {}))}")
