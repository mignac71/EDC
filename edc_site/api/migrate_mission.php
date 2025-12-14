<?php
// api/migrate_mission.php
header('Content-Type: text/plain');

function getPdo()
{
    $url = getenv('KV_POSTGRES_URL') ?: getenv('POSTGRES_URL');
    if (!$url)
        return null;
    $dbopts = parse_url($url);
    $dsn = 'pgsql:host=' . $dbopts['host'] . ';port=' . ($dbopts['port'] ?? 5432) . ';dbname=' . ltrim($dbopts['path'], '/');
    try {
        $pdo = new PDO($dsn, $dbopts['user'], $dbopts['pass']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        return null;
    }
}

function loadContent($pdo)
{
    if (!$pdo)
        return [];
    try {
        // Create table if not exists (matching cms-save.php schema)
        $pdo->exec("CREATE TABLE IF NOT EXISTS cms_content (id INT PRIMARY KEY, json_data TEXT)");

        // Ensure row exists
        $stmt = $pdo->prepare("SELECT 1 FROM cms_content WHERE id = 1");
        $stmt->execute();
        if (!$stmt->fetch()) {
            $pdo->exec("INSERT INTO cms_content (id, json_data) VALUES (1, '{}')");
        }

        $stmt = $pdo->prepare("SELECT json_data FROM cms_content WHERE id = 1");
        $stmt->execute();
        $json = $stmt->fetchColumn();
        return $json ? json_decode($json, true) : [];
    } catch (Exception $e) {
        return [];
    }
}

function saveContent($pdo, $data)
{
    if (!$pdo)
        return;
    $json = json_encode($data);
    $stmt = $pdo->prepare("UPDATE cms_content SET json_data = :data WHERE id = 1");
    $stmt->execute([':data' => $json]);
}

$pdo = getPdo();
if (!$pdo)
    exit("Error: No Database Connection");

$content = loadContent($pdo);
if (!isset($content['mission']))
    $content['mission'] = [];

// Define static cards
$cards = [
    ['title' => 'Founding', 'text' => 'Founded on March 21st, 1991, in Hanover/Germany. Open for each national Volkswagen and/or Audi Dealer Association from European countries.'],
    ['title' => 'Members', 'text' => 'The association is a community of national Dealer Councils, which represent 21 European countries.'],
    ['title' => 'Organization', 'text' => 'The highest authority of the association is the partner assembly, which consists of the delegates of the partner countries.'],
    ['title' => 'Political Body', 'text' => 'Bodies are the presidium consisting of the president and four vice‑presidents, as well as the managing director.'],
    ['title' => 'Community', 'text' => 'The association is the official representative body of the trade organizations of the Group.'],
    ['title' => 'Tasks', 'text' => 'First and foremost, we see ourselves as a platform for the exchange between retailers, manufacturers, brands and national group distributors and importers.']
];

$content['mission']['cards'] = $cards;

saveContent($pdo, $content);

echo "Mission Cards Migrated Successfully to Array format.";
?>