#!/usr/bin/env python3
"""
Convierte la hoja "Matriz profesional" de un archivo XLSX en:
  1) data/medios.json
  2) data/medios-data.js

No requiere bibliotecas externas: usa solamente la biblioteca estándar de Python.
"""

from __future__ import annotations
import argparse
import json
import re
import zipfile
from datetime import datetime, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET

NS_MAIN = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
NS_REL = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
NS_DOC_REL = {"r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}

KEYS = [
    "id", "nombre", "url", "sede", "region", "idioma", "familia", "funcion",
    "propiedad", "control", "orientacion", "perspectiva",
    "fiabilidad", "independencia", "transparencia", "rigor",
    "correcciones", "separacion", "puntuacion", "confianza",
    "uso", "corroboracion", "corroborar_con", "estado",
    "observaciones", "referencia", "fecha_revision"
]

def column_number(cell_ref: str) -> int:
    letters = re.match(r"[A-Z]+", cell_ref).group(0)
    value = 0
    for char in letters:
        value = value * 26 + ord(char) - 64
    return value

def excel_date(value):
    if isinstance(value, (int, float)):
        return (datetime(1899, 12, 30) + timedelta(days=float(value))).date().isoformat()
    return "" if value is None else str(value)

def read_shared_strings(zf: zipfile.ZipFile):
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    strings = []
    for si in root.findall("m:si", NS_MAIN):
        strings.append("".join(t.text or "" for t in si.findall(".//m:t", NS_MAIN)))
    return strings

def locate_sheet(zf: zipfile.ZipFile, sheet_name: str) -> str:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rel_id = None
    for sheet in workbook.findall(".//m:sheets/m:sheet", NS_MAIN):
        if sheet.attrib.get("name") == sheet_name:
            rel_id = sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
            break
    if not rel_id:
        raise RuntimeError(f"No existe la hoja: {sheet_name}")

    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    target = None
    for rel in rels.findall("r:Relationship", NS_REL):
        if rel.attrib.get("Id") == rel_id:
            target = rel.attrib.get("Target")
            break
    if not target:
        raise RuntimeError("No se pudo localizar el XML de la hoja.")

    target = target.replace("\\", "/")
    if target.startswith("/"):
        return target.lstrip("/")
    if target.startswith("xl/"):
        return target
    return "xl/" + target.lstrip("/")

def parse_cell(cell, shared_strings):
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(t.text or "" for t in cell.findall(".//m:t", NS_MAIN))
    value_node = cell.find("m:v", NS_MAIN)
    if value_node is None or value_node.text is None:
        return ""
    raw = value_node.text
    if cell_type == "s":
        return shared_strings[int(raw)]
    if cell_type == "b":
        return raw == "1"
    if cell_type in ("str", "e"):
        return raw
    try:
        number = float(raw)
        return int(number) if number.is_integer() else number
    except ValueError:
        return raw

def read_matrix(xlsx: Path, sheet_name: str):
    with zipfile.ZipFile(xlsx) as zf:
        shared = read_shared_strings(zf)
        sheet_path = locate_sheet(zf, sheet_name)
        root = ET.fromstring(zf.read(sheet_path))
        rows = {}
        for row in root.findall(".//m:sheetData/m:row", NS_MAIN):
            row_num = int(row.attrib["r"])
            cells = {}
            for cell in row.findall("m:c", NS_MAIN):
                col = column_number(cell.attrib["r"])
                cells[col] = parse_cell(cell, shared)
            rows[row_num] = cells

    headers = [rows.get(4, {}).get(col, "") for col in range(1, 28)]
    records = []
    for row_num in range(5, max(rows) + 1):
        values = [rows.get(row_num, {}).get(col, "") for col in range(1, 28)]
        if not values[1]:
            continue
        record = dict(zip(KEYS, values))
        record["fecha_revision"] = excel_date(record["fecha_revision"])
        records.append(record)
    return headers, records

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("xlsx", type=Path, help="Archivo Excel de origen")
    parser.add_argument("--sheet", default="Matriz profesional")
    parser.add_argument("--json", type=Path, default=Path("data/medios.json"))
    parser.add_argument("--js", type=Path, default=Path("data/medios-data.js"))
    args = parser.parse_args()

    headers, records = read_matrix(args.xlsx, args.sheet)
    revision_dates = sorted({r["fecha_revision"] for r in records if r["fecha_revision"]})
    dataset = {
        "metadata": {
            "titulo": "Directorio profesional de medios geopolíticos",
            "archivo_fuente": args.xlsx.name,
            "hoja_fuente": args.sheet,
            "total_fuentes": len(records),
            "generado": datetime.now().astimezone().isoformat(timespec="seconds"),
            "ultima_revision": revision_dates[-1] if revision_dates else "",
            "descripcion": "Matriz de fuentes clasificada por región, función epistemológica, perspectiva geopolítica y criterios de calidad."
        },
        "columns": [{"key": key, "label": label} for key, label in zip(KEYS, headers)],
        "records": records
    }

    args.json.parent.mkdir(parents=True, exist_ok=True)
    args.js.parent.mkdir(parents=True, exist_ok=True)
    args.json.write_text(json.dumps(dataset, ensure_ascii=False, indent=2), encoding="utf-8")
    args.js.write_text(
        "window.MEDIA_DASHBOARD_DATA = " +
        json.dumps(dataset, ensure_ascii=False, separators=(",", ":")) +
        ";\n",
        encoding="utf-8"
    )
    print(f"Generados {args.json} y {args.js} con {len(records)} fuentes.")

if __name__ == "__main__":
    main()
