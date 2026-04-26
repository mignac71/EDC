<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

function out($code, $payload) {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$url = 'https://www.flightaware.com/live/flight/CCA1379';
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 12,
    CURLOPT_HTTPHEADER => ['Accept-Language: en-US,en;q=0.9'],
    CURLOPT_USERAGENT => 'Mozilla/5.0',
]);
$html = curl_exec($ch);
$statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($html === false || $statusCode >= 400) {
    out(502, ['ok' => false, 'error' => 'upstream_unreachable']);
}

if (!preg_match('/var\s+trackpollBootstrap\s*=\s*(\{.*\});<\/script>/sU', $html, $m)) {
    out(502, ['ok' => false, 'error' => 'bootstrap_not_found']);
}

$data = json_decode($m[1], true);
if (!is_array($data)) {
    out(502, ['ok' => false, 'error' => 'invalid_bootstrap_json']);
}

function normalizeGate($gate) {
    $gate = trim((string)$gate);
    if ($gate === '') {
        return null;
    }

    if (preg_match('/^([A-Za-z])(\d)$/', $gate, $matches)) {
        return strtoupper($matches[1]) . '0' . $matches[2];
    }

    return strtoupper($gate);
}

$flightData = null;
if (isset($data['flights']) && is_array($data['flights']) && count($data['flights']) > 0) {
    foreach ($data['flights'] as $candidate) {
        if (!is_array($candidate)) {
            continue;
        }

        $displayIdent = strtoupper(trim((string)($candidate['displayIdent'] ?? $candidate['ident'] ?? '')));
        if ($displayIdent === 'CCA1379' || $displayIdent === 'CA1379') {
            $flightData = $candidate;
            break;
        }

        if ($flightData === null) {
            $flightData = $candidate;
        }
    }
}

if ($flightData === null) {
    $flightData = $data;
}

$origin = (isset($flightData['origin']) && is_array($flightData['origin'])) ? $flightData['origin'] : [];
$destination = (isset($flightData['destination']) && is_array($flightData['destination'])) ? $flightData['destination'] : [];
$takeoffTimes = (isset($flightData['takeoffTimes']) && is_array($flightData['takeoffTimes'])) ? $flightData['takeoffTimes'] : [];
$depDelayMin = null;
if (isset($takeoffTimes['estimated'], $takeoffTimes['scheduled']) && is_numeric($takeoffTimes['estimated']) && is_numeric($takeoffTimes['scheduled'])) {
    $depDelayMin = (int) floor(((int)$takeoffTimes['estimated'] - (int)$takeoffTimes['scheduled']) / 60);
}

$status = trim((string)($flightData['flightStatus'] ?? ''));
if ($status === '') {
    $status = 'scheduled';
}

out(200, [
    'ok' => true,
    'fetched_at_utc' => gmdate('c'),
    'source' => $url,
    'flight' => [
        'number' => 'CA1379',
        'status' => $status,
        'departure_gate' => normalizeGate($origin['gate'] ?? null),
        'departure_terminal' => $origin['terminal'] ?? null,
        'arrival_gate' => normalizeGate($destination['gate'] ?? null),
        'arrival_terminal' => $destination['terminal'] ?? null,
        'departure_delay_min' => $depDelayMin,
    ],
]);
