<?php
session_start();
require_once '../config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['email']) || !isset($_POST['post_id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit();
}

$user_id = $_SESSION['user_id'] ?? 0;
$post_id = intval($_POST['post_id']);
$action = $_POST['action'] ?? 'like';

if ($action === 'like') {
    // Check if already liked
    $check = $conn->prepare("SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?");
    $check->bind_param("ii", $user_id, $post_id);
    $check->execute();
    
    if ($check->get_result()->num_rows === 0) {
        $stmt = $conn->prepare("INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)");
        $stmt->bind_param("ii", $user_id, $post_id);
        $stmt->execute();
    }
} else {
    // Unlike
    $stmt = $conn->prepare("DELETE FROM post_likes WHERE user_id = ? AND post_id = ?");
    $stmt->bind_param("ii", $user_id, $post_id);
    $stmt->execute();
}

echo json_encode(['success' => true]);
?>