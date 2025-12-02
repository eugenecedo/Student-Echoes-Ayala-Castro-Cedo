<?php
session_start();
require_once 'config.php';

if (isset($_POST['register'])) {
    $name = mysqli_real_escape_string($conn, $_POST['name']);
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // Check if email exists
    $checkEmail = $conn->query("SELECT email FROM echoes WHERE email = '$email'");
    if ($checkEmail->num_rows > 0) {
        $_SESSION['register_error'] = 'Email is already registered';
        $_SESSION['active_form'] = 'register';
    } else {
        $conn->query("INSERT INTO echoes (name, email, password) VALUES ('$name', '$email', '$password')");
        $_SESSION['register_success'] = 'Registration successful! Please login.';
        $_SESSION['active_form'] = 'login';
    }
    header("Location: log in.php");
    exit();
}

if (isset($_POST['login'])) {
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $password = $_POST['password'];

    $result = $conn->query("SELECT * FROM echoes WHERE email = '$email'");
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['name'] = $user['name'];
            $_SESSION['email'] = $user['email'];

            header("Location: feed.php");
            exit();
        } else {
            $_SESSION['login_error'] = 'Incorrect email or password';
            $_SESSION['active_form'] = 'login';
            header("Location: log in.php");
            exit();
        }
    } else {
        $_SESSION['login_error'] = 'Incorrect email or password';
        $_SESSION['active_form'] = 'login';
        header("Location: log in.php");
        exit();
    }
}

// Fallback redirect
header("Location: log in.php");
exit();
?>