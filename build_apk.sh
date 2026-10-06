#!/bin/bash
set -e

echo "=== Building Real Android APK for LQB Maintenance ==="
WORK_DIR="/tmp/android_build"
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR/src/com/pertamina/pheoses/lqbmaintenance"
mkdir -p "$WORK_DIR/res/values"
mkdir -p "$WORK_DIR/res/drawable"
mkdir -p "$WORK_DIR/bin"
mkdir -p "$WORK_DIR/obj"

# 1. Strings.xml
cat << 'EOF' > "$WORK_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">LQB Maintenance</string>
</resources>
EOF

# 2. Copy launcher icon if exists or create dummy png
if [ -f "public/pwa-192x192.png" ]; then
    cp "public/pwa-192x192.png" "$WORK_DIR/res/drawable/ic_launcher.png"
elif [ -f "public/apple-touch-icon.png" ]; then
    cp "public/apple-touch-icon.png" "$WORK_DIR/res/drawable/ic_launcher.png"
else
    # Create dummy 1x1 png if not found
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > "$WORK_DIR/res/drawable/ic_launcher.png"
fi

# 3. AndroidManifest.xml
cat << 'EOF' > "$WORK_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.pertamina.pheoses.lqbmaintenance"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher"
        android:theme="@android:style/Theme.NoTitleBar">
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 4. MainActivity.java
cat << 'EOF' > "$WORK_DIR/src/com/pertamina/pheoses/lqbmaintenance/MainActivity.java"
package com.pertamina.pheoses.lqbmaintenance;

import android.app.Activity;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        
        mWebView = new WebView(this);
        WebSettings webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setLoadsImagesAutomatically(true);

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        mWebView.loadUrl("https://ais-dev-7n3alfqtwaecyzzdgblk33-93847901457.asia-southeast1.run.app");
        setContentView(mWebView);
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
EOF

ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"

echo "1. Compiling resources with aapt..."
aapt package -f -m \
    -S "$WORK_DIR/res" \
    -J "$WORK_DIR/src" \
    -M "$WORK_DIR/AndroidManifest.xml" \
    -I "$ANDROID_JAR"

echo "2. Compiling Java sources with javac..."
javac -d "$WORK_DIR/obj" \
    -classpath "$ANDROID_JAR" \
    -source 1.8 -target 1.8 \
    $(find "$WORK_DIR/src" -name "*.java")

echo "3. Converting to Dalvik bytecode (classes.dex) with dalvik-exchange..."
dalvik-exchange --dex --output="$WORK_DIR/bin/classes.dex" "$WORK_DIR/obj"

echo "4. Creating unsigned APK package with aapt..."
aapt package -f \
    -M "$WORK_DIR/AndroidManifest.xml" \
    -S "$WORK_DIR/res" \
    -I "$ANDROID_JAR" \
    -F "$WORK_DIR/bin/app-unsigned.apk"

# Add classes.dex into APK
cd "$WORK_DIR/bin"
aapt add "app-unsigned.apk" "classes.dex"
cd -

echo "5. Generating release keystore..."
KEYSTORE="$WORK_DIR/release.keystore"
keytool -genkeypair -v \
    -keystore "$KEYSTORE" \
    -alias lqb_key \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass pertamina123 \
    -keypass pertamina123 \
    -dname "CN=Pertamina PHE OSES, OU=Offshore, O=Pertamina, L=Jakarta, ST=DKI, C=ID"

echo "6. Signing APK with jarsigner..."
jarsigner -verbose \
    -keystore "$KEYSTORE" \
    -storepass pertamina123 \
    -keypass pertamina123 \
    "$WORK_DIR/bin/app-unsigned.apk" \
    lqb_key

echo "7. Aligning APK with zipalign..."
mkdir -p "public/downloads"
zipalign -v -p 4 "$WORK_DIR/bin/app-unsigned.apk" "public/downloads/LQB_Maintenance.apk"

# Also copy to root public for direct access
cp "public/downloads/LQB_Maintenance.apk" "public/LQB_Maintenance.apk"

echo "=== SUCCESS! Real APK Created at public/downloads/LQB_Maintenance.apk ==="
ls -lh "public/downloads/LQB_Maintenance.apk"
