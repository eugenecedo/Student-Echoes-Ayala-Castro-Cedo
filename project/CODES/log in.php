<?php
session_start();

$errors = [
  'login' => $_SESSION['login_error'] ??'',
  'register' => $_SESSION['register_error']??''
];

$success = $_SESSION['register_success'] ?? '';
$activeform = $_SESSION['active_form'] ??'login';

session_unset();

function showError($error) {
    return !empty($error) ? "<p class='error-message'>$error</p>" : '';
}

function showSuccess($message) {
    return !empty($message) ? "<p class='success-message'>$message</p>" : '';
}

function isActiveForm($formName, $activeForm) {
    return $formName === $activeForm ? 'active' : '';
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Login • Student Portal</title>
      <link rel="stylesheet" href="log in.css" />
      <style>
          .success-message {
              padding: 12px;
              background: #d4edda;
              border-radius: 6px;
              font-size: 16px;
              color: #155724;
              text-align: center;
              margin-bottom: 20px;
              border: 1px solid #c3e6cb;
          }
      </style>
</head>
<body>
  <div class="container">
    <div class="form-box <?= isActiveForm('login', $activeForm); ?>" id="login-form">
      <form action="login_register.php" method="post">
          <h2>Login</h2>
          <?=showError($errors['login']); ?>
          <?=showSuccess($success); ?>
          <input type="email" name="email" placeholder="Email" required>
          <input type="password" name="password" placeholder="Password" required>
          <button type="submit" name="login">Login</button>
          <p>Don't have an account? <a href="#" onclick="showForm('register-form')">Register</a></p>
      </form>
    </div>

    <div class="form-box <?= isActiveForm('register', $activeform); ?>" id="register-form">
      <form action="login_register.php" method="post">
          <h2>Register</h2>
          <?=showError($errors['register']); ?>
          <input type="text" name="name" placeholder="Name" required>
          <input type="email" name="email" placeholder="Email" required>
          <input type="password" name="password" placeholder="Password" required>
          <button type="submit" name="register">Register</button>
          <p>Already have an account? <a href="#" onclick="showForm('login-form')">Login</a></p>
      </form>
    </div>
  </div>
  <script src="login.js"></script>
  <script>
      // Auto-show the correct form based on PHP
      document.addEventListener('DOMContentLoaded', function() {
          const activeForm = '<?php echo $activeform; ?>';
          if (activeForm === 'register') {
              showForm('register-form');
          } else {
              showForm('login-form');
          }
      });
  </script>
</body>
</html>