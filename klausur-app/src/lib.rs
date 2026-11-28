//! Klausur-App: Übungsklausuren zum Bearbeiten.
//! Jede Klausur-Sammlung (Fach) ist eine JSON-Datei in `content/`. Neue Fächer
//! (VAk, FeuAK, IdF) werden dort abgelegt und unten in `FAECHER` eingetragen.

use serde::Deserialize;
use std::cell::RefCell;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{Document, Element, HtmlInputElement, HtmlTextAreaElement, Storage};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = ["navigator", "clipboard"], js_name = writeText, catch)]
    fn clip_write(s: &str) -> Result<JsValue, JsValue>;
}

const FAECHER: &[&str] = &[include_str!("../content/ibk.json")];

#[derive(Deserialize)]
struct Item {
    kind: String,
    title: String,
    points: u32,
    html: String,
}
#[derive(Deserialize)]
struct Klausur {
    id: String,
    title: String,
    minutes: u32,
    items: Vec<Item>,
}
#[derive(Deserialize)]
struct Wissen {
    title: String,
    html: String,
}
#[derive(Deserialize)]
struct Fach {
    id: String,
    name: String,
    sub: String,
    klausuren: Vec<Klausur>,
    wissen: Vec<Wissen>,
}

#[derive(Clone, Copy, PartialEq)]
enum View {
    Home,
    Klausur(usize, usize),
}

struct State {
    faecher: Vec<Fach>,
    view: View,
    panel: bool,
    wissen: usize,
    sol: bool,
    /// Startzeitpunkt des laufenden Timers in ms (performance.now/Date.now)
    running: Option<f64>,
}

thread_local! {
    static ST: RefCell<Option<State>> = const { RefCell::new(None) };
}

fn doc() -> Document {
    web_sys::window().unwrap().document().unwrap()
}
fn store() -> Option<Storage> {
    web_sys::window().and_then(|w| w.local_storage().ok().flatten())
}
fn get(k: &str) -> Option<String> {
    store().and_then(|s| s.get_item(k).ok().flatten())
}
fn set(k: &str, v: &str) {
    if let Some(s) = store() {
        let _ = s.set_item(k, v);
    }
}
fn now() -> f64 {
    js_sys_now()
}
fn js_sys_now() -> f64 {
    web_sys::window().unwrap().performance().map(|p| p.time_origin() + p.now()).unwrap_or(0.0)
}
fn esc(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}
fn with<R>(f: impl FnOnce(&mut State) -> R) -> R {
    ST.with(|s| f(s.borrow_mut().as_mut().expect("Zustand fehlt")))
}

fn key_ans(f: &str, k: &str, i: usize) -> String {
    format!("ka|{f}|{k}|{i}")
}
fn key_pts(f: &str, k: &str, i: usize) -> String {
    format!("kp|{f}|{k}|{i}")
}
fn key_time(f: &str, k: &str) -> String {
    format!("kt|{f}|{k}")
}
fn key_run(f: &str, k: &str) -> String {
    format!("kr|{f}|{k}")
}

fn elapsed_ms(st: &State, f: &Fach, k: &Klausur) -> f64 {
    let base: f64 = get(&key_time(&f.id, &k.id)).and_then(|v| v.parse().ok()).unwrap_or(0.0);
    base + st.running.map(|t| now() - t).unwrap_or(0.0)
}

fn fmt_time(ms: f64) -> String {
    let s = (ms.max(0.0) / 1000.0) as i64;
    format!("{}:{:02}:{:02}", s / 3600, (s % 3600) / 60, s % 60)
}

fn render() {
    // Ein laufender Timer überlebt das Neuladen der Seite
    with(|st| {
        if let (View::Klausur(fi, ki), None) = (st.view, st.running) {
            if let Some(t) = get(&key_run(&st.faecher[fi].id, &st.faecher[fi].klausuren[ki].id)).and_then(|v| v.parse::<f64>().ok()) {
                st.running = Some(t);
            }
        }
    });
    let html = with(|st| match st.view {
        View::Home => home(st),
        View::Klausur(fi, ki) => klausur(st, fi, ki),
    });
    if let Some(root) = doc().get_element_by_id("app") {
        root.set_inner_html(&html);
    }
    // Zustand der Seitenleiste und der Musterlösungen
    with(|st| {
        let b = doc().body().unwrap();
        let cl = b.class_list();
        let _ = cl.toggle_with_force("hide-sol", !st.sol);
        let _ = cl.toggle_with_force("panel-open", st.panel);
    });
    render_panel();
    tick();
}

fn home(st: &State) -> String {
    let mut h = String::from(
        "<header class=\"top\"><div><p class=\"eyebrow\">Laufbahnprüfung</p><h1>Klausur-Werkstatt</h1></div></header>\
         <p class=\"lead\">Klausuren in Ruhe bearbeiten: Szene lesen, Aufgaben schreiben, Wissen nachschlagen, am Ende selbst bewerten. Alles wird automatisch auf diesem Gerät gespeichert.</p>",
    );
    for (fi, f) in st.faecher.iter().enumerate() {
        h += &format!("<section class=\"card\"><h2>{}</h2><p class=\"muted\">{}</p><div class=\"btns\">", esc(&f.name), esc(&f.sub));
        for (ki, k) in f.klausuren.iter().enumerate() {
            let total: u32 = k.items.iter().map(|i| i.points).sum();
            let done = k
                .items
                .iter()
                .enumerate()
                .filter(|(i, it)| it.kind == "aufgabe" && get(&key_ans(&f.id, &k.id, *i)).is_some_and(|a| !a.trim().is_empty()))
                .count();
            let n = k.items.iter().filter(|i| i.kind == "aufgabe").count();
            h += &format!(
                "<button class=\"big\" data-act=\"open:{fi}:{ki}\"><b>{}</b><small>{} Minuten, {} Punkte · {}/{} Aufgaben begonnen</small></button>",
                esc(&k.title),
                k.minutes,
                total,
                done,
                n
            );
        }
        h += "</div></section>";
    }
    h += "<div class=\"btns\"><button data-act=\"wissen-open\">Wissen nachschlagen</button></div>";
    h
}

fn klausur(st: &State, fi: usize, ki: usize) -> String {
    let f = &st.faecher[fi];
    let k = &f.klausuren[ki];
    let total: u32 = k.items.iter().map(|i| i.points).sum();
    let mut h = format!(
        "<header class=\"top sticky\"><button class=\"ghost\" data-act=\"home\" aria-label=\"Zurück\">‹ Übersicht</button>\
         <div class=\"hd\"><b>{}</b><span class=\"muted\">Zeit <span id=\"timer\"></span> · Punkte <span id=\"pts\"></span> / {}</span></div>\
         <div class=\"btns\"><button data-act=\"timer\" id=\"tbtn\"></button><button data-act=\"sol\">Musterlösungen {}</button><button data-act=\"wissen-open\">Wissen</button></div></header>",
        esc(&k.title),
        total,
        if st.sol { "ausblenden" } else { "einblenden" }
    );
    h += "<nav class=\"pills\">";
    for (i, it) in k.items.iter().enumerate() {
        let short = it.title.split('·').next().unwrap_or("").trim();
        h += &format!("<a href=\"#s{i}\">{}</a>", esc(short));
    }
    h += "</nav><main>";
    for (i, it) in k.items.iter().enumerate() {
        let open = if it.kind == "szene" || it.kind == "aufgabe" { " open" } else { "" };
        h += &format!("<details class=\"sec {}\" id=\"s{i}\"{open}><summary><span>{}</span>", esc(&it.kind), esc(&it.title));
        if it.kind == "aufgabe" {
            h += &format!("<em class=\"pt\">{} Punkte</em>", it.points);
        }
        h += "</summary><div class=\"body\">";
        h += &it.html;
        if it.kind == "aufgabe" {
            let ans = get(&key_ans(&f.id, &k.id, i)).unwrap_or_default();
            let pts = get(&key_pts(&f.id, &k.id, i)).unwrap_or_default();
            h += &format!(
                "<label class=\"lab\">Ihre Antwort</label><textarea data-ans=\"{}\" placeholder=\"Hier in ganzen Sätzen antworten. Die Brücke von der Theorie in die Praxis nicht vergessen.\">{}</textarea>\
                 <div class=\"rate\"><span id=\"wc{i}\" class=\"muted\">{} Wörter</span><label>Selbstbewertung <input type=\"number\" min=\"0\" max=\"{}\" step=\"0.5\" data-pts=\"{}\" data-max=\"{}\" value=\"{}\"> / {}</label></div>",
                key_ans(&f.id, &k.id, i),
                esc(&ans),
                ans.split_whitespace().count(),
                it.points,
                key_pts(&f.id, &k.id, i),
                it.points,
                esc(&pts),
                it.points
            );
        }
        h += "</div></details>";
    }
    h += "</main><div class=\"btns end\"><button data-act=\"copy\">Alle Antworten kopieren</button><button class=\"ghost\" data-act=\"reset\">Zeit zurücksetzen</button></div>";
    h
}

fn render_panel() {
    let html = with(|st| {
        let mut h = String::from("<div class=\"ph\"><b>Wissen aus der Lern-App</b><button class=\"ghost\" data-act=\"wissen-close\">Schließen</button></div>");
        let f = &st.faecher[match st.view {
            View::Klausur(fi, _) => fi,
            View::Home => 0,
        }];
        h += "<div class=\"chips\">";
        for (i, w) in f.wissen.iter().enumerate() {
            h += &format!("<button class=\"chip{}\" data-act=\"wsel:{i}\">{}</button>", if i == st.wissen { " on" } else { "" }, esc(&w.title));
        }
        h += "</div><div class=\"pb\">";
        if let Some(w) = f.wissen.get(st.wissen) {
            h += &w.html;
        }
        h += "</div>";
        h
    });
    if let Some(p) = doc().get_element_by_id("panel") {
        p.set_inner_html(&html);
    }
}

fn update_points() {
    let d = doc();
    let mut sum = 0.0;
    if let Ok(list) = d.query_selector_all("input[data-pts]") {
        for i in 0..list.length() {
            if let Some(el) = list.item(i).and_then(|n| n.dyn_into::<HtmlInputElement>().ok()) {
                sum += el.value().replace(',', ".").parse::<f64>().unwrap_or(0.0);
            }
        }
    }
    if let Some(e) = d.get_element_by_id("pts") {
        e.set_text_content(Some(&format!("{}", sum)));
    }
}

fn tick() {
    let txt = with(|st| match st.view {
        View::Klausur(fi, ki) => {
            let f = &st.faecher[fi];
            let k = &f.klausuren[ki];
            let left = k.minutes as f64 * 60_000.0 - elapsed_ms(st, f, k);
            Some((fmt_time(left.abs()), left < 0.0, st.running.is_some()))
        }
        View::Home => None,
    });
    let d = doc();
    if let Some((t, over, run)) = txt {
        if let Some(e) = d.get_element_by_id("timer") {
            e.set_text_content(Some(&format!("{}{}", if over { "+" } else { "" }, t)));
        }
        if let Some(e) = d.get_element_by_id("tbtn") {
            e.set_text_content(Some(if run { "Pause" } else { "Zeit starten" }));
        }
        update_points();
    }
}

fn save_elapsed(st: &mut State) {
    if let (View::Klausur(fi, ki), Some(t0)) = (st.view, st.running) {
        let f = &st.faecher[fi];
        let k = &f.klausuren[ki];
        let key = key_time(&f.id, &k.id);
        let base: f64 = get(&key).and_then(|v| v.parse().ok()).unwrap_or(0.0);
        set(&key, &format!("{}", base + (now() - t0)));
    }
    if let View::Klausur(fi, ki) = st.view {
        set(&key_run(&st.faecher[fi].id, &st.faecher[fi].klausuren[ki].id), "");
    }
    st.running = None;
}

fn all_answers(st: &State, fi: usize, ki: usize) -> String {
    let f = &st.faecher[fi];
    let k = &f.klausuren[ki];
    let mut out = format!("{}\n\n", k.title);
    for (i, it) in k.items.iter().enumerate() {
        if it.kind != "aufgabe" {
            continue;
        }
        let a = get(&key_ans(&f.id, &k.id, i)).unwrap_or_default();
        let p = get(&key_pts(&f.id, &k.id, i)).unwrap_or_default();
        out += &format!("## {} ({} Punkte, Selbstbewertung: {})\n{}\n\n", it.title, it.points, if p.is_empty() { "-" } else { &p }, a.trim());
    }
    out
}

fn on_click(el: Element) {
    let Some(target) = el.closest("[data-act]").ok().flatten() else { return };
    let act = target.get_attribute("data-act").unwrap_or_default();
    let parts: Vec<&str> = act.split(':').collect();
    match parts[0] {
        "open" => {
            let (fi, ki) = (parts[1].parse().unwrap_or(0), parts[2].parse().unwrap_or(0));
            with(|st| {
                save_elapsed(st);
                st.view = View::Klausur(fi, ki);
            });
            render();
            if let Some(w) = web_sys::window() {
                w.scroll_to_with_x_and_y(0.0, 0.0);
            }
        }
        "home" => {
            with(|st| {
                save_elapsed(st);
                st.view = View::Home;
            });
            render();
        }
        "timer" => {
            with(|st| {
                if st.running.is_some() {
                    save_elapsed(st);
                } else {
                    let t = now();
                    st.running = Some(t);
                    if let View::Klausur(fi, ki) = st.view {
                        set(&key_run(&st.faecher[fi].id, &st.faecher[fi].klausuren[ki].id), &format!("{}", t));
                    }
                }
            });
            tick();
        }
        "reset" => {
            with(|st| {
                st.running = None;
                if let View::Klausur(fi, ki) = st.view {
                    set(&key_time(&st.faecher[fi].id, &st.faecher[fi].klausuren[ki].id), "0");
                }
            });
            tick();
        }
        "sol" => {
            with(|st| st.sol = !st.sol);
            render();
        }
        "wissen-open" => {
            with(|st| st.panel = true);
            render_panel();
            let _ = doc().body().unwrap().class_list().add_1("panel-open");
        }
        "wissen-close" => {
            with(|st| st.panel = false);
            let _ = doc().body().unwrap().class_list().remove_1("panel-open");
        }
        "wsel" => {
            with(|st| st.wissen = parts[1].parse().unwrap_or(0));
            render_panel();
            if let Some(p) = doc().get_element_by_id("panel") {
                p.set_scroll_top(0);
            }
        }
        "copy" => {
            let text = with(|st| match st.view {
                View::Klausur(fi, ki) => all_answers(st, fi, ki),
                View::Home => String::new(),
            });
            let _ = clip_write(&text);
            target.set_text_content(Some("Kopiert"));
        }
        _ => {}
    }
}

fn on_input(el: Element) {
    if let Some(key) = el.get_attribute("data-ans") {
        if let Ok(t) = el.clone().dyn_into::<HtmlTextAreaElement>() {
            set(&key, &t.value());
            // Wortzähler der zugehörigen Aufgabe
            if let Some(sec) = el.closest("details.sec").ok().flatten() {
                let id = sec.id().replacen('s', "wc", 1);
                if let Some(c) = doc().get_element_by_id(&id) {
                    c.set_text_content(Some(&format!("{} Wörter", t.value().split_whitespace().count())));
                }
            }
        }
    } else if let Some(key) = el.get_attribute("data-pts") {
        if let Ok(i) = el.dyn_into::<HtmlInputElement>() {
            let max: f64 = i.get_attribute("data-max").and_then(|m| m.parse().ok()).unwrap_or(0.0);
            let v: f64 = i.value().replace(',', ".").parse().unwrap_or(0.0);
            if v > max {
                i.set_value(&format!("{}", max));
            }
            set(&key, &i.value());
            update_points();
        }
    }
}

#[wasm_bindgen(start)]
pub fn start() {
    let faecher: Vec<Fach> = FAECHER.iter().map(|j| serde_json::from_str(j).expect("Inhalt fehlerhaft")).collect();
    ST.with(|s| {
        *s.borrow_mut() = Some(State { faecher, view: View::Home, panel: false, wissen: 0, sol: false, running: None });
    });
    let d = doc();
    let click = Closure::<dyn FnMut(web_sys::Event)>::new(move |e: web_sys::Event| {
        if let Some(el) = e.target().and_then(|t| t.dyn_into::<Element>().ok()) {
            on_click(el);
        }
    });
    d.add_event_listener_with_callback("click", click.as_ref().unchecked_ref()).unwrap();
    click.forget();
    let input = Closure::<dyn FnMut(web_sys::Event)>::new(move |e: web_sys::Event| {
        if let Some(el) = e.target().and_then(|t| t.dyn_into::<Element>().ok()) {
            on_input(el);
        }
    });
    d.add_event_listener_with_callback("input", input.as_ref().unchecked_ref()).unwrap();
    input.forget();
    let timer = Closure::<dyn FnMut()>::new(tick);
    web_sys::window().unwrap().set_interval_with_callback_and_timeout_and_arguments_0(timer.as_ref().unchecked_ref(), 1000).unwrap();
    timer.forget();
    render();
}
