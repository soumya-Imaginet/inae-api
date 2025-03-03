// i18n/strings.js
const i18n = require("i18next");
const path = require("path");

i18n.init({
  lng: "en", // Default language
  fallbackLng: "en", // Fallback language
  resources: {
    en: {
      translation: require(path.join(__dirname, "en.js")), // Importing the en.js translation file
    },
  },
  interpolation: {
    escapeValue: false, // React escapes by default
  },
});

module.exports = i18n;
