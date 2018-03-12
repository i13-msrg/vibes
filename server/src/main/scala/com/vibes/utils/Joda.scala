package com.vibes.utils

import org.joda.time.DateTime

/**
  * https://stackoverflow.com/questions/9061141/how-to-define-an-ordering-in-scala
  */
object Joda {
  implicit def dateTimeOrdering: Ordering[DateTime] = Ordering.fromLessThan(_ isBefore _)
}
