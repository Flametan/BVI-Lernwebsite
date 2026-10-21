package de.bvi.lernwebsite

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Shader
import android.graphics.Paint
import android.graphics.RectF
import android.view.View
import android.widget.RemoteViews

// Drei Startbildschirm-Widgets; sie zeigen den Stundenplan, den die Web-App an die Android-App übergibt
open class BaseWidget : AppWidgetProvider() {
    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
        Widgets.updateAll(ctx)
    }

    override fun onAppWidgetOptionsChanged(ctx: Context, mgr: AppWidgetManager, id: Int, newOptions: android.os.Bundle) {
        Widgets.updateAll(ctx)
    }

    override fun onEnabled(ctx: Context) {
        Widgets.updateAll(ctx)
    }
}

class WidgetNext : BaseWidget()
class WidgetDay : BaseWidget()
class WidgetNow : BaseWidget()

// Wird zu Beginn und Ende jeder Einheit (und alle 5 Minuten während des Unterrichts) geweckt
class WidgetTick : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        Widgets.updateAll(ctx)
    }
}

object Widgets {
    private const val PREFS = "bvi"
    private const val REQ_TICK = 4720
    private const val REQ_OPEN = 4721

    class Pal(val bg: Int, val fg: Int, val mut: Int, val card: Int, val acc: Int, val onAcc: Int)

    fun setStyle(ctx: Context, accent: String, light: Boolean) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString("w_acc", accent).putBoolean("w_light", light).apply()
    }

    private fun pal(ctx: Context): Pal {
        val p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val light = p.getBoolean("w_light", false)
        val acc = try {
            Color.parseColor(p.getString("w_acc", "#FFA412"))
        } catch (e: Exception) {
            0xFFFFA412.toInt()
        }
        val dark = 0xFF111111.toInt()
        return if (light) Pal(0xFFF4F4F1.toInt(), 0xFF1A1A1A.toInt(), 0xFF6B6860.toInt(), 0xFFE7E6E1.toInt(), acc, dark)
        else Pal(0xFF1B1C1F.toInt(), 0xFFF3F1EC.toInt(), 0xFFA6A39B.toInt(), 0xFF26272B.toInt(), acc, dark)
    }

    // Fortschrittsbalken als Bild, damit er in der Akzentfarbe gezeichnet werden kann
    private fun bar(p: Float, track: Int, fill: Int): Bitmap {
        val w = 400
        val h = 14
        val b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val c = Canvas(b)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        paint.color = track
        c.drawRoundRect(RectF(0f, 0f, w.toFloat(), h.toFloat()), h / 2f, h / 2f, paint)
        val fw = w * p.coerceIn(0f, 1f)
        if (fw > 0f) {
            paint.color = fill
            c.drawRoundRect(RectF(0f, 0f, maxOf(fw, h.toFloat()), h.toFloat()), h / 2f, h / 2f, paint)
        }
        return b
    }

    // Mischung aus zwei Farben (t = Anteil von a)
    private fun mix(a: Int, b: Int, t: Float): Int {
        val r = (Color.red(a) * t + Color.red(b) * (1 - t)).toInt()
        val g = (Color.green(a) * t + Color.green(b) * (1 - t)).toInt()
        val bl = (Color.blue(a) * t + Color.blue(b) * (1 - t)).toInt()
        return Color.rgb(r, g, bl)
    }

    // Hintergrund mit Farbverlauf aus der Akzentfarbe (oben links) in die Grundfarbe, passend zur Widget-Größe
    private fun glassBg(ctx: Context, pal: Pal, light: Boolean, wDp: Int, hDp: Int): Bitmap {
        val d = ctx.resources.displayMetrics.density
        val w = (wDp * d).toInt().coerceIn(240, 1100)
        val h = (hDp * d).toInt().coerceIn(120, 800)
        val b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val c = Canvas(b)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        val end = if (light) Color.rgb(0xF4, 0xF4, 0xF1) else Color.rgb(0x15, 0x16, 0x1A)
        val start = mix(pal.acc, if (light) Color.WHITE else end, if (light) 0.35f else 0.30f)
        paint.shader = LinearGradient(0f, 0f, w * 0.8f, h.toFloat(), intArrayOf(start, end, end), floatArrayOf(0f, 0.72f, 1f), Shader.TileMode.CLAMP)
        val r = 22f * d
        c.drawRoundRect(RectF(0f, 0f, w.toFloat(), h.toFloat()), r, r, paint)
        return b
    }

    private fun openApp(ctx: Context): PendingIntent {
        val i = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName) ?: Intent(ctx, MainActivity::class.java)
        i.putExtra("open", "plan")
        i.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        return PendingIntent.getActivity(ctx, REQ_OPEN, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun tickIntent(ctx: Context): PendingIntent =
        PendingIntent.getBroadcast(
            ctx, REQ_TICK, Intent(ctx, WidgetTick::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

    private fun txt(v: RemoteViews, id: Int, text: String, color: Int) {
        v.setTextViewText(id, text)
        v.setTextColor(id, color)
    }

    private fun show(v: RemoteViews, id: Int, on: Boolean) {
        v.setViewVisibility(id, if (on) View.VISIBLE else View.GONE)
    }

    private fun tint(v: RemoteViews, id: Int, color: Int) {
        v.setInt(id, "setColorFilter", color)
    }

    // Innenabstand in dp (bei sehr niedrigen Widgets enger, damit der Inhalt Platz hat)
    private fun pad(ctx: Context, v: RemoteViews, dp: Int) {
        val px = (dp * ctx.resources.displayMetrics.density).toInt()
        v.setViewPadding(R.id.pad, px, px, px, px)
    }

    private fun base(ctx: Context, v: RemoteViews, pal: Pal) {
        tint(v, R.id.bg, pal.bg)
        v.setOnClickPendingIntent(R.id.root, openApp(ctx))
    }

    private fun eyebrow(s: Snap, now: Long): String = when (s.kind) {
        Snap.NOW -> "● Jetzt"
        Snap.GAP -> "Als Nächstes · in " + Schedule.dur(s.next!!.s - now)
        Snap.END -> (if (s.doneToday) "Unterricht vorbei · " else "Nächster Unterricht · ") + s.label
        else -> "Kein Unterricht geplant"
    }

    fun build(ctx: Context, kind: Int, wDp: Int, hDp: Int): RemoteViews {
        val now = System.currentTimeMillis()
        val s = Schedule.snap(Schedule.load(ctx), now)
        val pal = pal(ctx)
        return when (kind) {
            1 -> buildNext(ctx, s, pal, now, hDp)
            2 -> buildDay(ctx, s, pal, now, hDp)
            else -> buildNow(ctx, s, pal, now, wDp, hDp)
        }
    }

    // Fortschritt der laufenden Einheit (0 bis 1); ohne laufende Einheit bleibt der Zeitstrahl leer
    private fun progress(s: Snap, u: Lesson, now: Long): Float =
        if (s.kind == Snap.NOW) ((now - u.s).toFloat() / (u.e - u.s).toFloat()).coerceIn(0f, 1f) else 0f

    // Entwurf 1: Nächste Einheit (klein, ab 2×1)
    private fun buildNext(ctx: Context, s: Snap, pal: Pal, now: Long, hDp: Int): RemoteViews {
        val v = RemoteViews(ctx.packageName, R.layout.widget_next)
        base(ctx, v, pal)
        val tiny = hDp < 100
        if (tiny) pad(ctx, v, 6)
        val u = if (s.kind == Snap.NOW) s.cur else s.next
        val aft = if (s.kind == Snap.NOW) s.next else s.after
        show(v, R.id.eyebrow, !tiny)
        txt(v, R.id.eyebrow, eyebrow(s, now), pal.acc)
        if (u == null) {
            txt(v, R.id.title, "Stundenplan in der App öffnen", pal.fg)
            txt(v, R.id.range, "", pal.fg)
            show(v, R.id.room, false)
            show(v, R.id.bar, false)
            show(v, R.id.after, false)
            return v
        }
        txt(v, R.id.title, u.t, pal.fg)
        val room = Schedule.room(u)
        txt(v, R.id.range, Schedule.range(u) + if (tiny && u.r.isNotBlank()) " · " + u.r else "", pal.fg)
        show(v, R.id.room, room.isNotEmpty() && !tiny)
        txt(v, R.id.room, room, pal.mut)
        show(v, R.id.bar, true)
        v.setImageViewBitmap(R.id.bar, bar(progress(s, u, now), pal.card, pal.acc))
        show(v, R.id.after, aft != null && hDp >= 150)
        if (aft != null) {
            txt(v, R.id.afterTitle, "Danach " + Schedule.hhmm(aft.s) + " " + aft.t, pal.fg)
            val ar = Schedule.room(aft)
            show(v, R.id.afterRoom, ar.isNotEmpty())
            txt(v, R.id.afterRoom, ar, pal.mut)
        }
        return v
    }

    // Entwurf 3: Tagesplan (breit, ab 4×1)
    private fun buildDay(ctx: Context, s: Snap, pal: Pal, now: Long, hDp: Int): RemoteViews {
        val v = RemoteViews(ctx.packageName, R.layout.widget_day)
        base(ctx, v, pal)
        val title = when (s.kind) {
            Snap.NOW, Snap.GAP -> "Heute im Plan"
            Snap.NONE -> "Stundenplan"
            else -> eyebrow(s, now)
        }
        if (hDp < 100) pad(ctx, v, 5)
        show(v, R.id.eyebrow, hDp >= 100)
        txt(v, R.id.eyebrow, title, pal.acc)
        val rows = intArrayOf(R.id.row1, R.id.row2, R.id.row3)
        val bgs = intArrayOf(R.id.rowBg1, R.id.rowBg2, R.id.rowBg3)
        val times = intArrayOf(R.id.time1, R.id.time2, R.id.time3)
        val titles = intArrayOf(R.id.title1, R.id.title2, R.id.title3)
        val subs = intArrayOf(R.id.sub1, R.id.sub2, R.id.sub3)
        val bars = intArrayOf(R.id.bar1, R.id.bar2, R.id.bar3)
        val rooms = intArrayOf(R.id.room1, R.id.room2, R.id.room3)
        val maxRows = if (hDp < 100) 1 else if (hDp < 150) 2 else 3
        val list = s.list.take(maxRows)
        for (i in 0 until 3) {
            val l = list.getOrNull(i)
            if (l == null && !(i == 0 && s.kind == Snap.NONE)) {
                show(v, rows[i], false)
                continue
            }
            show(v, rows[i], true)
            if (l == null) {
                tint(v, bgs[i], pal.card)
                txt(v, times[i], "", pal.acc)
                txt(v, titles[i], "Kein Unterricht geplant – Plan in der App öffnen", pal.fg)
                show(v, subs[i], false)
                show(v, bars[i], false)
                txt(v, rooms[i], "", pal.mut)
                continue
            }
            val running = s.kind == Snap.NOW && l === s.cur
            tint(v, bgs[i], if (running) pal.acc else pal.card)
            txt(v, times[i], Schedule.range(l), if (running) pal.onAcc else pal.acc)
            txt(v, titles[i], l.t, if (running) pal.onAcc else pal.fg)
            txt(v, rooms[i], Schedule.room(l), if (running) pal.onAcc else pal.mut)
            // Zeitstrahl in der ersten Zeile immer; laufend gefüllt, sonst leer
            val line = i == 0
            show(v, subs[i], running && hDp >= 100)
            show(v, bars[i], line)
            if (running) txt(v, subs[i], "bis " + Schedule.hhmm(l.e) + " · noch " + Schedule.dur(l.e - now), pal.onAcc)
            if (line) v.setImageViewBitmap(bars[i], bar(progress(s, l, now), if (running) 0x33000000 else pal.bg, if (running) pal.onAcc else pal.acc))
        }
        return v
    }

    // Entwurf 5: Jetzt und danach (breit, ab 4×1)
    private fun buildNow(ctx: Context, s: Snap, pal: Pal, now: Long, wDp: Int, hDp: Int): RemoteViews {
        val v = RemoteViews(ctx.packageName, R.layout.widget_now)
        v.setOnClickPendingIntent(R.id.root, openApp(ctx))
        val light = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean("w_light", false)
        v.setImageViewBitmap(R.id.bg, glassBg(ctx, pal, light, wDp, hDp))
        tint(v, R.id.cardBg, pal.card)
        val tiny = hDp < 100
        if (tiny) pad(ctx, v, 6)
        val u = if (s.kind == Snap.NOW) s.cur else s.next
        val aft = if (s.kind == Snap.NOW) s.next else s.after
        show(v, R.id.eyebrow, !tiny)
        txt(v, R.id.eyebrow, eyebrow(s, now), pal.acc)
        if (u == null) {
            txt(v, R.id.title, "Stundenplan in der App öffnen", pal.fg)
            txt(v, R.id.range, "", pal.fg)
            show(v, R.id.room, false)
            show(v, R.id.left, false)
            show(v, R.id.bar, false)
            show(v, R.id.card, false)
            return v
        }
        txt(v, R.id.title, u.t, pal.fg)
        val room = Schedule.room(u)
        txt(v, R.id.range, Schedule.range(u) + if (tiny && u.r.isNotBlank()) " · " + u.r else "", pal.fg)
        show(v, R.id.room, room.isNotEmpty() && !tiny)
        txt(v, R.id.room, room, pal.mut)
        val running = s.kind == Snap.NOW
        show(v, R.id.left, running && !tiny)
        if (running) txt(v, R.id.left, "noch " + Schedule.dur(u.e - now), pal.acc)
        show(v, R.id.bar, true)
        v.setImageViewBitmap(R.id.bar, bar(progress(s, u, now), pal.card, pal.acc))
        show(v, R.id.card, aft != null)
        if (aft != null) {
            show(v, R.id.afterLabel, !tiny)
            txt(v, R.id.afterLabel, "DANACH", pal.mut)
            txt(v, R.id.afterTitle, if (tiny) Schedule.hhmm(aft.s) + " " + aft.t else aft.t, pal.fg)
            txt(v, R.id.afterRange, Schedule.range(aft), pal.mut)
            show(v, R.id.afterRange, !tiny)
            val ar = Schedule.room(aft)
            show(v, R.id.afterRoom, ar.isNotEmpty() && !tiny)
            txt(v, R.id.afterRoom, ar, pal.mut)
        }
        return v
    }

    // Alle platzierten Widgets neu zeichnen und den nächsten Weckzeitpunkt setzen
    fun updateAll(ctx: Context) {
        val mgr = AppWidgetManager.getInstance(ctx)
        var any = false
        val kinds = listOf(
            Pair(WidgetNext::class.java, 1),
            Pair(WidgetDay::class.java, 2),
            Pair(WidgetNow::class.java, 3)
        )
        for ((cls, kind) in kinds) {
            val ids = mgr.getAppWidgetIds(ComponentName(ctx, cls))
            if (ids.isEmpty()) continue
            any = true
            for (id in ids) {
                val o = mgr.getAppWidgetOptions(id)
                val w = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0).let { if (it > 0) it else 250 }
                val h = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0).let { if (it > 0) it else 110 }
                mgr.updateAppWidget(id, build(ctx, kind, w, h))
            }
        }
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        if (any) {
            val at = Schedule.nextChange(Schedule.load(ctx), System.currentTimeMillis())
            am.setAndAllowWhileIdle(AlarmManager.RTC, at, tickIntent(ctx))
        } else {
            am.cancel(tickIntent(ctx))
        }
    }
}
