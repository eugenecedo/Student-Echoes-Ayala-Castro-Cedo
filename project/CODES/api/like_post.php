<?php
session_start();
require_once '../config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit();
}

$post_id = $_POST['post_id'] ?? $_GET['post_id'] ?? 0;
$user_id = $_SESSION['user_id'];

// Check if already liked
$check_sql = "SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?";
$stmt = $conn->prepare($check_sql);
$stmt->bind_param("ii", $post_id, $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // Unlike
    $delete_sql = "DELETE FROM post_likes WHERE post_id = ? AND user_id = ?";
    $stmt = $conn->prepare($delete_sql);
    $stmt->bind_param("ii", $post_id, $user_id);
    $stmt->execute();
    
    // Update likes count
    $update_sql = "UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?";
    $stmt = $conn->prepare($update_sql);
    $stmt->bind_param("i", $post_id);
    $stmt->execute();
    
    echo json_encode(['success' => true, 'liked' => false]);
} else {
    // Like
    $insert_sql = "INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)";
    $stmt = $conn->prepare($insert_sql);
    $stmt->bind_param("ii", $post_id, $user_id);
    $stmt->execute();
    
    // Update likes count
    $update_sql = "UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?";
    $stmt = $conn->prepare($update_sql);
    $stmt->bind_param("i", $post_id);
    $stmt->execute();
    
    echo json_encode(['success' => true, 'liked' => true]);
}
?>