<?php
/**
 * Migration Script V4: Add Dealers Map Data
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

$dealers = [
    "AT" => ["country" => "Austria", "audi" => 53, "vw" => 124, "vw_commercial" => 124],
    "BE" => ["country" => "Belgium", "audi" => 79, "vw" => 140, "vw_commercial" => 140],
    "BG" => ["country" => "Bulgaria", "audi" => 18, "vw" => 16, "vw_commercial" => 16],
    "HR" => ["country" => "Croatia", "audi" => 9, "vw" => 12, "vw_commercial" => 12],
    "CY" => ["country" => "Cyprus", "audi" => 0, "vw" => 0, "vw_commercial" => 0],
    "CZ" => ["country" => "Czech Republic", "audi" => 22, "vw" => 38, "vw_commercial" => 38],
    "DK" => ["country" => "Denmark", "audi" => 15, "vw" => 61, "vw_commercial" => 61],
    "EE" => ["country" => "Estonia", "audi" => 0, "vw" => 0, "vw_commercial" => 0],
    "FI" => ["country" => "Finland", "audi" => 16, "vw" => 24, "vw_commercial" => 24],
    "FR" => ["country" => "France", "audi" => 198, "vw" => 521, "vw_commercial" => 521],
    "DE" => ["country" => "Germany", "audi" => 593, "vw" => 1169, "vw_commercial" => 1169],
    "GR" => ["country" => "Greece", "audi" => 9, "vw" => 12, "vw_commercial" => 12],
    "HU" => ["country" => "Hungary", "audi" => 8, "vw" => 19, "vw_commercial" => 19],
    "IE" => ["country" => "Ireland", "audi" => 24, "vw" => 41, "vw_commercial" => 41],
    "IT" => ["country" => "Italy", "audi" => 65, "vw" => 122, "vw_commercial" => 122],
    "LV" => ["country" => "Latvia", "audi" => 0, "vw" => 0, "vw_commercial" => 0],
    "LT" => ["country" => "Lithuania", "audi" => 4, "vw" => 7, "vw_commercial" => 7],
    "LU" => ["country" => "Luxembourg", "audi" => 8, "vw" => 15, "vw_commercial" => 15],
    "MT" => ["country" => "Malta", "audi" => 0, "vw" => 0, "vw_commercial" => 0],
    "NL" => ["country" => "Netherlands", "audi" => 25, "vw" => 29, "vw_commercial" => 29],
    "PL" => ["country" => "Poland", "audi" => 39, "vw" => 67, "vw_commercial" => 67],
    "PT" => ["country" => "Portugal", "audi" => 36, "vw" => 42, "vw_commercial" => 42],
    "RO" => ["country" => "Romania", "audi" => 6, "vw" => 5, "vw_commercial" => 5],
    "SK" => ["country" => "Slovakia", "audi" => 11, "vw" => 17, "vw_commercial" => 17],
    "SI" => ["country" => "Slovenia", "audi" => 13, "vw" => 24, "vw_commercial" => 24],
    "ES" => ["country" => "Spain", "audi" => 56, "vw" => 53, "vw_commercial" => 53],
    "SE" => ["country" => "Sweden", "audi" => 75, "vw" => 91, "vw_commercial" => 91],
    "NO" => ["country" => "Norway", "audi" => 32, "vw" => 61, "vw_commercial" => 61],
    "CH" => ["country" => "Switzerland", "audi" => 102, "vw" => 175, "vw_commercial" => 175],
    "GB" => ["country" => "United Kingdom", "audi" => 125, "vw" => 160, "vw_commercial" => 160]
];

$pdo = getPdo();
$stmt = $pdo->query("SELECT json_data FROM cms_content WHERE id = 1");
$json = $stmt->fetchColumn();
$data = $json ? json_decode($json, true) : [];

if (!$data)
    die('No data found');

if (!isset($data['dealers'])) {
    $data['dealers'] = $dealers;
    $stmt = $pdo->prepare("UPDATE cms_content SET json_data = :json WHERE id = 1");
    $stmt->execute([':json' => json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)]);
    echo "Migration V4 Complete: Dealers data added.";
} else {
    echo "Dealers data already exists.";
}
