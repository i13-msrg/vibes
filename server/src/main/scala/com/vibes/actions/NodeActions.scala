package com.vibes.actions

import akka.actor.ActorRef
import com.vibes.models.{VBlock, VNode, VTransaction}
import com.vibes.utils.VExecution
import org.joda.time.DateTime

object NodeActions {
  sealed trait Action

  case class ReceiveBlock(origin: VNode, newBlock: VBlock, timestamp: DateTime, blockchainCode: Int) extends Action
  case class ReceiveNeighbours(neighbours: Set[ActorRef])                                            extends Action
  case class StartSimulation(now: DateTime)                                                          extends Action
  case class ProcessNextExecutable(vote: VExecution.WorkRequest)                                     extends Action
  case class CastNextWorkRequestAndMine(timestamp: DateTime, sender: ActorRef)                       extends Action
  case class IssueTransaction(toActor: ActorRef, time: DateTime)                                     extends Action
  case class ReceiveTransaction(origin: VNode, transaction: VTransaction, time: DateTime)            extends Action
  case class IssueTransactionFloodAttack(toActor: ActorRef, time: DateTime)                          extends Action

  case object CastNextWorkRequestOnly extends Action
  case object End                     extends Action
}
