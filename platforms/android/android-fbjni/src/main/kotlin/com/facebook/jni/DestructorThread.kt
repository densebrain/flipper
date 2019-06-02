/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.jni

import java.lang.ref.PhantomReference
import java.lang.ref.ReferenceQueue
import java.util.concurrent.atomic.AtomicReference

/**
 * A thread which invokes the "destruct" routine for objects after they have been garbage collected.
 *
 *
 * An object which needs to be destructed should create a static subclass of [Destructor].
 * Once the referent object is garbage collected, the DestructorThread will callback to the [ ][Destructor.destruct] method.
 *
 *
 * The underlying thread in DestructorThread starts when the first Destructor is constructed and
 * then runs indefinitely.
 */
class DestructorThread {
  /**
   * N.B The Destructor **SHOULD NOT** refer back to its referent object either explicitly or
   * implicitly (for example, as a non-static inner class). This will create a reference cycle where
   * the referent object will never be garbage collected.
   */
  abstract class Destructor : PhantomReference<Any> {

    internal var next: Destructor? = null
    internal var previous: Destructor? = null

    internal constructor(referent: Any) : super(referent, sReferenceQueue) {
      sDestructorStack!!.push(this)
    }

    internal constructor() : super(null, sReferenceQueue)

    /** Callback which is invoked when the original object has been garbage collected.  */
    abstract fun destruct()
  }

  companion object {
    /** A list to keep all active Destructors in memory confined to the Destructor thread.  */
    private var sDestructorList: DestructorList? = null
    /** A thread safe stack where new Destructors are placed before being add to sDestructorList.  */
    private var sDestructorStack: DestructorStack? = null

    private var sReferenceQueue: ReferenceQueue<Any>? = null
    private var sThread: Thread? = null



    init {
      sDestructorStack = DestructorStack()
      sReferenceQueue = ReferenceQueue()
      sDestructorList = DestructorList()
      sThread = object : Thread("HybridData DestructorThread") {
        override fun run() {
          while (true) {
            try {
              val current = sReferenceQueue!!.remove() as Destructor
              current.destruct()

              // If current is in the sDestructorStack,
              // transfer all the Destructors in the stack to the list.
              if (current.previous == null) {
                sDestructorStack!!.transferAllToList()
              }

              DestructorList.drop(current)
            } catch (e: InterruptedException) {
              // Continue. This thread should never be terminated.
            }

          }
        }
      }

      sThread!!.start()
    }
  }







  private class Terminus : Destructor() {
    override fun destruct() {
      throw IllegalStateException("Cannot destroy Terminus Destructor.")
    }
  }

  /** This is a thread safe, lock-free Treiber-like Stack of Destructors.  */
  private class DestructorStack {
    private val mHead = AtomicReference<Destructor?>(null)

    fun push(newHead: Destructor) {
      var oldHead: Destructor?
      do {
        oldHead = mHead.get()
        newHead.next = oldHead
      } while (!mHead.compareAndSet(oldHead, newHead))
    }

    fun transferAllToList() {
      var current: Destructor? = mHead.getAndSet(null)
      while (current != null) {
        val next = current.next
        sDestructorList!!.enqueue(current)
        current = next
      }
    }
  }

  /** A doubly-linked list of Destructors.  */
  class DestructorList {
    private val mHead: Destructor

    init {
      mHead = Terminus()
      mHead.next = Terminus()
      mHead.next!!.previous = mHead
    }

    fun enqueue(current: Destructor) {
      current.next = mHead.next
      mHead.next = current

      current.next!!.previous = current
      current.previous = mHead
    }

    companion object {
      internal fun drop(current: Destructor) {
        current.next!!.previous = current.previous
        current.previous!!.next = current.next
      }
    }
  }
}
