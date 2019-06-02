package org.stato.android

import android.os.Process
import org.stato.core.StatoThread

internal class AndroidStatoThread(name: String) : StatoThread(name) {

  override fun run() {
    Process.setThreadPriority(Process.THREAD_PRIORITY_BACKGROUND)
    super.run()
  }
}