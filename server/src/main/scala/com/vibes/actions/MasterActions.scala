package com.vibes.actions

import com.vibes.actors.ReducerIntermediateResult
import com.vibes.models.VEventType
import com.vibes.utils.VExecution

object MasterActions {
  sealed trait Action

  case class CastWorkRequest(vote: VExecution.WorkRequest)                      extends Action
  case class FinishEvents(reducerIntermediateResult: ReducerIntermediateResult) extends Action
  case object Start                                                             extends Action
}
