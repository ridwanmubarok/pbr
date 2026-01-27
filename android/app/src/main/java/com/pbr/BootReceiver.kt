package com.pbr

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.HeadlessJsTaskService

class BootReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        Log.d(TAG, "Boot completed received: ${intent?.action}")

        if (context == null || intent == null) {
            Log.w(TAG, "Context or intent is null")
            return
        }

        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON" ||
            intent.action == "com.htc.intent.action.QUICKBOOT_POWERON") {

            Log.d(TAG, "Starting notification reschedule service...")

            try {
                // Acquire wake lock to ensure the service can complete
                HeadlessJsTaskService.acquireWakeLockNow(context)

                // Start the headless JS service to reschedule notifications
                val serviceIntent = Intent(context, NotificationRescheduleService::class.java)

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    // For Android 8.0+, use startForegroundService
                    context.startForegroundService(serviceIntent)
                } else {
                    // For older versions, use startService
                    context.startService(serviceIntent)
                }

                Log.d(TAG, "Notification reschedule service started successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start notification reschedule service", e)
            }
        }
    }
}
