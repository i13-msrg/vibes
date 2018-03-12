package com.vibes.actors

import akka.actor.{Actor, ActorRef, Props}
import com.vibes.actions.{MasterActions, ReducerActions}
import com.vibes.models.{MinedBlock, TransferBlock, VEventType, VNode}
import com.vibes.utils.VConf
import org.joda.time._

// Takes final RAW result of the simulator and converts it to a format processable by a client
class ReducerActor(masterActor: ActorRef) extends Actor {
  private var nodes: Set[VNode] = Set.empty
  private var start             = DateTime.now

  override def preStart(): Unit = {
    start = DateTime.now
    println(s"ReducerActor started ${self.path}")
  }

  override def receive: Receive = {
    case ReducerActions.ReceiveNode(node) =>
      assert(!nodes.contains(node))
      nodes += node

      if (VConf.numberOfNodes == nodes.size) {
        val events = ReducerActor.calculateResult(nodes, start)
        masterActor ! MasterActions.FinishEvents(events)
      }
  }
}

case class ReducerIntermediateResult(
  events: List[VEventType],
  duration: Double,
  longestChainLength: Int,
  longestChainSize: Int,
  longestChainNumberTransactions: Int,
  timesAvgWithOutliers: (Float, Float, Float),
  timesAvgNoOutliers: (Float, Float, Float),
  firstBlockNumberOfRecipents: Int,
  lastBlockNumberOfRecipents: Int
)

object ReducerActor {
  def props(masterActor: ActorRef): Props = Props(new ReducerActor(masterActor))

  def calculateResult(nodes: Set[VNode], start: DateTime): ReducerIntermediateResult = {
    var events: List[VEventType] = List.empty
    var longestChain             = nodes.last.blockchain

    // find longestChain (aka longest distributed ledger)
    nodes.foreach { node =>
      if (node.blockchain.lengthCompare(longestChain.size) > 0) {
        longestChain = node.blockchain
      }
    }

    val size = longestChain.flatMap(_.transactions).size * VConf.transactionSize

    // remove all None nonsense
    val times: List[(Float, Float, Float)] = longestChain
      .map(block => block.calculatePropagationTimes())
      .filter(time => time._1.isDefined && time._2.isDefined && time._3.isDefined)
      .map(time => (time._1.getOrElse(0.toFloat), time._2.getOrElse(0.toFloat), time._3.getOrElse(0.toFloat)))

    val timesWithOutliers = times.foldLeft((0.0, 0.0, 0.0)) { (timesPrev, timesCurr: (Float, Float, Float)) =>
      (
        timesPrev._1 + timesCurr._1,
        timesPrev._2 + timesCurr._2,
        timesPrev._3 + timesCurr._3
      )
    }

    val timesNoOutliersFiltered = times.filter { time =>
      time._3.toInt < 180
    }

    val timesNoOutliers = timesNoOutliersFiltered
      .foldLeft((0.0, 0.0, 0.0)) { (timesPrev, timesCurr: (Float, Float, Float)) =>
        (
          timesPrev._1 + timesCurr._1,
          timesPrev._2 + timesCurr._2,
          timesPrev._3 + timesCurr._3,
        )
      }

    import java.text.DecimalFormat
    val formatter = new DecimalFormat("#.###")

    val timesSize = if (times.nonEmpty) times.size else 1
    val timesAvgWithOutliers = (formatter.format(timesWithOutliers._1 / timesSize).toFloat,
                                formatter.format(timesWithOutliers._2 / timesSize).toFloat,
                                formatter.format(timesWithOutliers._3 / timesSize).toFloat)

    val timesNoOutliersFilteredSize = if (timesNoOutliersFiltered.nonEmpty) timesNoOutliersFiltered.size else 1
    val timesAvgNoOutliers = (formatter.format(timesNoOutliers._1 / timesNoOutliersFilteredSize).toFloat,
                              formatter.format(timesNoOutliers._2 / timesNoOutliersFilteredSize).toFloat,
                              formatter.format(timesNoOutliers._3 / timesNoOutliersFilteredSize).toFloat)

    println("=========================================================================================================")
    println("===============================================OUTPUT====================================================")
    println("=========================================================================================================")

    val interval                       = new Interval(start, new Instant)
    val duration                       = interval.toDuration.toStandardSeconds.getSeconds.toDouble
    val longestChainLength             = longestChain.size
    val longestChainSize               = size
    val longestChainNumberTransactions = longestChain.flatMap(_.transactions).size

    println(s"SIMULATION TOOK... ${duration} SECONDS")
    println(s"LONGEST CHAIN... ${longestChainLength} BLOCKS")
    println(s"LONGEST CHAIN SIZE.... $longestChainSize KB")
    println(s"LONGEST CHAIN NUMBER OF TRANSACTIONS... ${longestChainNumberTransactions}")
    println(s"NUMBER OF BLOCKS FOR PROPAGATION TIME ${times.size}")
    println(s"BLOCK PROPAGATION TIME 10%... ${timesAvgWithOutliers._1} SECONDS")
    println(s"BLOCK PROPAGATION TIME 50%... ${timesAvgWithOutliers._2} SECONDS")
    println(s"BLOCK PROPAGATION TIME 90%... ${timesAvgWithOutliers._3} SECONDS")

    println(s"NUMBER OF BLOCKS FOR PROPAGATION TIME (NO OUTLIERS) ${timesNoOutliersFiltered.size}")
    println(s"BLOCK PROPAGATION TIME 10% (NO OUTLIERS)... ${timesAvgNoOutliers._1} SECONDS")
    println(s"BLOCK PROPAGATION TIME 50% (NO OUTLIERS)... ${timesAvgNoOutliers._2} SECONDS")
    println(s"BLOCK PROPAGATION TIME 90% (NO OUTLIERS)... ${timesAvgNoOutliers._3} SECONDS")
    // +1 cause we don't count origin
    val firstBlockNumberOfRecipents = longestChain.last.numberOfRecipients + 1
    println(s"FIRST BLOCK RECEIVED BY... ${firstBlockNumberOfRecipents}  OUT OF ${VConf.numberOfNodes} NODES")
    val lastBlockNumberOfRecipents = longestChain.head.numberOfRecipients + 1
    println(s"LAST BLOCK RECEIVED BY... ${lastBlockNumberOfRecipents} OUT OF ${VConf.numberOfNodes} NODES")

    events = longestChain.flatMap { block =>
      var blockEvents: List[VEventType] = List.empty
      blockEvents ::= MinedBlock(block.origin, timestamp = block.timestamp)
      blockEvents :::= block.currentRecipients.map { recipient =>
        TransferBlock(recipient.from, recipient.to, timestamp = recipient.timestamp)
      }

      blockEvents
    }

    import com.vibes.utils.Joda._

    ReducerIntermediateResult(
      events.sortBy(_.timestamp),
      duration,
      longestChainLength,
      longestChainSize,
      longestChainNumberTransactions,
      timesAvgWithOutliers,
      timesAvgNoOutliers,
      firstBlockNumberOfRecipents,
      lastBlockNumberOfRecipents
    )
  }
}
