<?php
const PASSWORD_HASH = '37ba3d76293846ac3d3314714ef3a4438450b9c5ff48ab0c0252af9e2efe5285';
const CONTENT_PATH = __DIR__ . '/json/content.json';
const UPLOAD_DIR = __DIR__ . '/images/uploads/';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Metoda niedozwolona');
}

$lang = $_POST['lang'] ?? 'pl';

function t(string $pl, string $en, string $lang): string {
    return $lang === 'en' ? $en : $pl;
}

if (!isset($_POST['password']) || $_POST['password'] !== PASSWORD_HASH) {
    http_response_code(401);
    exit(t('Błędne hasło', 'Incorrect password', $lang));
}

if (!is_dir(UPLOAD_DIR) && !mkdir(UPLOAD_DIR, 0775, true)) {
    http_response_code(500);
    exit(t('Nie udało się przygotować katalogu na pliki.', 'Could not prepare upload directory.', $lang));
}

function loadContent(): array {
    if (!file_exists(CONTENT_PATH)) {
        return ['hero' => [], 'news' => []];
    }
    $json = file_get_contents(CONTENT_PATH);
    $data = json_decode($json, true);
    if (!is_array($data)) {
        return ['hero' => [], 'news' => []];
    }
    if (!isset($data['news']) || !is_array($data['news'])) {
        $data['news'] = [];
    }
    return $data;
}

function saveContent(array $data): void {
    file_put_contents(CONTENT_PATH, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

function storeImage(array $file, string $lang): ?string {
    if (!isset($file['error']) || $file['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        exit(t('Błąd podczas przesyłania pliku.', 'Error while uploading file.', $lang));
    }

    $allowed = ['jpg', 'jpeg', 'png', 'gif'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed)) {
        http_response_code(400);
        exit(t('Niedozwolony format pliku.', 'Unsupported file type.', $lang));
    }

    $filename = uniqid('upload_', true) . '.' . $ext;
    $targetPath = UPLOAD_DIR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        http_response_code(500);
        exit(t('Nie udało się zapisać pliku.', 'Failed to save file.', $lang));
    }

    $info = getimagesize($targetPath);
    if ($info && $info[0] > 1600) {
        [$width, $height] = $info;
        $ratio = 1600 / $width;
        $newWidth = 1600;
        $newHeight = (int)($height * $ratio);

        switch ($ext) {
            case 'jpg':
            case 'jpeg':
                $src = imagecreatefromjpeg($targetPath);
                break;
            case 'png':
                $src = imagecreatefrompng($targetPath);
                break;
            case 'gif':
                $src = imagecreatefromgif($targetPath);
                break;
            default:
                $src = null;
        }

        if ($src) {
            $dst = imagecreatetruecolor($newWidth, $newHeight);
            imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

            switch ($ext) {
                case 'jpg':
                case 'jpeg':
                    imagejpeg($dst, $targetPath, 90);
                    break;
                case 'png':
                    imagepng($dst, $targetPath);
                    break;
                case 'gif':
                    imagegif($dst, $targetPath);
                    break;
            }

            imagedestroy($src);
            imagedestroy($dst);
        }
    }

    return 'images/uploads/' . $filename;
}

$action = $_POST['action'] ?? '';
$content = loadContent();

if ($action === 'updateHero') {
    $title = trim($_POST['heroTitle'] ?? '');
    $subtitle = trim($_POST['heroSubtitle'] ?? '');

    if ($title === '' || $subtitle === '') {
        http_response_code(400);
        exit(t('Uzupełnij tytuł i podtytuł.', 'Please fill in title and subtitle.', $lang));
    }

    $content['hero'] = [
        'title' => $title,
        'subtitle' => $subtitle,
    ];

    saveContent($content);
    exit(t('Nagłówek został zaktualizowany.', 'Hero content updated.', $lang));
}

if ($action === 'addNews') {
    $title = trim($_POST['title'] ?? '');
    $date = trim($_POST['date'] ?? '');
    $summary = trim($_POST['summary'] ?? '');
    $alt = trim($_POST['alt'] ?? '');

    if ($title === '' || $date === '' || $alt === '') {
        http_response_code(400);
        exit(t('Tytuł, data i tekst alternatywny są wymagane.', 'Title, date and alternative text are required.', $lang));
    }

    $newsItem = [
        'title' => $title,
        'date' => $date,
        'summary' => $summary,
        'alt' => $alt,
        'image' => null,
        'gallery' => [],
    ];

    if (isset($_FILES['mainImage'])) {
        $path = storeImage($_FILES['mainImage'], $lang);
        if ($path) {
            $newsItem['image'] = $path;
            $newsItem['gallery'][] = $path;
        }
    }

    if (isset($_FILES['gallery']) && is_array($_FILES['gallery']['name'])) {
        foreach ($_FILES['gallery']['name'] as $index => $name) {
            $file = [
                'name' => $name,
                'type' => $_FILES['gallery']['type'][$index],
                'tmp_name' => $_FILES['gallery']['tmp_name'][$index],
                'error' => $_FILES['gallery']['error'][$index],
                'size' => $_FILES['gallery']['size'][$index],
            ];
            $path = storeImage($file, $lang);
            if ($path) {
                $newsItem['gallery'][] = $path;
            }
        }
    }

    if (!$newsItem['image']) {
        http_response_code(400);
        exit(t('Dodaj główną grafikę dla aktualności.', 'Add a main image for the news item.', $lang));
    }

    $newsItem['gallery'] = array_values(array_unique($newsItem['gallery']));

    array_unshift($content['news'], $newsItem);
    saveContent($content);
    exit(t('Aktualność została dodana.', 'News item added.', $lang));
}

http_response_code(400);
exit(t('Nieznana akcja.', 'Unknown action.', $lang));
