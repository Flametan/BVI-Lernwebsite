package de.bvi.lernwebsite

import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.ContentValues
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import java.io.File

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val prefs by lazy { getSharedPreferences("bvi", MODE_PRIVATE) }

    // Startsymbole je Akzentfarbe (activity-alias im Manifest); Orange ist per Manifest aktiv
    private val iconAliases = mapOf(
        "orange" to "IconOrange", "gold" to "IconGold", "red" to "IconRed",
        "blue" to "IconBlue", "green" to "IconGreen"
    )

    inner class IconBridge {
        @JavascriptInterface
        fun setIcon(name: String) {
            if (name in iconAliases) prefs.edit().putString("pending_icon", name).apply()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            mediaPlaybackRequiresUserGesture = false
        }

        webView.addJavascriptInterface(IconBridge(), "BVIAndroid")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url.toString()
                if (url.contains("BHKG_NRW_Kommentar.pdf")) {
                    saveAssetToDownloads("BHKG_NRW_Kommentar.pdf")
                    return true
                }
                return false
            }
        }

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            webView.loadUrl("https://flametan.github.io/BVI-Lernwebsite/")
        }
    }

    private fun saveAssetToDownloads(filename: String) {
        try {
            val input = assets.open(filename)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, filename)
                    put(MediaStore.Downloads.MIME_TYPE, "application/pdf")
                    put(MediaStore.Downloads.IS_PENDING, 1)
                }
                val uri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                uri?.let {
                    contentResolver.openOutputStream(it)?.use { os -> input.copyTo(os) }
                    values.clear()
                    values.put(MediaStore.Downloads.IS_PENDING, 0)
                    contentResolver.update(it, values, null, null)
                }
            } else {
                val outFile = File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    filename
                )
                outFile.outputStream().use { input.copyTo(it) }
            }
            Toast.makeText(this, "PDF in Downloads gespeichert", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(this, "Fehler beim Speichern", Toast.LENGTH_SHORT).show()
        }
    }

    // Erst beim Verlassen umschalten, damit Android die laufende App nicht beendet
    override fun onStop() {
        super.onStop()
        applyPendingIcon()
    }

    private fun applyPendingIcon() {
        val name = prefs.getString("pending_icon", null) ?: return
        prefs.edit().remove("pending_icon").apply()
        val pm = packageManager
        fun component(alias: String) = ComponentName(packageName, "$packageName.$alias")
        fun isOn(alias: String) = when (pm.getComponentEnabledSetting(component(alias))) {
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED -> true
            PackageManager.COMPONENT_ENABLED_STATE_DEFAULT -> alias == "IconOrange"
            else -> false
        }
        val target = iconAliases[name] ?: return
        if (isOn(target)) return
        try {
            pm.setComponentEnabledSetting(component(target),
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP)
            iconAliases.values.filter { it != target }.forEach {
                pm.setComponentEnabledSetting(component(it),
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP)
            }
        } catch (e: Exception) {
            // Manche Launcher blockieren den Wechsel; dann bleibt das bisherige Symbol
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
