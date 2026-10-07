from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

path = next(Path.home().joinpath('Downloads').glob('Enterprise Products (1)*.xlsx'))
ns = {
    'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    'rel': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'pkg': 'http://schemas.openxmlformats.org/package/2006/relationships',
}

with ZipFile(path) as workbook:
    shared = []
    if 'xl/sharedStrings.xml' in workbook.namelist():
        root = ET.fromstring(workbook.read('xl/sharedStrings.xml'))
        shared = [''.join(text.text or '' for text in item.findall('.//main:t', ns)) for item in root.findall('main:si', ns)]

    book_root = ET.fromstring(workbook.read('xl/workbook.xml'))
    rel_root = ET.fromstring(workbook.read('xl/_rels/workbook.xml.rels'))
    relationships = {item.attrib['Id']: item.attrib['Target'] for item in rel_root.findall('pkg:Relationship', ns)}
    for sheet in book_root.findall('main:sheets/main:sheet', ns):
        target = relationships[sheet.attrib[f"{{{ns['rel']}}}id"]]
        sheet_path = target.lstrip('/') if target.startswith('/') else f'xl/{target}'
        root = ET.fromstring(workbook.read(sheet_path))
        print(f"SHEET: {sheet.attrib['name']}")
        for row in root.findall('.//main:sheetData/main:row', ns):
            values = []
            for cell in row.findall('main:c', ns):
                value = cell.find('main:v', ns)
                inline = cell.find('main:is', ns)
                text = value.text if value is not None else ''
                if cell.attrib.get('t') == 's' and text:
                    text = shared[int(text)]
                elif inline is not None:
                    text = ''.join(item.text or '' for item in inline.findall('.//main:t', ns))
                values.append(text)
            if any(values):
                print(values)
