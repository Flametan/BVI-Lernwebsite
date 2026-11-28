# Klausur-Werkstatt (Rust + WebAssembly)

Übungsklausuren zum Bearbeiten: Szene lesen, Aufgaben schreiben (automatisch gespeichert),
Timer, Selbstbewertung der Punkte, Musterlösungen ein- und ausblenden, Wissen aus der
Lern-App in einer Seitenleiste nachschlagen.

## Bauen

    rustup target add wasm32-unknown-unknown
    cargo install wasm-bindgen-cli --version 0.2.100 --locked
    cargo build --release --target wasm32-unknown-unknown
    wasm-bindgen --target web --no-typescript --out-dir www/pkg target/wasm32-unknown-unknown/release/klausur_app.wasm

Danach `www/` mit einem beliebigen Webserver ausliefern (z. B. `python3 -m http.server` in `www/`).
Das fertig gebaute `www/pkg` liegt im Repo, zum Benutzen genügt also der Webserver.

## Neue Klausur-Sammlung (VAk, FeuAK, IdF)

1. JSON nach dem Muster von `content/ibk.json` anlegen (`klausuren` mit `items`, `wissen`).
2. In `src/lib.rs` die Datei in `FAECHER` eintragen, neu bauen.
