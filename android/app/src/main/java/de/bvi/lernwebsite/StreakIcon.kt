package de.bvi.lernwebsite

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import java.util.Calendar

/**
 * Startsymbol bei drohendem Serienverlust.
 * Normal gilt das Symbol der gewählten Farbe und des Designs (z. B. "orange_light").
 * Ab 18 Uhr, wenn eine Serie läuft und heute noch nicht gelernt wurde, gilt die Variante "<name>_dim": Die Flamme ist kleiner und weniger gesättigt.
 * Ab 21 Uhr gilt "<name>_late": Die Flamme ist nur noch halb so groß und grau.
 * Hast du einen Serien-Schutz, gilt in beiden Fällen "<name>_safe": schwächere Flamme mit Schild (die Serie ist abgesichert).
 * Ohne Gefahr wächst das Symbol mit der Serie: ab 7 Tagen "_t7" (Glut), ab 30 Tagen "_t30" (hellere Flamme, Funken), ab 100 Tagen "_t100" (zusätzlich ein Ring).
 * Sobald wieder gelernt wurde (oder die Serie gerissen ist), erscheint das normale bzw. das Serien-Symbol.
 * Ein täglicher Alarm um 18:00, 21:00 und 00:30 schaltet das Symbol auch dann um, wenn die App nicht läuft.
 */
object StreakIcon {
    private val BASES = listOf("orange", "gold", "red", "blue", "green")
    private val TONES = listOf("", "_light", "_beige")
    private const val RISK_HOUR = 18
    private const val LATE_HOUR = 21
    private const val REQ_EVENING = 9218
    private const val REQ_LATE = 9221
    private const val REQ_NIGHT = 9230

    private fun aliasOf(n: String) = "Icon" + n.split("_").joinToString("") { p -> p.replaceFirstChar { c -> c.uppercase() } }

    /** Alle gültigen Namen, z. B. "orange_light" -> "IconOrangeLight", "orange_light_dim" -> "IconOrangeLightDim" */
    val aliases: Map<String, String> = HashMap<String, String>().apply {
        for (b in BASES) for (t in TONES) { put(b + t, aliasOf(b + t)); put(b + t + "_dim", aliasOf(b + t + "_dim")); put(b + t + "_late", aliasOf(b + t + "_late"))
            for (s in listOf("_safe", "_t7", "_t30", "_t100")) put(b + t + s, aliasOf(b + t + s)) }
    }

    private fun prefs(ctx: Context) = ctx.getSharedPreferences("bvi", Context.MODE_PRIVATE)

    private fun key(c: Calendar) = String.format("%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH))

    /** Stufe bei drohendem Serienverlust: 0 = normal, 1 = ab 18 Uhr (kleiner, blasser), 2 = ab 21 Uhr (halb so groß, grau) */
    fun riskLevel(days: Int, last: String, now: Calendar = Calendar.getInstance()): Int {
        val h = now.get(Calendar.HOUR_OF_DAY)
        if (days <= 0 || h < RISK_HOUR) return 0
        val y = (now.clone() as Calendar).apply { add(Calendar.DAY_OF_YEAR, -1) }
        if (last != key(y)) return 0
        return if (h >= LATE_HOUR) 2 else 1
    }

    /** Läuft die Serie noch (heute oder gestern zuletzt gelernt)? */
    private fun alive(days: Int, last: String, now: Calendar = Calendar.getInstance()): Boolean {
        if (days <= 0) return false
        val y = (now.clone() as Calendar).apply { add(Calendar.DAY_OF_YEAR, -1) }
        return last == key(now) || last == key(y)
    }

    /** Gewünschter Name aus gespeicherter Grundfarbe und Serienzustand */
    fun wanted(ctx: Context): String {
        val p = prefs(ctx)
        val base = p.getString("base_icon", "orange") ?: "orange"
        val days = p.getInt("streak_days", 0)
        val last = p.getString("streak_last", "") ?: ""
        val risk = riskLevel(days, last)
        if (risk > 0) {
            if (p.getBoolean("streak_protected", false)) return base + "_safe"
            return if (risk == 2) base + "_late" else base + "_dim"
        }
        if (!alive(days, last)) return base
        return when { days >= 100 -> base + "_t100"; days >= 30 -> base + "_t30"; days >= 7 -> base + "_t7"; else -> base }
    }

    /** Aus der Seite: Grundfarbe/-design des Symbols (z. B. "orange_light") */
    fun setBase(ctx: Context, name: String) {
        if (!BASES.any { b -> TONES.any { t -> name == b + t } }) return
        prefs(ctx).edit().putString("base_icon", name).putString("pending_icon", wanted(ctx)).apply()
    }

    /** Aus der Seite: Länge der Serie, Tag des letzten Lernens (JJJJ-MM-TT) und ob ein Serien-Schutz bereitsteht */
    fun setStreak(ctx: Context, days: Int, last: String, protect: Boolean) {
        prefs(ctx).edit().putInt("streak_days", days.coerceIn(0, 100000)).putString("streak_last", last.take(10)).putBoolean("streak_protected", protect).putString("pending_icon", wanted(ctx)).apply()
        schedule(ctx)
    }

    /** Symbol jetzt umschalten (nur wenn es sich ändert) */
    fun apply(ctx: Context, name: String) {
        val target = aliases[name] ?: return
        val pm = ctx.packageManager
        val p = prefs(ctx)
        fun comp(alias: String) = ComponentName(ctx.packageName, ctx.packageName + "." + alias)
        val cur = p.getString("icon_on", null)
        if (cur == target) return
        try {
            pm.setComponentEnabledSetting(comp(target), PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP)
            if (cur != null) {
                pm.setComponentEnabledSetting(comp(cur), PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP)
            } else {
                // erster Wechsel mit dieser Version: alle übrigen Aliase ausschalten (nur einmal)
                aliases.values.filter { it != target }.forEach {
                    pm.setComponentEnabledSetting(comp(it), PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP)
                }
            }
            p.edit().putString("icon_on", target).apply()
        } catch (e: Exception) {
            // Manche Launcher blockieren den Wechsel; dann bleibt das bisherige Symbol
        }
    }

    /** Ohne laufende App: Zustand neu berechnen und Symbol umschalten */
    fun refresh(ctx: Context) {
        apply(ctx, wanted(ctx))
    }

    private fun pending(ctx: Context, req: Int): PendingIntent =
        PendingIntent.getBroadcast(ctx, req, Intent(ctx, StreakReceiver::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    private fun at(hour: Int, minute: Int): Long {
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour); set(Calendar.MINUTE, minute); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= System.currentTimeMillis()) add(Calendar.DAY_OF_YEAR, 1)
        }
        return cal.timeInMillis
    }

    /** Täglich 18:00 (Flamme kleiner und blasser), 21:00 (halb so groß und grau) und 00:30 (gerissene Serie: wieder das normale Symbol) */
    fun schedule(ctx: Context) {
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        am.setInexactRepeating(AlarmManager.RTC, at(RISK_HOUR, 0), AlarmManager.INTERVAL_DAY, pending(ctx, REQ_EVENING))
        am.setInexactRepeating(AlarmManager.RTC, at(LATE_HOUR, 0), AlarmManager.INTERVAL_DAY, pending(ctx, REQ_LATE))
        am.setInexactRepeating(AlarmManager.RTC, at(0, 30), AlarmManager.INTERVAL_DAY, pending(ctx, REQ_NIGHT))
    }
}

class StreakReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        StreakIcon.refresh(context)
    }
}
