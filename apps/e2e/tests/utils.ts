/**
 * Generates a random password of at least 6 characters
 * @param {number} length - Length of password (minimum 6)
 * @returns {string} Random password
 */
export function generateRandomPassword(length = 10) {
    // Ensure minimum length of 6
    const passwordLength = Math.max(6, length);

    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';

    // Combine all character sets
    const allChars = upperChars + lowerChars + numbers + specialChars;

    let password = '';

    // Ensure at least one character from each set for complexity
    password += upperChars.charAt(Math.floor(Math.random() * upperChars.length));
    password += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

    // Fill the rest of the password
    for (let i = 4; i < passwordLength; i++) {
        const randomIndex = Math.floor(Math.random() * allChars.length);
        password += allChars.charAt(randomIndex);
    }

    // Shuffle the password characters to avoid predictable pattern
    return password.split('').sort(() => 0.5 - Math.random()).join('');
}