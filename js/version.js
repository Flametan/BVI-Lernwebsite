const APP_VERSION = '3.3.2';
// Angezeigte Version: 3.3, ab 30.11.2026 3.3.1, ab 31.12.2026 3.3.2 (monatlich eine Stelle weiter). APP_VERSION oben zählt intern weiter (Cache, Update-Hinweis) und darf nicht festgehalten werden, sonst kommen keine Updates an.
const APP_VERSION_ANZEIGE = (() => { const d = new Date().toISOString().slice(0, 10); return d >= '2026-12-31' ? '3.3.2' : d >= '2026-11-30' ? '3.3.1' : '3.3'; })();
// Mindest-Stand der Android-App (APK_LEVEL in MainActivity.kt). Nur erhöhen, wenn die App Neues in android/ braucht: dann erscheint im Android-App ein Hinweis mit Download.
const APK_MIN = 0;
