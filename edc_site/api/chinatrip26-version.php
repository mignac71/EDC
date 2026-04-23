<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$root = dirname(__DIR__);
$trackedFiles = [
    $root . '/chinatrip26.html',
    $root . '/chinatrip26.webmanifest',
    $root . '/images/chinatrip26-icon.svg',
    __FILE__,
];

$hashCtx = hash_init('sha256');
foreach ($trackedFiles as $filePath) {
    if (!is_readable($filePath)) {
        continue;
    }

    hash_update($hashCtx, basename($filePath));
    hash_update($hashCtx, (string)filemtime($filePath));
    hash_update($hashCtx, (string)filesize($filePath));
}

$version = substr(hash_final($hashCtx), 0, 16);

echo json_encode([
    'version' => $version,
]);
