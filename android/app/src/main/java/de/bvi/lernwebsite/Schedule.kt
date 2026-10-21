package de.bvi.lernwebsite

import android.content.Context
import org.json.JSONArray
import java.util.Calendar
import java.util.Locale

// Eine Unterrichtseinheit aus dem Stundenplan (Beginn und Ende in Millisekunden)
// x = true: der Raum-Text ist schon vollständig (eigener Plan), sonst kommt "Raum " davor
class Lesson(val s: Long, val e: Long, val t: String, val r: String, val x: Boolean = false)

// Zustand zu einem Zeitpunkt: laufende Einheit, Pause, Unterricht vorbei oder kein Plan
class Snap(
    val kind: Int,
    val cur: Lesson?,
    val next: Lesson?,
    val after: Lesson?,
    val list: List<Lesson>,
    val label: String,
    val doneToday: Boolean
) {
    companion object {
        const val NOW = 0
        const val GAP = 1
        const val END = 2
        const val NONE = 3
    }
}

object Schedule {
    private const val PREFS = "bvi"
    private val DAYS = arrayOf("So", "Mo", "Di", "Mi", "Do", "Fr", "Sa")

    // Die Web-App schickt den Plan bei jedem Öffnen; nur gültige Daten ersetzen den alten Stand
    fun save(ctx: Context, json: String) {
        try {
            JSONArray(json)
            ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("schedule", json).apply()
        } catch (e: Exception) {
            // ungültig: alten Plan behalten
        }
    }

    fun load(ctx: Context): List<Lesson> {
        val raw = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("schedule", null) ?: return emptyList()
        val out = ArrayList<Lesson>()
        try {
            val a = JSONArray(raw)
            for (i in 0 until a.length()) {
                val o = a.getJSONObject(i)
                out.add(Lesson(o.getLong("s"), o.getLong("e"), o.optString("t"), o.optString("r"), o.optInt("x", 0) == 1))
            }
        } catch (e: Exception) {
            return emptyList()
        }
        out.sortBy { it.s }
        return out
    }

    private fun cal(ms: Long): Calendar = Calendar.getInstance().apply { timeInMillis = ms }

    fun sameDay(a: Long, b: Long): Boolean {
        val x = cal(a)
        val y = cal(b)
        return x.get(Calendar.YEAR) == y.get(Calendar.YEAR) && x.get(Calendar.DAY_OF_YEAR) == y.get(Calendar.DAY_OF_YEAR)
    }

    fun hhmm(ms: Long): String {
        val c = cal(ms)
        return String.format(Locale.GERMANY, "%02d:%02d", c.get(Calendar.HOUR_OF_DAY), c.get(Calendar.MINUTE))
    }

    fun range(l: Lesson): String = hhmm(l.s) + "–" + hhmm(l.e)

    fun room(l: Lesson): String = if (l.r.isBlank()) "" else if (l.x) l.r else "Raum " + l.r

    // "35 min" oder "1 Std 25 min"
    fun dur(ms: Long): String {
        val m = ((ms + 59_999L) / 60_000L).toInt().coerceAtLeast(1)
        return if (m < 60) "$m min" else if (m % 60 == 0) "${m / 60} Std" else "${m / 60} Std ${m % 60} min"
    }

    private fun dayLabel(ms: Long, now: Long): String {
        if (sameDay(ms, now + 86_400_000L)) return "morgen"
        val c = cal(ms)
        return String.format(
            Locale.GERMANY, "%s %d.%d.", DAYS[c.get(Calendar.DAY_OF_WEEK) - 1],
            c.get(Calendar.DAY_OF_MONTH), c.get(Calendar.MONTH) + 1
        )
    }

    fun snap(all: List<Lesson>, now: Long): Snap {
        val cur = all.firstOrNull { it.s <= now && now < it.e }
        val doneToday = all.any { sameDay(it.s, now) && it.e <= now }
        if (cur != null) {
            val next = all.firstOrNull { it.s >= cur.e && sameDay(it.s, now) && it !== cur }
            val after = if (next == null) null else all.firstOrNull { it.s >= next.e && sameDay(it.s, now) && it !== next }
            val rest = all.filter { sameDay(it.s, now) && it.e > now }
            return Snap(Snap.NOW, cur, next, after, rest, "", doneToday)
        }
        val gapNext = all.firstOrNull { it.s > now && sameDay(it.s, now) }
        if (gapNext != null) {
            val after = all.firstOrNull { it.s >= gapNext.e && sameDay(it.s, now) && it !== gapNext }
            val rest = all.filter { sameDay(it.s, now) && it.e > now }
            return Snap(Snap.GAP, null, gapNext, after, rest, "", doneToday)
        }
        val first = all.firstOrNull { it.s > now } ?: return Snap(Snap.NONE, null, null, null, emptyList(), "", doneToday)
        val day = all.filter { sameDay(it.s, first.s) }
        return Snap(
            Snap.END, null, day.getOrNull(0), day.getOrNull(1), day.take(3),
            dayLabel(first.s, now), doneToday
        )
    }

    // Nächster Zeitpunkt, zu dem sich ein Widget ändern muss (Beginn, Ende, Fortschritt, Mitternacht)
    fun nextChange(all: List<Lesson>, now: Long): Long {
        var t = now + 30 * 60_000L
        val c = cal(now).apply { add(Calendar.DAY_OF_YEAR, 1); set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 5) }
        if (c.timeInMillis < t) t = c.timeInMillis
        for (l in all) {
            if (l.s > now && l.s < t) t = l.s
            if (l.e > now && l.e < t) t = l.e
        }
        if (all.any { it.s <= now && now < it.e }) {
            val step = now + 5 * 60_000L
            if (step < t) t = step
        }
        return t.coerceAtLeast(now + 20_000L)
    }
}
