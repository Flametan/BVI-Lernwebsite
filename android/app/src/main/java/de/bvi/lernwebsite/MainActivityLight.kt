package de.bvi.lernwebsite

// Gleiche App, aber mit hellem Startbild; die hellen Startsymbole (IconXxxLight) starten diese Klasse
class MainActivityLight : MainActivity() {
    override val startColor = 0xFFF4F4F1.toInt()
}
