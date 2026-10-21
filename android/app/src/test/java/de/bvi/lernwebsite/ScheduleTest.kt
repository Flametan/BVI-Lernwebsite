package de.bvi.lernwebsite

import org.junit.Assert.*
import org.junit.Test
import java.util.Calendar

class ScheduleTest {
    private fun at(day: Int, h: Int, m: Int): Long = Calendar.getInstance().apply {
        set(2026, Calendar.OCTOBER, day, h, m, 0); set(Calendar.MILLISECOND, 0)
    }.timeInMillis

    private val all = listOf(
        Lesson(at(27, 8, 0), at(27, 9, 30), "Vorbeugender Brandschutz", "B1-106"),
        Lesson(at(27, 9, 45), at(27, 11, 15), "Stabsarbeit", "C-205"),
        Lesson(at(27, 12, 30), at(27, 14, 0), "Recht", ""),
        Lesson(at(28, 8, 0), at(28, 9, 30), "Fallbearbeitung", "A3-25"),
        Lesson(at(28, 9, 45), at(28, 11, 15), "Klausurvorbereitung", "A3-25")
    )

    @Test fun running() {
        val s = Schedule.snap(all, at(27, 9, 0))
        assertEquals(Snap.NOW, s.kind)
        assertEquals("Vorbeugender Brandschutz", s.cur!!.t)
        assertEquals("Stabsarbeit", s.next!!.t)
        assertEquals("Recht", s.after!!.t)
        assertEquals(3, s.list.size)
        assertEquals("08:00–09:30", Schedule.range(s.cur!!))
        assertEquals("Raum B1-106", Schedule.room(s.cur!!))
        assertEquals("", Schedule.room(all[2]))
        assertEquals("30 min", Schedule.dur(at(27, 9, 30) - at(27, 9, 0)))
        assertEquals("1 Std 25 min", Schedule.dur(85 * 60_000L))
    }

    @Test fun pause() {
        val s = Schedule.snap(all, at(27, 9, 35))
        assertEquals(Snap.GAP, s.kind)
        assertEquals("Stabsarbeit", s.next!!.t)
        assertEquals("Recht", s.after!!.t)
        assertTrue(s.doneToday)
    }

    @Test fun lunch() {
        val s = Schedule.snap(all, at(27, 11, 40))
        assertEquals(Snap.GAP, s.kind)
        assertEquals("Recht", s.next!!.t)
        assertNull(s.after)
    }

    @Test fun afterClassShowsTomorrow() {
        val s = Schedule.snap(all, at(27, 16, 0))
        assertEquals(Snap.END, s.kind)
        assertEquals("morgen", s.label)
        assertEquals("Fallbearbeitung", s.next!!.t)
        assertEquals("Klausurvorbereitung", s.after!!.t)
        assertTrue(s.doneToday)
    }

    @Test fun beforeStartShowsWeekday() {
        val s = Schedule.snap(all, at(24, 12, 0))
        assertEquals(Snap.END, s.kind)
        assertEquals("Di 27.10.", s.label)
        assertFalse(s.doneToday)
    }

    @Test fun overAndEmpty() {
        assertEquals(Snap.NONE, Schedule.snap(all, at(30, 12, 0)).kind)
        assertEquals(Snap.NONE, Schedule.snap(emptyList(), at(27, 12, 0)).kind)
    }

    @Test fun nextChange() {
        val now = at(27, 9, 0)
        val t = Schedule.nextChange(all, now)
        assertEquals(now + 5 * 60_000L, t)            // während des Unterrichts alle 5 Minuten
        val pause = at(27, 9, 31)
        assertEquals(at(27, 9, 45), Schedule.nextChange(all, pause))   // Beginn der nächsten Einheit
        val night = at(27, 23, 0)
        assertTrue(Schedule.nextChange(all, night) > night)
    }
}
