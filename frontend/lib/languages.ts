/**
 * Master list of languages for practitioner profiles.
 * Organized by popularity/usage frequency.
 */
export const LANGUAGES = [
  // Most common (English-speaking markets)
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  
  // European languages
  "Dutch",
  "Russian",
  "Polish",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Greek",
  "Turkish",
  "Czech",
  "Romanian",
  "Hungarian",
  
  // Asian languages
  "Mandarin Chinese",
  "Cantonese",
  "Hindi",
  "Bengali",
  "Urdu",
  "Punjabi",
  "Tamil",
  "Telugu",
  "Marathi",
  "Japanese",
  "Korean",
  "Vietnamese",
  "Thai",
  "Indonesian",
  "Malay",
  "Tagalog",
  
  // Middle Eastern & African
  "Arabic",
  "Hebrew",
  "Persian (Farsi)",
  "Swahili",
  "Amharic",
  "Afrikaans",
  
  // Other
  "Ukrainian",
  "Serbian",
  "Croatian",
  "Bulgarian",
  "Slovak",
  "Lithuanian",
  "Latvian",
  "Estonian",
  "Icelandic",
] as const;

export type Language = typeof LANGUAGES[number];
