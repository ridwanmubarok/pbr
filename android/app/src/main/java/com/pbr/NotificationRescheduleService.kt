package com.pbr

import android.content.Intent
import android.os.Build
import android.os.Bundle
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class NotificationRescheduleService : HeadlessJsTaskService() {

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        val extras = intent?.extras

        return HeadlessJsTaskConfig(
            "NotificationReschedule",
            extras?.let { Arguments.fromBundle(it) } ?: Arguments.createMap(),
            10000, // timeout in ms (10 seconds)
            true // allowedInForeground
        )
    }
}
