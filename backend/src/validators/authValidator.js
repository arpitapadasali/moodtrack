/**
 * Simple regex to check valid email format
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Middleware to validate registration request payload
 */
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  // Validate Name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required.');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long.');
  } else if (name.trim().length > 50) {
    errors.push('Name cannot exceed 50 characters.');
  }

  // Validate Email
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  // Validate Password
  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  } else if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Sanitize trimmed values
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
};

/**
 * Middleware to validate login request payload
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

/**
 * Middleware to validate profile update payload
 */
const validateUpdateProfile = (req, res, next) => {
  const { name, email, avatar } = req.body;
  const errors = [];

  // If name is provided
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Name cannot be empty.');
    } else if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long.');
    } else if (name.trim().length > 50) {
      errors.push('Name cannot exceed 50 characters.');
    } else {
      req.body.name = name.trim();
    }
  }

  // If email is provided
  if (email !== undefined) {
    if (typeof email !== 'string' || email.trim().length === 0) {
      errors.push('Email cannot be empty.');
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.push('Please provide a valid email address.');
    } else {
      req.body.email = email.trim().toLowerCase();
    }
  }

  // If avatar is provided
  if (avatar !== undefined && avatar !== null) {
    if (typeof avatar !== 'string') {
      errors.push('Avatar must be a string URL.');
    } else if (avatar.trim().length > 1000) {
      errors.push('Avatar URL cannot exceed 1000 characters.');
    } else {
      req.body.avatar = avatar.trim();
    }
  }

  // Ensure at least one field is provided
  if (name === undefined && email === undefined && avatar === undefined) {
    errors.push('At least one field (name, email, or avatar) must be provided to update.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Middleware to validate password change payload
 */
const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.push('Current password is required.');
  }

  if (!newPassword || typeof newPassword !== 'string') {
    errors.push('New password is required.');
  } else if (newPassword.length < 6) {
    errors.push('New password must be at least 6 characters long.');
  } else if (newPassword.length > 128) {
    errors.push('New password cannot exceed 128 characters.');
  }

  if (confirmPassword !== undefined && confirmPassword !== newPassword) {
    errors.push('New password confirmation does not match.');
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push('New password must be different from current password.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword
};
