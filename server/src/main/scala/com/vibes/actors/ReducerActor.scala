package com.vibes.actors

import akka.actor.{Actor, ActorRef, Props}
import com.typesafe.scalalogging.LazyLogging
import com.vibes.actions.{MasterActions, ReducerActions}
import com.vibes.models._
import com.vibes.utils.VConf
import org.joda.time._

// Takes final RAW result of the simulator and converts it to a format processable by a client

/*
* Once the simulation is over, the Reducer takes a set of all nodes as input and finds
* the longest chain in the network (every Node holds a blockchain). The longest chain
* contains a list of blocks with arrival times and recipients. Each block contains a list
* of transaction with arrival times and recipients as well. Based on this information it is
* trivial to compute the final output of the simulator.
* The lists of recipient and arrival times are an implementation detail of VIBES that helps
* us backtrack events in the network, they do not necessarily correspond to any entity in a
* real blockchain network
*/
class ReducerActor(masterActor: ActorRef) extends Actor with LazyLogging {
  private var nodes: Set[VNode] = Set.empty
  private var start             = DateTime.now
  private var transactionPool: Set[VTransaction] = Set.empty

  override def preStart(): Unit = {
    start = DateTime.now
    logger.debug(s"ReducerActor started ${self.path}")
    println(s"ReducerActor started ${self.path}")
  }

  override def receive: Receive = {
    case ReducerActions.ReceiveNode(node) =>
      assert(!nodes.contains(node))
      nodes += node

      if (VConf.numberOfNodes == nodes.size) {
        val events = ReducerActor.calculateResult(nodes, start, transactionPool)
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
  firstBlockNumberOfRecipients: Int,
  lastBlockNumberOfRecipients: Int,
  maxProcessedTransactions: Int
)

object ReducerActor extends LazyLogging {
  def props(masterActor: ActorRef): Props = Props(new ReducerActor(masterActor))

  def calculateResult(nodes: Set[VNode], start: DateTime, transactionPool: Set[VTransaction]): ReducerIntermediateResult = {
    var events: List[VEventType] = List.empty
    var longestChain             = nodes.last.blockchain
    var lastNode = nodes.last

    // find longestChain (aka longest distributed ledger)
    nodes.foreach { node =>
      if (node.blockchain.lengthCompare(longestChain.size) > 0) {
        longestChain = node.blockchain
        lastNode = node
      }
    }

    // find all transactions in the transactionPools
    nodes.foreach { node =>
      node.transactionPool.foreach( transaction =>
        if ( ! transactionPool.contains(transaction)) {
          transactionPool.+(transaction)
        }
      )
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
    val formatter = new DecimalFormat("#,###") // this should be depending on the regional settings of the host pc. Point for Germany, comma for english speaking countries

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

    // logging
    logger.debug(s"SIMULATION TOOK... ${duration} SECONDS")
    logger.debug(s"LONGEST CHAIN... ${longestChainLength} BLOCKS")
    logger.debug(s"LONGEST CHAIN SIZE.... $longestChainSize KB")
    logger.debug(s"LONGEST CHAIN NUMBER OF TRANSACTIONS... ${longestChainNumberTransactions}")
    logger.debug(s"NUMBER OF BLOCKS FOR PROPAGATION TIME ${times.size}")
    logger.debug(s"BLOCK PROPAGATION TIME 10%... ${timesAvgWithOutliers._1} SECONDS")
    logger.debug(s"BLOCK PROPAGATION TIME 50%... ${timesAvgWithOutliers._2} SECONDS")
    logger.debug(s"BLOCK PROPAGATION TIME 90%... ${timesAvgWithOutliers._3} SECONDS")

    logger.debug(s"NUMBER OF BLOCKS FOR PROPAGATION TIME (NO OUTLIERS) ${timesNoOutliersFiltered.size}")
    logger.debug(s"BLOCK PROPAGATION TIME 10% (NO OUTLIERS)... ${timesAvgNoOutliers._1} SECONDS")
    logger.debug(s"BLOCK PROPAGATION TIME 50% (NO OUTLIERS)... ${timesAvgNoOutliers._2} SECONDS")
    logger.debug(s"BLOCK PROPAGATION TIME 90% (NO OUTLIERS)... ${timesAvgNoOutliers._3} SECONDS")

    // +1 cause we don't count origin
    val firstBlockNumberOfRecipients = longestChain.last.numberOfRecipients + 1
    println(s"FIRST BLOCK RECEIVED BY... ${firstBlockNumberOfRecipients}  OUT OF ${VConf.numberOfNodes} NODES")
    logger.debug(s"FIRST BLOCK RECEIVED BY... ${firstBlockNumberOfRecipients}  OUT OF ${VConf.numberOfNodes} NODES")

    val lastBlockNumberOfRecipients = longestChain.head.numberOfRecipients + 1
    println(s"LAST BLOCK RECEIVED BY... ${lastBlockNumberOfRecipients} OUT OF ${VConf.numberOfNodes} NODES")
    logger.debug(s"LAST BLOCK RECEIVED BY... ${lastBlockNumberOfRecipients} OUT OF ${VConf.numberOfNodes} NODES")

    val amountOfTransactionsInTransactionpool = lastNode.transactionPool.size
    println(s"TOTAL TRANSACTION POOL... ${amountOfTransactionsInTransactionpool}")
    logger.debug(s"TOTAL TRANSACTION POOL... ${amountOfTransactionsInTransactionpool}")
    logger.debug(s"TOTAL TRANSACTION POOL... ${longestChain.head.transactionPoolSize}")

    val maxProcessedTransactions = Math.floor(VConf.maxBlockSize / VConf.transactionSize).toInt
    logger.debug(s"MAXIMUM POSSIBLE TRANSACTIONS PER BLOCK... $maxProcessedTransactions")
    println(s"MAXIMUM POSSIBLE TRANSACTIONS PER BLOCK... $maxProcessedTransactions")

    events = longestChain.flatMap { block =>
      var blockEvents: List[VEventType] = List.empty
      blockEvents ::= MinedBlock(block.origin, timestamp = block.timestamp, transactionPoolSize = block.transactionPoolSize, level = block.level, transactions = block.transactions)
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
      firstBlockNumberOfRecipients,
      lastBlockNumberOfRecipients,
      maxProcessedTransactions
    )
  }
}
