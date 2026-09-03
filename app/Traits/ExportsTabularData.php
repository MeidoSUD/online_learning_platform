<?php

namespace App\Traits;

trait ExportsTabularData
{
    protected function xlsxResponse(array $headers, array $rows, string $filename)
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'report-export-');
        $zip = new \ZipArchive();
        $zip->open($tempFile, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);

        $sheetRows = collect([$headers, ...$rows])->map(function (array $row, int $rowIndex) {
            $cells = collect($row)->map(function ($value, int $columnIndex) use ($rowIndex) {
                $number = $columnIndex + 1;
                $column = '';
                while ($number > 0) {
                    $number--;
                    $column = chr(65 + ($number % 26)) . $column;
                    $number = intdiv($number, 26);
                }

                return '<c r="' . $column . ($rowIndex + 1) . '" t="inlineStr"><is><t>' . e((string) $value) . '</t></is></c>';
            })->implode('');

            return '<row r="' . ($rowIndex + 1) . '">' . $cells . '</row>';
        })->implode('');

        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
        $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets></workbook>');
        $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
        $zip->addFromString('xl/worksheets/sheet1.xml', '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' . $sheetRows . '</sheetData></worksheet>');
        $zip->close();

        return response()->download($tempFile, $filename . '.xlsx')->deleteFileAfterSend(true);
    }

    protected function pdfResponse(array $headers, array $rows, string $filename)
    {
        $htmlRows = collect([$headers, ...$rows])->map(function (array $row) {
            return '<tr>' . collect($row)->map(fn ($cell) => '<td>' . e((string) $cell) . '</td>')->implode('') . '</tr>';
        })->implode('');

        $html = '<!doctype html><html><head><meta charset="utf-8"><title>' . e($filename) . '</title><style>body{font-family:Arial,sans-serif;margin:24px}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#eee}</style></head><body><h1>' . e($filename) . '</h1><table><thead>' . $htmlRows . '</thead></table><script>window.onload=function(){window.print()}</script></body></html>';

        return response($html)->header('Content-Type', 'text/html')->header('Content-Disposition', 'inline; filename="' . $filename . '.html"');
    }
}
