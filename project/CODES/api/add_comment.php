<?php
session_start();
require_once '../config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit();
}

$post_id = $_POST['post_id'] ?? 0;
$comment = trim($_POST['comment'] ?? '');

if (empty($comment)) {
    echo json_encode(['success' => false, 'error' => 'Comment is empty']);
    exit();
}

$user_id = $_SESSION['user_id'];

$sql = "INSERT INTO post_comments (post_id, user_id, comment) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iis", $post_id, $user_id, $comment);

if ($stmt->execute()) {
    $comment_id = $conn->insert_id;
    
    // Get comment details for response
    $comment_sql = "SELECT pc.*, e.name, e.email FROM post_comments pc 
                    JOIN echoes e ON pc.user_id = e.id 
                    WHERE pc.id = ?";
    $stmt = $conn->prepare($comment_sql);
    $stmt->bind_param("i", $comment_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $comment_data = $result->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'comment' => [
            'id' => $comment_data['id'],
            'author' => [
                'name' => $comment_data['name'],
                'avatar' => 'https://i.pravatar.cc/36?u=' . urlencode($comment_data['email'])
            ],
            'text' => $comment_data['comment'],
            'createdAt' => strtotime($comment_data['created_at']) * 1000,
            'replies' => []
        ]
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to add comment']);
}
?>