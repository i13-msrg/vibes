package com.vibes.actions

import org.joda.time.DateTime

object NodeRepoActions {
  sealed trait Action

  case class AnnounceStart(now: DateTime)                        extends Action
  case class AnnounceNextWorkRequestAndMine(timestamp: DateTime) extends Action

  case object RegisterNode                extends Action
  case object AnnounceNextWorkRequestOnly extends Action
  case object AnnounceEnd                 extends Action
}
