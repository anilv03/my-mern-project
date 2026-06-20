export const validateEmail = (email) => {
  const re = /^\S+@\S+\.\S+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  return null;
};

export const validatePhone = (phone) => {
  const re = /^[+]?[\d\s()-]{10,15}$/;
  return re.test(phone);
};

export const validatePrice = (price) => {
  return !isNaN(price) && Number(price) >= 0;
};

export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

export const loginSchema = {
  email: { required: true, pattern: /^\S+@\S+\.\S+$/ },
  password: { required: true, minLength: 8 },
};

export const registerSchema = {
  name: { required: true, minLength: 2 },
  email: { required: true, pattern: /^\S+@\S+\.\S+$/ },
  password: { required: true, minLength: 8 },
  confirmPassword: { required: true, matchField: 'password' },
  phone: { required: false, pattern: /^[+]?[\d\s()-]{10,15}$/ },
};
