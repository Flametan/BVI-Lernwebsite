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
 * Startsymbol mit kleiner Streak-Flamme (wie bei Duolingo).
 * Je Farbe/Design gibt es drei Aliase: ohne Flamme, "_s1" (Flamme brennt) und "_s2" (Flamme droht zu erlöschen).
 * Zustand: keine Serie = 0, Serie und heute gelernt = 1, Serie, aber heute noch nicht gelernt und es ist nach 18 Uhr = 2.
 * Ein täglicher Alarm um 18:00 und 00:30 schaltet das Symbol auch dann um, wenn die App nicht läuft.
 */
object StreakIcon {
    private val BASES = listOf("orange", "gold", "red", "blue", "green")
    private val TONES = listOf("", "_light", "_beige")
    private val SUFFIXES = listOf("", "_s1", "_s2")
    private const val RISK_HOUR = 18
    private const val REQ_EVENING = 9218
    private const val REQ_NIGHT = 9230

    /** Alle gültigen Namen, z. B. "orange_light_s1" -> Alias "IconOrangeLightS1" */
    val aliases: Map<String, String> = HashMap<String, String>().apply {
        for (b in BASES) for (t in TONES) for (s in SUFFIXES) {
            val n = b + t + s
            put(n, "Icon" + n.split("_").joinToString("") { p -> p.replaceFirstChar { c -> c.uppercase() } })
        }
    }

    private fun prefs(ctx: Context) = ctx.getSharedPreferences("bvi", Context.MODE_PRIVATE)

    private fun key(c: Calendar) = String.format("%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH))

    /** 0 = ohne Flamme, 1 = Flamme brennt, 2 = Flamme schwach */
    fun state(days: Int, last: String, now: Calendar = Calendar.getInstance()): Int {
        if (days <= 0) return 0
        val today = key(now)
        if (last == today) return 1
        val y = (now.clone() as Calendar).apply { add(Calendar.DAY_OF_YEAR, -1) }
        if (last == key(y)) return if (now.get(Calendar.HOUR_OF_DAY) >= RISK_HOUR) 2 else 1
        return 0   // Serie ist gerissen
    }

    /** Gewünschter Name aus gespeicherter Grundfarbe und Serienzustand */
    fun wanted(ctx: Context): String {
        val p = prefs(ctx)
        val base = p.getString("base_icon", "orange") ?: "orange"
        val st = state(p.getInt("streak_days", 0), p.getString("streak_last", "") ?: "")
        return base + (if (st == 1) "_s1" else if (st == 2) "_s2" else "")
    }

    /** Aus der Seite: Grundfarbe/-design des Symbols (z. B. "orange_light") */
    fun setBase(ctx: Context, name: String) {
        val base = name.removeSuffix("_s1").removeSuffix("_s2")
        if (!aliases.containsKey(base)) return
        prefs(ctx).edit().putString("base_icon", base).putString("pending_icon", wanted(ctx)).apply()
    }

    /** Aus der Seite: Länge der Serie und Tag des letzten Lernens (JJJJ-MM-TT) */
    fun setStreak(ctx: Context, days: Int, last: String) {
        val p = prefs(ctx)
        p.edit().putInt("streak_days", days.coerceIn(0, 100000)).putString("streak_last", last.take(10)).putString("pending_icon", wanted(ctx)).apply()
        schedule(ctx)
    }

    /** Symbol jetzt umschalten (nur wenn es sich ändert) */
    fun apply(ctx: Context, name: String) {
        val target = aliases[name] ?: return
        val pm = ctx.packageManager
        fun comp(alias: String) = ComponentName(ctx.packageName, ctx.packageName + "." + alias)
        fun isOn(alias: String) = when (pm.getComponentEnabledSetting(comp(alias))) {
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED -> true
            PackageManager.COMPONENT_ENABLED_STATE_DEFAULT -> alias == "IconOrange"
            else -> false
        }
        if (isOn(target)) return
        try {
            pm.setComponentEnabledSetting(comp(target), PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP)
            aliases.values.filter { it != target }.forEach {
                pm.setComponentEnabledSetting(comp(it), PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP)
            }
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

    /** Täglich 18:00 (Flamme wird schwach) und 00:30 (gerissene Serie entfernt die Flamme) */
    fun schedule(ctx: Context) {
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        am.setInexactRepeating(AlarmManager.RTC, at(RISK_HOUR, 0), AlarmManager.INTERVAL_DAY, pending(ctx, REQ_EVENING))
        am.setInexactRepeating(AlarmManager.RTC, at(0, 30), AlarmManager.INTERVAL_DAY, pending(ctx, REQ_NIGHT))
    }
}

class StreakReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        StreakIcon.refresh(context)
    }
}
