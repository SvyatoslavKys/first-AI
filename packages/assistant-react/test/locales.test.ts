import {
  DEFAULT_LOCALE,
  resolveBrowserLocale
} from "../src/locales";

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function runTest(name: string, test: () => void): void {
  test();
  console.log(`✓ ${name}`);
}

runTest("detects all supported browser languages with regional tags", () => {
  assertEqual(resolveBrowserLocale(["en-US"]), "en", "English must be detected");
  assertEqual(resolveBrowserLocale(["ru-RU"]), "ru", "Russian must be detected");
  assertEqual(resolveBrowserLocale(["uk-UA"]), "uk", "Ukrainian must be detected");
  assertEqual(resolveBrowserLocale(["pl-PL"]), "pl", "Polish must be detected");
});

runTest("uses the first supported language from browser preference order", () => {
  assertEqual(
    resolveBrowserLocale(["de-DE", "pl-PL", "ru-RU"]),
    "pl",
    "The first supported browser language must win"
  );
});

runTest("accepts underscore locale notation", () => {
  assertEqual(
    resolveBrowserLocale(["uk_UA"]),
    "uk",
    "Underscore locale tags must be normalized"
  );
});

runTest("falls back to English for missing or unsupported languages", () => {
  assertEqual(resolveBrowserLocale([]), DEFAULT_LOCALE, "An empty list must use English");
  assertEqual(
    resolveBrowserLocale(["de-DE", "fr-FR"]),
    DEFAULT_LOCALE,
    "Unsupported languages must use English"
  );
});
