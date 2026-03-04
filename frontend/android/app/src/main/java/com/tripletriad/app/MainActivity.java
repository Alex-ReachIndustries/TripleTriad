package com.tripletriad.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Edge-to-edge: draw behind system bars
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);
        getWindow().setNavigationBarColor(android.graphics.Color.TRANSPARENT);

        // White status bar icons for dark background
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);

        // Inject actual system bar heights into WebView CSS custom properties
        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (view, insets) -> {
            Insets bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            float density = getResources().getDisplayMetrics().density;
            int topDp = Math.round(bars.top / density);
            int bottomDp = Math.round(bars.bottom / density);
            int leftDp = Math.round(bars.left / density);
            int rightDp = Math.round(bars.right / density);

            try {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    String js = String.format(
                        "document.documentElement.style.setProperty('--sat','%dpx');" +
                        "document.documentElement.style.setProperty('--sab','%dpx');" +
                        "document.documentElement.style.setProperty('--sal','%dpx');" +
                        "document.documentElement.style.setProperty('--sar','%dpx');",
                        topDp, bottomDp, leftDp, rightDp
                    );
                    webView.post(() -> webView.evaluateJavascript(js, null));
                }
            } catch (Exception ignored) {
                // Bridge may not be ready yet on first call
            }

            return ViewCompat.onApplyWindowInsets(view, insets);
        });
    }
}
