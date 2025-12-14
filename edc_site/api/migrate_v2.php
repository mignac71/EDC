<?php
/**
 * Migration Script V2
 * Adds Presidium, Partners, and Contact sections to existing content.json in DB.
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

if (!$data) {
    echo "Warning: No existing data found. Starting fresh.<br>";
    $data = [];
}

// 1. Presidium Data
if (empty($data['presidium'])) {
    $data['presidium'] = [
        ["name" => "Michal Ignaszak", "role" => "president", "country" => "Poland", "image" => "images/michal_ignaszak.jpeg"],
        ["name" => "Peter Picca", "role" => "vicePresident", "country" => "Switzerland", "image" => "images/peter_picca.jpeg"],
        ["name" => "Manfred Dalceggio", "role" => "vicePresident", "country" => "Italy", "image" => "images/manfred_dalceggio.jpeg"],
        ["name" => "Stefan Hutschinski", "role" => "vicePresident", "country" => "Austria", "image" => "images/stefan_hutschinski.jpeg"],
        ["name" => "Martin Kuhn", "role" => "managingDirector", "country" => "Germany", "image" => "images/martin_kuhn.jpeg"]
    ];
    echo "Added Presidium data.<br>";
}

// 2. Partners Data
if (empty($data['partners'])) {
    $data['partners'] = [
        "images/partner_wurth.png",
        "images/partner_vwfs.png",
        "images/partner_castrol.png",
        "images/partner_aufinity.png"
    ];
    echo "Added Partners data.<br>";
}

// 3. Contact Data
if (empty($data['contact'])) {
    $data['contact'] = [
        "name" => "European Dealer Council Volkswagen Group e.V.",
        "address" => "Kollberg 9 | 30916 Isernhagen | Germany",
        "phone" => "+49 (0)5136 898 6635",
        "email" => "info@dealercouncil.eu"
    ];
    echo "Added Contact data.<br>";
}

// Save back
$stmt = $pdo->prepare("UPDATE cms_content SET json_data = :json WHERE id = 1");
$stmt->execute([':json' => json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)]);

echo "Migration V2 Complete! Database updated.";
