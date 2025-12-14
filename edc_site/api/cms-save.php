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
// Public GET access
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $content = loadContent();
    header('Content-Type: application/json');
    echo json_encode($content);
    exit;
}

// Auth
// Auth Logic
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';
$isAuthenticated = false;

if ($username) {
    // DB Auth
    $pdo = getPdo();
    if ($pdo) {
        $stmt = $pdo->prepare("SELECT password_hash FROM cms_users WHERE username = :u");
        $stmt->execute([':u' => $username]);
        $hash = $stmt->fetchColumn();
        if ($hash && password_verify($password, $hash)) {
            $isAuthenticated = true;
        }
    }
} else {
    // Legacy Env Auth
    $envHash = getenv('CMS_PASSWORD_HASH');
    $envPlain = getenv('CMS_PASSWORD');
    $masterHash = $envHash ? $envHash : ($envPlain ? hash('sha256', $envPlain) : hash('sha256', DEFAULT_PASSWORD));
    if (hash_equals($masterHash, hash('sha256', (string) $password))) {
        $isAuthenticated = true;
    }
}

if (!$isAuthenticated) {
    http_response_code(401);
    exit(t('Błędne hasło lub użytkownik.', 'Incorrect username or password.', $lang));
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

    // 1. Try Vercel Blob
    $url = vercelBlobPut($file);
    if ($url) {
        return $url;
    }

    // 2. Fallback: Local Uploads
    $uploadDir = __DIR__ . '/../images/uploads/';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            http_response_code(500);
            exit(t('Nie udało się utworzyć lokalnego katalogu uploads.', 'Failed to create local uploads dir.', $lang));
        }
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('upload_') . '.' . $ext;
    $destination = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $destination)) {
        return 'images/uploads/' . $filename;
    }

    http_response_code(500);
    exit(t('Nie udało się zapisać pliku (Blob Storage Error i Local Error).', 'Failed to save file (Blob Storage Error & Local Error).', $lang));
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
    $title = trim($_POST['heroTitle'] ?? '');
    $subtitle = trim($_POST['heroSubtitle'] ?? '');
    $images = json_decode($_POST['heroImages'] ?? '[]', true);
    if (!is_array($images))
        $images = [];

    // Legacy/Fallback: If single image was sent but no array, could handle here, but let's stick to new structure

    if ($title === '' || $subtitle === '')
        exit(t('Uzupełnij pola.', 'Fill fields.', $lang));

    $content['hero'] = [
        'title' => $title,
        'subtitle' => $subtitle,
        'images' => $images
    ];
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
    } elseif (!empty($_POST['image_url'])) {
        $newsItem['image'] = $_POST['image_url'];
        $newsItem['gallery'][] = $_POST['image_url'];
    }

    // Generate ID
    $newsItem['id'] = uniqid('news_');

    if (isset($_FILES['gallery']['name'])) {
        $count = count($_FILES['gallery']['name']);
        for ($i = 0; $i < $count; $i++) {
            if ($_FILES['gallery']['error'][$i] === UPLOAD_ERR_OK) {
                $f = [
                    'name' => $_FILES['gallery']['name'][$i],
                    'type' => $_FILES['gallery']['type'][$i],
                    'tmp_name' => $_FILES['gallery']['tmp_name'][$i],
                    'error' => $_FILES['gallery']['error'][$i],
                    'size' => $_FILES['gallery']['size'][$i]
                ];
                $p = storeImage($f, $lang);
                if ($p)
                    $newsItem['gallery'][] = $p;
            }
        }
    }

    // Prepend to array (newest first logic, though frontend sorts)
    array_unshift($content['news'], $newsItem);
    saveContent($content);
    exit(t('Dodano pomyślnie.', 'Added successfully.', $lang));
}

if ($action === 'updateSection') {
    $section = $_POST['section'] ?? '';
    if (!in_array($section, ['mission', 'presidium']))
        exit('Invalid section');

    $data = [];
    foreach ($_POST as $k => $v) {
        if (!in_array($k, ['action', 'username', 'password', 'lang', 'section']))
            $data[$k] = trim($v);
    }

    // Handle JSON fields (e.g. mission cards)
    if (isset($_POST['cards'])) {
        $data['cards'] = json_decode($_POST['cards'], true);
    }

    $content[$section] = $data;
    saveContent($content);
    exit(t('Zaktualizowano.', 'Updated.', $lang));
}

if ($action === 'updatePresidium') {
    $members = json_decode($_POST['members'] ?? '[]', true);
    if (!is_array($members))
        exit('Error: Invalid data');
    $content['presidium'] = $members;
    saveContent($content);
    exit(t('Zaktualizowano prezydium.', 'Presidium updated.', $lang));
}

if ($action === 'updatePartners') {
    $partners = json_decode($_POST['partners'] ?? '[]', true);
    if (!is_array($partners))
        exit('Error: Invalid data');
    $content['partners'] = $partners;
    saveContent($content);
    exit(t('Zaktualizowano partnerów.', 'Partners updated.', $lang));
}

if ($action === 'updateContact') {
    $contact = [];
    $contact['name'] = $_POST['contactName'] ?? '';
    $contact['address'] = $_POST['contactAddress'] ?? '';
    $contact['phone'] = $_POST['contactPhone'] ?? '';
    $contact['email'] = $_POST['contactEmail'] ?? '';
    $content['contact'] = $contact;
    saveContent($content);
    exit(t('Zaktualizowano stopkę.', 'Footer updated.', $lang));
}

if ($action === 'updateDealers') {
    $dealers = json_decode($_POST['dealers'] ?? '{}', true);
    if (!is_array($dealers))
        exit('Error: Invalid data');
    $content['dealers'] = $dealers;
    saveContent($content);
    exit(t('Zaktualizowano dane mapy.', 'Map data updated.', $lang));
}

if ($action === 'deleteNews') {
    $id = $_POST['id'] ?? '';
    // $index = (int)($_POST['index'] ?? -1); // Optional fallback

    $foundIndex = -1;

    // 1. Try ID
    if ($id) {
        foreach ($content['news'] as $i => $item) {
            if (isset($item['id']) && $item['id'] === $id) {
                $foundIndex = $i;
                break;
            }
        }
    }

    // 2. Fallback to Index if ID failed or not provided
    if ($foundIndex === -1 && isset($_POST['index'])) {
        $idx = (int) $_POST['index'];
        if ($idx >= 0 && isset($content['news'][$idx])) {
            $foundIndex = $idx;
        }
    }

    if ($foundIndex === -1) {
        http_response_code(404);
        exit(t('Nie znaleziono wpisu (ID/Index error).', 'Item not found (ID/Index error).', $lang));
    }

    array_splice($content['news'], $foundIndex, 1);
    saveContent($content);
    exit(t('Usunięto pomyślnie.', 'Deleted successfully.', $lang));
}

if ($action === 'updateNews') {
    $id = $_POST['id'] ?? '';
    // If ID is missing, we might be editing a legacy item without ID or new item
    // But `addNews` handles creation. `updateNews` implies existing.

    $foundIndex = -1;
    foreach ($content['news'] as $i => $item) {
        if (isset($item['id']) && $item['id'] === $id) {
            $foundIndex = $i;
            break;
        }
    }

    if ($foundIndex === -1) {
        // Fallback: look for index?
        $index = (int) ($_POST['index'] ?? -1);
        if ($index >= 0 && isset($content['news'][$index])) {
            $foundIndex = $index;
            // Assign ID if missing
            if (!isset($content['news'][$index]['id'])) {
                $content['news'][$index]['id'] = uniqid('news_');
            }
        } else {
            exit('Error: Item not found');
        }
    }

    $item = &$content['news'][$foundIndex]; // Reference logic

    // Update fields...
    $item['title'] = $_POST['title'] ?? $item['title'];
    $item['date'] = $_POST['date'] ?? $item['date'];
    $item['summary'] = $_POST['summary'] ?? $item['summary'];
    $item['alt'] = $_POST['alt'] ?? $item['alt'];
    if (!empty($_POST['image_url'])) {
        $item['image'] = $_POST['image_url'];
        // Add to gallery if not present?
        if (!in_array($_POST['image_url'], $item['gallery'])) {
            $item['gallery'][] = $_POST['image_url'];
        }
    }

    // Image upload handling
    if (isset($_FILES['mainImage'])) {
        $path = storeImage($_FILES['mainImage'], $lang);
        if ($path) {
            $item['image'] = $path;
            $item['gallery'][] = $path;
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

    saveContent($content);
    exit(t('Zaktualizowano.', 'Updated.', $lang));
}

if ($action === 'toggleVisibility') {
    $id = $_POST['id'] ?? '';

    $foundIndex = -1;
    foreach ($content['news'] as $i => $item) {
        if (isset($item['id']) && $item['id'] === $id) {
            $foundIndex = $i;
            break;
        }
    }

    if ($foundIndex === -1)
        exit('Error: Item not found');

    $currentState = $content['news'][$foundIndex]['visible'] ?? true;
    $content['news'][$foundIndex]['visible'] = !$currentState;

    saveContent($content);
    exit(t('Zmieniono widoczność.', 'Visibility toggled.', $lang));
}

if ($action === 'listMedia') {
    $token = getenv('BLOB_READ_WRITE_TOKEN');
    $blobs = [];

    // 1. Fetch from Blob
    $debug = [];
    // 1. Fetch from Blob
    if ($token) {
        $ch = curl_init('https://blob.vercel-storage.com');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $token,
            'x-api-version: 1'
        ]);
        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($res === false) {
            $debug['curl_error'] = curl_error($ch);
        } else {
            $json = json_decode($res, true);
            if (isset($json['blobs'])) {
                $blobs = $json['blobs'];
            } else {
                $debug['api_response'] = $res;
                $debug['http_code'] = $httpCode;
            }
        }
        curl_close($ch);
    } else {
        $debug['error'] = 'No BLOB_READ_WRITE_TOKEN found';
    }

    // 2. Fetch from Local Files (legacy)
    $localDirs = ['../images', '../images/edc70'];
    foreach ($localDirs as $dir) {
        $files = glob(__DIR__ . "/$dir/*.{jpg,jpeg,png,gif,webp}", GLOB_BRACE);
        if ($files) {
            foreach ($files as $file) {
                // Convert absolute path to relative URL
                // __DIR__ is .../api
                // $file is .../api/../images/foo.jpg -> .../images/foo.jpg
                // We want URL relative to site root: 'images/foo.jpg'
                $relativePath = str_replace(realpath(__DIR__ . '/..') . '/', '', realpath($file));
                $blobs[] = [
                    'url' => $relativePath,
                    'pathname' => $relativePath,
                    'isLocal' => true
                ];
            }
        }
    }

    header('Content-Type: application/json');
    header('Content-Type: application/json');
    echo json_encode(['blobs' => $blobs, 'debug' => $debug]);
    exit;
}

if ($action === 'deleteMedia') {
    $url = $_POST['url'] ?? '';
    if (!$url)
        exit('Error: Missing URL');

    // Check if local
    if (strpos($url, 'blob.vercel-storage.com') === false) {
        exit(t('Nie można usunąć plików lokalnych z repozytorium.', 'Cannot delete local repository files.', $lang));
    }

    $token = getenv('BLOB_READ_WRITE_TOKEN');
    if (!$token)
        exit('Error: No token');

    // Vercel Blob Delete API: POST /delete {urls: [url]}
    // Header includes x-api-version: 1 (optional?)
    $ch = curl_init('https://blob.vercel-storage.com/delete');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['urls' => [$url]]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'x-api-version: 1'
    ]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code === 200) {
        exit(t('Usunięto.', 'Deleted.', $lang));
    } else {
        exit('Error deleting: ' . $res);
    }
}

if ($action === 'changePassword') {
    $newPass = $_POST['new_password'] ?? '';
    // $oldPass = $_POST['old_password'] ?? ''; 
    // We already verified current password via Auth block logic ($isAuthenticated is true).

    if (!$newPass) {
        http_response_code(400);
        exit(t('Brak nowego hasła.', 'Missing new password.', $lang));
    }

    // DB Update
    $pdo = getPdo();
    if ($pdo && $username) {
        $hash = password_hash($newPass, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE cms_users SET password_hash = :h WHERE username = :u");
        $stmt->execute([':h' => $hash, ':u' => $username]);

        exit(t('Hasło zmienione pomyślnie.', 'Password changed successfully.', $lang));
    } else {
        http_response_code(500);
        exit(t('Błąd: Brak dostępu do bazy lub brak nazwy użytkownika (Czy jesteś zalogowany przez ENV?).', 'Error: No DB or no username (Env auth?).', $lang));
    }
}


http_response_code(400);
exit('Unknown action');
