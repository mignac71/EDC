<?php
/**
 * ONE-OFF RESTORE SCRIPT
 * Usage: Visit this file in browser to reset DB content to match local content.json
 */

// Copy-paste DB helper from cms-save.php for standalone execution
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

$localPath = __DIR__ . '/../json/content.json';
if (!file_exists($localPath)) {
    die("Local content.json not found at $localPath");
}

$json = file_get_contents($localPath);
$data = json_decode($json, true);

if (!$data) {
    die("Invalid JSON in content.json");
}

$pdo = getPdo();
// Create table if missing
$pdo->exec("CREATE TABLE IF NOT EXISTS cms_content (id INT PRIMARY KEY, json_data TEXT)");

// Upsert
$stmt = $pdo->prepare("SELECT 1 FROM cms_content WHERE id = 1");
$stmt->execute();
if ($stmt->fetch()) {
    $stmt = $pdo->prepare("UPDATE cms_content SET json_data = :json WHERE id = 1");
} else {
    $stmt = $pdo->prepare("INSERT INTO cms_content (id, json_data) VALUES (1, :json)");
}

$stmt->execute([':json' => $json]); // Save original raw JSON formatting or minified? Local file uses pretty print.

echo "Restored successfully! Content from json/content.json is now in Postgres.";
