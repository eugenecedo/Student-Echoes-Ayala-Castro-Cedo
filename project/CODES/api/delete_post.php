<?php
session_start();
require_once '../config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['email']) || !isset($_POST['post_id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit();
}

$post_id = intval($_POST['post_id']);
$user_id = $_SESSION['user_id'] ?? 0;

// Check if user owns the post
$check = $conn->prepare("SELECT id FROM posts WHERE id = ? AND user_id = ?");
$check->bind_param("ii", $post_id, $user_id);
$check->execute();

if ($check->get_result()->num_rows > 0) {
    $stmt = $conn->prepare("DELETE FROM posts WHERE id = ?");
    $stmt->bind_param("i", $post_id);
    $stmt->execute();
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Not authorized']);
}
?>