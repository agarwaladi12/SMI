<?php
// Allow CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
try {
    $pdo = new PDO("mysql:host=localhost;dbname=youtube_research", "root", "root");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  } catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'DB connection failed']);
    exit;
  }

$url = $_GET['url'] ?? '';
if (!$url) {
  echo json_encode(['exists' => false]);
  exit;
}

$stmt = $pdo->prepare("SELECT tags FROM youtube_metadata WHERE url = ?");
$stmt->execute([$url]);
$video = $stmt->fetch(PDO::FETCH_ASSOC);

if ($video) {
    echo json_encode([
        'exists' => true,
        'tags' => $video['tags'] ?? ''
    ]);
} else {
    echo json_encode(['exists' => false]);
}
?>