package com.vibes.utils

import akka.actor.ActorRef
import org.joda.time.DateTime

object VExecution {
  object ExecutionType extends Enumeration {
    val MineBlock, PropagateOwnBlock, PropagateExternalBlock, IssueTransaction, PropagateTransaction = Value
  }

  case class WorkRequest(
    id: String,
    fromActor: ActorRef,
    toActor: ActorRef,
    timestamp: DateTime,
    executionType: ExecutionType.Value
  )

  object WorkRequest {
    import com.vibes.utils.Joda._
    implicit val OrderingWorkRequest: Ordering[WorkRequest] = Ordering
      .by(workRequest => (workRequest.timestamp, workRequest.id))
  }

  type Value = () => Unit
}
