<?php
/**
 * CMS Backend for Vercel
 * Uses Vercel Blob for images and Postgres for content.json.
 */

// --- Vercel Blob Helper ---
function vercelBlobPut(array $file): ?string
{
    $token = getenv('BLOB_READ_WRITE_TOKEN');
    if (!$token) {
        return null;
    }

    $filename = basename($file['name']);
    // API v1: PUT https://blob.vercel-storage.com/<filename>
    // Requires x-api-version: 1
    $apiUrl = 'https://blob.vercel-storage.com/' . uniqid() . '-' . $filename;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_PUT, true);
    curl_setopt($ch, CURLOPT_INFILE, fopen($file['tmp_name'], 'r'));
    curl_setopt($ch, CURLOPT_INFILESIZE, filesize($file['tmp_name']));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'x-api-version: 1'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $json = json_decode($response, true);
        return $json['url'] ?? null;
    }

    return null;
}


// --- Postgres Helper (Adapting to User's Env) ---
function getPdo(): ?PDO
{
    // User provided KV_POSTGRES_URL
    $url = getenv('KV_POSTGRES_URL') ?: getenv('POSTGRES_URL');
    if (!$url)
        return null;

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
        // Log error?
        return null;
    }
}

function initDb(PDO $pdo): void
{
    // Create table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS cms_content (id INT PRIMARY KEY, json_data TEXT)");
    // Ensure row exists
    $stmt = $pdo->prepare("SELECT 1 FROM cms_content WHERE id = 1");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("INSERT INTO cms_content (id, json_data) VALUES (1, '{}')");
    }
}

function dbGet(): ?array
{
    $pdo = getPdo();
    if (!$pdo)
        return null;

    try {
        initDb($pdo); // Ensure table exists on first run
        $stmt = $pdo->query("SELECT json_data FROM cms_content WHERE id = 1");
        $json = $stmt->fetchColumn();
        return $json ? json_decode($json, true) : [];
    } catch (Exception $e) {
        return null;
    }
}

function dbSet(array $data): bool
{
    $pdo = getPdo();
    if (!$pdo)
        return false;

    try {
        $json = json_encode($data, JSON_UNESCAPED_SLASHES);
        $stmt = $pdo->prepare("UPDATE cms_content SET json_data = :json WHERE id = 1");
        $stmt->execute([':json' => $json]);
        return true;
    } catch (Exception $e) {
        return false;
    }
}


const DEFAULT_PASSWORD = 'edc_admin';
$lang = $_POST['lang'] ?? 'pl';

function t(string $pl, string $en, string $lang): string
{
    return $lang === 'en' ? $en : $pl;
}

// Auth
$hash = getenv('CMS_PASSWORD_HASH');
$plain = getenv('CMS_PASSWORD');
$passwordHash = $hash ? $hash : ($plain ? hash('sha256', $plain) : hash('sha256', DEFAULT_PASSWORD));

if (!isset($_POST['password']) || !hash_equals($passwordHash, hash('sha256', (string) $_POST['password']))) {
    http_response_code(401);
    exit(t('Błędne hasło', 'Incorrect password', $lang));
}


// Load Content logic
function loadContent(): array
{
    // 1. Try DB
    $data = dbGet();
    if ($data !== null)
        return $data;

    // 2. Fallback to local (read-only) mostly empty or default
    $localPath = __DIR__ . '/../json/content.json';
    if (file_exists($localPath)) {
        return json_decode(file_get_contents($localPath), true) ?? [];
    }

    return ['hero' => [], 'news' => []];
}

function saveContent(array $data): void
{
    if (!dbSet($data)) {
        http_response_code(500);
        exit("Error: Database save failed. Check Postgres connection.");
    }
}

function storeImage(array $file, string $lang): ?string
{
    if (!isset($file['error']) || $file['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    $url = vercelBlobPut($file);
    if ($url)
        return $url;

    http_response_code(500);
    exit(t('Nie udało się zapisać pliku (Blob Storage Error).', 'Failed to save file (Blob Storage Error).', $lang));
}


$action = $_POST['action'] ?? '';

if ($action === 'validate') {
    exit(t('Hasło poprawne.', 'Password accepted.', $lang));
}

$content = loadContent();
if (!isset($content['news']) || !is_array($content['news']))
    $content['news'] = [];
if (!isset($content['hero']) || !is_array($content['hero']))
    $content['hero'] = [];
// Additional sections init if needed to avoid warnings
if (!isset($content['mission']))
    $content['mission'] = [];
if (!isset($content['presidium']))
    $content['presidium'] = [];


if ($action === 'updateHero') {
    $title = trim($_POST['heroTitle'] ?? '');
    $subtitle = trim($_POST['heroSubtitle'] ?? '');
    if ($title === '' || $subtitle === '')
        exit(t('Uzupełnij pola.', 'Fill fields.', $lang));

    $content['hero'] = ['title' => $title, 'subtitle' => $subtitle];
    saveContent($content);
    exit(t('Zaktualizowano.', 'Updated.', $lang));
}

if ($action === 'addNews') {
    $title = trim($_POST['title'] ?? '');
    $date = trim($_POST['date'] ?? '');
    $summary = trim($_POST['summary'] ?? '');
    $alt = trim($_POST['alt'] ?? '');

    if ($title === '' || $date === '')
        exit(t('Brak danych.', 'Missing data.', $lang));

    $newsItem = [
        'title' => $title,
        'date' => $date,
        'summary' => $summary,
        'alt' => $alt,
        'image' => null,
        'gallery' => []
    ];

    if (isset($_FILES['mainImage'])) {
        $path = storeImage($_FILES['mainImage'], $lang);
        if ($path) {
            $newsItem['image'] = $path;
            $newsItem['gallery'][] = $path;
        }
    }

    if (isset($_FILES['gallery']['name'])) {
        foreach ($_FILES['gallery']['name'] as $i => $name) {
            if ($_FILES['gallery']['error'][$i] === UPLOAD_ERR_OK) {
                $file = [
                    'name' => $name,
                    'tmp_name' => $_FILES['gallery']['tmp_name'][$i],
                    'error' => $_FILES['gallery']['error'][$i]
                ];
                $path = storeImage($file, $lang);
                if ($path)
                    $newsItem['gallery'][] = $path;
            }
        }
    }

    $newsItem['gallery'] = array_values(array_unique($newsItem['gallery']));

    array_unshift($content['news'], $newsItem);
    saveContent($content);
    exit(t('Dodano.', 'Added.', $lang));
}

if ($action === 'updateSection') {
    $section = $_POST['section'] ?? '';
    if (!in_array($section, ['mission', 'presidium']))
        exit('Invalid section');

    $data = [];
    foreach ($_POST as $k => $v) {
        if (!in_array($k, ['action', 'password', 'lang', 'section']))
            $data[$k] = trim($v);
    }
    $content[$section] = $data;
    saveContent($content);
    exit(t('Zaktualizowano.', 'Updated.', $lang));
}

if ($action === 'deleteNews') {
    $index = (int) ($_POST['index'] ?? -1);
    if (isset($content['news'][$index])) {
        array_splice($content['news'], $index, 1);
        saveContent($content);
        exit(t('Usunięto.', 'Deleted.', $lang));
    }
    exit('Error');
}

if ($action === 'updateNews') {
    $index = (int) ($_POST['index'] ?? -1);
    if (!isset($content['news'][$index]))
        exit('Error');

    $item = $content['news'][$index];
    $item['title'] = $_POST['title'] ?? $item['title'];
    $item['date'] = $_POST['date'] ?? $item['date'];
    $item['summary'] = $_POST['summary'] ?? $item['summary'];
    $item['alt'] = $_POST['alt'] ?? $item['alt'];

    if (isset($_FILES['mainImage']) && $_FILES['mainImage']['size'] > 0) {
        $path = storeImage($_FILES['mainImage'], $lang);
        if ($path) {
            $item['image'] = $path;
            if (!in_array($path, $item['gallery']))
                array_unshift($item['gallery'], $path);
        }
    }
    if (isset($_FILES['gallery']['name'])) {
        foreach ($_FILES['gallery']['name'] as $i => $name) {
            if ($_FILES['gallery']['error'][$i] === UPLOAD_ERR_OK) {
                $file = ['name' => $name, 'tmp_name' => $_FILES['gallery']['tmp_name'][$i], 'error' => 0];
                $path = storeImage($file, $lang);
                if ($path)
                    $item['gallery'][] = $path;
            }
        }
    }
    $item['gallery'] = array_values(array_unique($item['gallery']));

    $content['news'][$index] = $item;
    saveContent($content);
    exit(t('Zaktualizowano.', 'Updated.', $lang));
}

http_response_code(400);
exit('Unknown action');
