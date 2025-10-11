package com.example.vistarapp.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Purple80,
    secondary = PurpleGrey80,
    tertiary = Pink80
)

private val LightColorScheme = lightColorScheme(
    primary = Purple40,             // #1976D2
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFF90CAF9),   // lighter blue container
    onPrimaryContainer = Color(0xFF0D47A1), // readable on light container

    secondary = PurpleGrey40,       // #64B5F6
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFE3F2FD), // very light blue for subtle accents
    onSecondaryContainer = Color(0xFF0D47A1),

    tertiary = Pink40,              // #1565C0
    onTertiary = Color(0xFFFFFFFF),

    background = Color(0xFFF9FAFB), // requested white
    surface = Color(0xFFF9FAFB),    // align surfaces to white tint
    onBackground = Color(0xFF1C1B1F),
    onSurface = Color(0xFF1C1B1F),

    surfaceVariant = Color(0xFFE9F2FB),     // bluish tint for cards/lists
    onSurfaceVariant = Color(0xFF40484F),
    outline = Color(0xFF90CAF9),            // soft blue outline for borders
)

@Composable
fun VISTARAPPTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Use fixed brand colors (blue/white); disable dynamic colors
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}