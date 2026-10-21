package de.bvi.lernwebsite

import android.annotation.SuppressLint
import android.content.ComponentName
import android.Manifest
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.app.Activity
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import java.io.File

open class MainActivity : AppCompatActivity() {

    // Die helle Variante (MainActivityLight) startet mit weißem Fenster statt schwarzem
    protected open val lightStart = false

    private lateinit var webView: WebView
    private val prefs by lazy { getSharedPreferences("bvi", MODE_PRIVATE) }
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val fileChooser = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { r ->
        fileCallback?.onReceiveValue(
            if (r.resultCode == Activity.RESULT_OK) WebChromeClient.FileChooserParams.parseResult(r.resultCode, r.data) else null
        )
        fileCallback = null
    }

    // Kamera für den QR-Scan im Duell: Anfrage der Seite merken, Android-Berechtigung erfragen, dann freigeben
    private var camRequest: PermissionRequest? = null
    private val camPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val r = camRequest
        camRequest = null
        if (r != null) {
            if (granted) r.grant(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) else r.deny()
        }
    }

    // Startsymbole je Akzentfarbe (activity-alias im Manifest); Orange ist per Manifest aktiv
    private val iconAliases = mapOf(
        "orange" to "IconOrange", "gold" to "IconGold", "red" to "IconRed",
        "blue" to "IconBlue", "green" to "IconGreen",
        "orange_light" to "IconOrangeLight", "gold_light" to "IconGoldLight", "red_light" to "IconRedLight",
        "blue_light" to "IconBlueLight", "green_light" to "IconGreenLight"
    )

    inner class IconBridge {
        @JavascriptInterface
        fun setIcon(name: String) {
            if (name in iconAliases) prefs.edit().putString("pending_icon", name).apply()
        }

        // Textdatei in Downloads speichern (Sicherung, Kalender); open=true öffnet sie danach in der passenden App
        @JavascriptInterface
        fun saveText(filename: String, mime: String, text: String, open: Boolean): Boolean {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q &&
                ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
                // Android 8/9: Berechtigung erfragen; der Nutzer wiederholt die Aktion danach
                runOnUiThread {
                    ActivityCompat.requestPermissions(this@MainActivity,
                        arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE), 78)
                }
                return false
            }
            return try {
                val uri: Uri? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val values = ContentValues().apply {
                        put(MediaStore.Downloads.DISPLAY_NAME, filename)
                        put(MediaStore.Downloads.MIME_TYPE, mime)
                        put(MediaStore.Downloads.IS_PENDING, 1)
                    }
                    val u = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                    u?.let {
                        contentResolver.openOutputStream(it)?.use { os -> os.write(text.toByteArray(Charsets.UTF_8)) }
                        values.clear(); values.put(MediaStore.Downloads.IS_PENDING, 0)
                        contentResolver.update(it, values, null, null)
                    }
                    u
                } else {
                    val f = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), filename)
                    f.writeText(text)
                    Uri.fromFile(f)
                }
                if (open && uri != null) {
                    runOnUiThread {
                        try {
                            startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri, mime)
                                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK))
                        } catch (e: Exception) { /* keine passende App: Datei liegt in Downloads */ }
                    }
                }
                uri != null
            } catch (e: Exception) { false }
        }

        // Tägliche Erinnerung: "ok" = geplant, "ask" = Berechtigung wird erfragt, Antwort per NOTIF._nativeResult
        @JavascriptInterface
        fun setReminder(on: Boolean, hour: Int): String {
            val h = hour.coerceIn(0, 23)
            prefs.edit().putBoolean("reminder_on", on).putInt("reminder_hour", h).apply()
            if (!on) { Reminder.cancel(this@MainActivity); return "ok" }
            if (Build.VERSION.SDK_INT >= 33 &&
                ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread {
                    ActivityCompat.requestPermissions(this@MainActivity,
                        arrayOf(Manifest.permission.POST_NOTIFICATIONS), 77)
                }
                return "ask"
            }
            Reminder.schedule(this@MainActivity, h)
            return "ok"
        }
    }

    override fun onRequestPermissionsResult(code: Int, perms: Array<out String>, results: IntArray) {
        super.onRequestPermissionsResult(code, perms, results)
        if (code != 77) return // 78 (Speicher) braucht keine weitere Aktion
        val ok = results.isNotEmpty() && results[0] == PackageManager.PERMISSION_GRANTED
        if (ok) Reminder.schedule(this, prefs.getInt("reminder_hour", 18))
        else prefs.edit().putBoolean("reminder_on", false).apply()
        webView.post { webView.evaluateJavascript("try{NOTIF._nativeResult($ok)}catch(e){}", null) }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        webView.setBackgroundColor(if (lightStart) 0xFFF4F4F1.toInt() else 0xFF0A0A0A.toInt())
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = false // es werden nur https-Seiten geladen, keine file://
            mediaPlaybackRequiresUserGesture = false
        }

        webView.addJavascriptInterface(IconBridge(), "BVIAndroid")
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    // Nur die Kamera, nur für die eigene Seite; Mikrofon und alles andere bleibt gesperrt
                    val onlyCamera = request.resources.isNotEmpty() &&
                        request.resources.all { it == PermissionRequest.RESOURCE_VIDEO_CAPTURE }
                    if (!onlyCamera || request.origin.host != "flametan.github.io") { request.deny(); return@runOnUiThread }
                    if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA)
                        == PackageManager.PERMISSION_GRANTED) {
                        request.grant(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE))
                    } else {
                        camRequest?.deny()
                        camRequest = request
                        camPermission.launch(Manifest.permission.CAMERA)
                    }
                }
            }

            override fun onPermissionRequestCanceled(request: PermissionRequest) {
                if (camRequest === request) camRequest = null
            }

            override fun onShowFileChooser(
                view: WebView, cb: ValueCallback<Array<Uri>>, params: FileChooserParams
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = cb
                return try { fileChooser.launch(params.createIntent()); true }
                catch (e: Exception) { fileCallback = null; false }
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                // Mail, Telefon und fremde Webseiten außerhalb der App öffnen
                val path = request.url.path ?: ""
                val own = request.url.host == "flametan.github.io" &&
                    (path == "/BVI-Lernwebsite" || path.startsWith("/BVI-Lernwebsite/"))
                if (request.url.scheme == "mailto" || request.url.scheme == "tel" ||
                    (request.url.scheme?.startsWith("http") == true && !own)) {
                    val action = if (request.url.scheme == "mailto") Intent.ACTION_SENDTO else Intent.ACTION_VIEW
                    try { startActivity(Intent(action, request.url)) } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "Keine passende App gefunden", Toast.LENGTH_SHORT).show()
                    }
                    return true
                }
                return false
            }
        }

        // Bei fehlgeschlagener Wiederherstellung (restoreState liefert null) frisch laden
        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            webView.loadUrl("https://flametan.github.io/BVI-Lernwebsite/")
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
        // Die Seite entscheidet: "handled" (Overlay/Schritt geschlossen), "exit" (Startseite) oder "back"
        val js = "(function(){try{return window.bviBack?window.bviBack():'back'}catch(e){return 'back'}})()"
        try {
            webView.evaluateJavascript(js) { r ->
                when (r?.trim('"')) {
                    "handled" -> {}
                    "exit" -> finish()
                    else -> fallbackBack()
                }
            }
        } catch (e: Exception) {
            fallbackBack()
        }
    }

    private fun fallbackBack() {
        if (webView.canGoBack()) webView.goBack() else finish()
    }
}
