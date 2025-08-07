// Enhanced security validation utilities

export const sanitizeInput = (value: string): string => {
  return value
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/['"`;]/g, "") // Remove potential SQL injection chars
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/data:/gi, "") // Remove data: protocol
    .substring(0, 1000) // Limit length
    .replace(/^\s+|\s+$/g, '') // Only trim leading/trailing spaces, preserve internal spaces
    .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
};

export const validateEmail = (email: string): string => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!email.trim()) {
    return "Email é obrigatório";
  }
  
  if (email.length > 320) { // RFC 5321 limit
    return "Email muito longo";
  }
  
  if (!emailRegex.test(email)) {
    return "Email inválido";
  }

  // Check for common malicious patterns
  const maliciousPatterns = [
    /javascript:/i,
    /data:/i,
    /<script/i,
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(email)) {
      return "Email contém caracteres inválidos";
    }
  }
  
  return "";
};

export const validatePassword = (password: string): string => {
  if (!password) {
    return "Senha é obrigatória";
  }

  if (password.length < 8) {
    return "Senha deve ter pelo menos 8 caracteres";
  }

  if (password.length > 128) {
    return "Senha muito longa (máximo 128 caracteres)";
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return "Senha deve conter pelo menos uma letra minúscula";
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return "Senha deve conter pelo menos uma letra maiúscula";
  }

  if (!/(?=.*\d)/.test(password)) {
    return "Senha deve conter pelo menos um número";
  }

  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?])/.test(password)) {
    return "Senha deve conter pelo menos um caractere especial";
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', '12345678', 'qwerty123', 'abc123456', 'password123',
    'admin123', 'user1234', 'test1234', '123456789', 'welcome123'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    return "Senha muito comum, escolha uma senha mais segura";
  }

  // Check for repeated characters (more than 3 in a row)
  if (/(.)\1{3,}/.test(password)) {
    return "Senha não pode conter mais de 3 caracteres repetidos seguidos";
  }

  return "";
};

export const validateName = (name: string, fieldName: string): string => {
  if (!name.trim()) {
    return `${fieldName} é obrigatório`;
  }

  if (name.length < 2) {
    return `${fieldName} deve ter pelo menos 2 caracteres`;
  }

  if (name.length > 50) {
    return `${fieldName} muito longo (máximo 50 caracteres)`;
  }

  // Allow only letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(name)) {
    return `${fieldName} contém caracteres inválidos`;
  }

  return "";
};

export const validateOrganization = (orgName: string): string => {
  if (!orgName.trim()) {
    return "Nome da organização é obrigatório";
  }

  if (orgName.length < 2) {
    return "Nome da organização deve ter pelo menos 2 caracteres";
  }

  if (orgName.length > 100) {
    return "Nome da organização muito longo (máximo 100 caracteres)";
  }

  // Allow letters, numbers, spaces, and common business characters
  if (!/^[a-zA-ZÀ-ÿ0-9\s&.,\-()]+$/.test(orgName)) {
    return "Nome da organização contém caracteres inválidos";
  }

  return "";
};

// Content Security Policy helpers
export const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

// Rate limiting helpers
export const createRateLimiter = (maxAttempts: number, windowMs: number) => {
  const attempts = new Map<string, number[]>();

  return (identifier: string): boolean => {
    const now = Date.now();
    const userAttempts = attempts.get(identifier) || [];
    
    // Remove expired attempts
    const validAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false; // Rate limited
    }

    validAttempts.push(now);
    attempts.set(identifier, validAttempts);
    
    return true; // Allowed
  };
};