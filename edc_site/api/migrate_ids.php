<?php
/**
 * Migration Script V3: Add IDs to News Items
 */

function getPdo(): ?PDO
{
    $url = getenv('KV_POSTGRES_URL') ?: getenv('POSTGRES_URL');
    if (!$url)
        die('No DB URL');

    $db = parse_url($url);
    $dsn = sprintf(
        "pgsql:host=%s;port=%s;user=%s;password=%s;dbname=%s",
        $db['host'] ?? 'localhost',
        $db['port'] ?? '5432',
        $db['user'] ?? '',
        $db['pass'] ?? '',
        ltrim($db['path'] ?? '', "/")
    );

    try {
        $pdo = new PDO($dsn);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        die('DB Connection Failed: ' . $e->getMessage());
    }
}

$pdo = getPdo();
$stmt = $pdo->query("SELECT json_data FROM cms_content WHERE id = 1");
$json = $stmt->fetchColumn();
$data = $json ? json_decode($json, true) : [];

if (!$data)
    die('No data found');

$modified = false;
if (isset($data['news']) && is_array($data['news'])) {
    foreach ($data['news'] as &$item) {
        if (!isset($item['id'])) {
            $item['id'] = uniqid('news_');
            $modified = true;
        }
    }
}

if ($modified) {
    $stmt = $pdo->prepare("UPDATE cms_content SET json_data = :json WHERE id = 1");
    $stmt->execute([':json' => json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)]);
    echo "Migration V3 Complete: IDs added to news items.";
} else {
    echo "No changes needed (IDs already exist).";
}
