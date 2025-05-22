import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const USER_IDENTIFIER_KEY = 'contactGainUserIdentifier';

export const getOrCreateUserIdentifier = () => {
  let identifier = localStorage.getItem(USER_IDENTIFIER_KEY);
  if (!identifier) {
    identifier = crypto.randomUUID();
    localStorage.setItem(USER_IDENTIFIER_KEY, identifier);
  }
  return identifier;
};

export const generateShortId = (length = 7) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  // Regex: Starts with +, then country code (1-3 digits), then phone number (8-15 digits). No spaces.
  const phoneRegex = /^\+[1-9]\d{0,2}\d{8,15}$/; 
  // Example: +1234567890 (1 country code, 9 number) to +123456789012345 (3 country code, 15 number)
  // The main part \d{8,15} ensures the local number part is between 8 and 15 digits.
  // The country code part \+[1-9]\d{0,2} ensures it starts with + and has 1 to 3 digits for country code.
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};
