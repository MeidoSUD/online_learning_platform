<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Users Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 24px; }
        h1 { font-size: 20px; }
        table { border-collapse: collapse; width: 100%; font-size: 11px; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
        th { background: #eee; }
        @media print { .print-button { display: none; } }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">Print / Save as PDF</button>
    <h1>Users Export</h1>
    <table>
        <tbody>{!! $htmlRows !!}</tbody>
    </table>
</body>
</html>
