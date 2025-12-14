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
        // Create table if not exists (should exist)
        $pdo->exec("CREATE TABLE IF NOT EXISTS cms_content (
            id SERIAL PRIMARY KEY,
            key VARCHAR(50) UNIQUE NOT NULL,
            data JSONB
        )");

        $stmt = $pdo->prepare("SELECT data FROM cms_content WHERE key = 'site_data'");
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? json_decode($row['data'], true) : [];
    } catch (Exception $e) {
        return [];
    }
}

function saveContent($pdo, $data)
{
    if (!$pdo)
        return;
    $json = json_encode($data);
    $stmt = $pdo->prepare("INSERT INTO cms_content (key, data) VALUES ('site_data', :data) 
                          ON CONFLICT (key) DO UPDATE SET data = :data");
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