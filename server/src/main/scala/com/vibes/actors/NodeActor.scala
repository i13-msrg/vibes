package com.vibes.actors

import java.util.UUID

import akka.actor.{Actor, ActorRef, Props}
import akka.util.Timeout
import com.typesafe.scalalogging.LazyLogging
import com.vibes.actions._
import com.vibes.models.{VBlock, VNode, VTransaction}
import com.vibes.utils.{VConf, VExecution}
import org.joda.time.DateTime

import scala.collection.SortedMap
import scala.concurrent.duration._

/**
  * A node in a blockchain network. Currently represents both miner & a full node
  */
class NodeActor (
  masterActor: ActorRef,
  nodeRepoActor: ActorRef,
  discoveryActor: ActorRef,
  reducerActor: ActorRef,
  lat: Double,
  lng: Double
) extends Actor with LazyLogging {
  implicit val timeout: Timeout = Timeout(20.seconds)
  private var node = new VNode(
    id = UUID.randomUUID().toString,
    actor = self,
    blockchain = List.empty,
    transactionPool = Set.empty,
    neighbourActors = Set.empty,
    nextRecipient = None,
    lat = lat,
    long = lng
  )

  /**
    * Every node has a priority queue of executables, current implementation utilizes TreeMap / SortedMap instead
    * because I'd also need to filter the Queue by criteria later. Node workRequest with those executables to the MasterActor
    * and the Node with the smallest timestamp for workRequestd executable receives the right to fast-forward the network
    * aka run the executable and its Queue. The executable is then removed from the Queue, then the appropriate Nodes
    * recompute their Queues and workRequest again recursively
    */
  private var executables: SortedMap[VExecution.WorkRequest, VExecution.Value] = SortedMap.empty

  private def addExecutablesForMineBlock(now: DateTime): Unit = {
    val timestamp     = node.createTimestampForNextBlock(now)
    val exWorkRequest = node.createExecutableWorkRequest(self, timestamp, VExecution.ExecutionType.MineBlock)
    val value = () => {
      println(s"BLOCK MINED AT SIZE ${node.blockchain.size}..... $timestamp, ${self.path}")
      logger.debug(s"BLOCK MINED AT SIZE ${node.blockchain.size}..... $timestamp, ${self.path}")
      node = node.addBlock(VBlock.createWinnerBlock(node, timestamp))
      addExecutablesForPropagateOwnBlock(timestamp)
      nodeRepoActor ! NodeRepoActions.AnnounceNextWorkRequestAndMine(timestamp)
    }
    executables += exWorkRequest -> value
  }

  private def addExecutableForIssueTransaction(toActor: ActorRef, timestamp: DateTime): Unit = {
    val transaction = VTransaction.createOne(self, toActor, timestamp)
    val exWorkRequest =
      transaction.createExecutableWorkRequest(self, self, timestamp, VExecution.ExecutionType.IssueTransaction)
    val value = () => {
      node.addTransaction(transaction)
      addExecutablesForPropagateTransaction(transaction, timestamp)
      self ! NodeActions.CastNextWorkRequestOnly
    }
    executables += exWorkRequest -> value
  }

  private def addExecutablesForPropagateOwnBlock(timestamp: DateTime): Unit = {
    node.neighbourActors.foreach { neighbour =>
      val exWorkRequest = node.createExecutableWorkRequest(
        neighbour,
        timestamp.plusMillis(VConf.propagationDelay),
        VExecution.ExecutionType.PropagateOwnBlock
      )
      val hash = node.createBlockchainHash()
      val value = () => {
        neighbour ! NodeActions.ReceiveBlock(node, node.blockchain.head, exWorkRequest.timestamp, hash)
        self ! NodeActions.CastNextWorkRequestOnly
      }
      executables += exWorkRequest -> value
    }
  }

  def addExecutablesForPropagateTransaction(transaction: VTransaction, timestamp: DateTime): Unit = {
    node.neighbourActors.foreach { neighbour =>
      val exWorkRequest = transaction
        .createExecutableWorkRequest(self,
                                     neighbour,
                                     timestamp.plusMillis(150), // todo
                                     VExecution.ExecutionType.PropagateTransaction)
      val value = () => {
        neighbour ! NodeActions.ReceiveTransaction(node, transaction, exWorkRequest.timestamp)
        self ! NodeActions.CastNextWorkRequestOnly
      }
      executables += exWorkRequest -> value
    }
  }

  private def addExecutablesForPropagateExternalBlock(now: DateTime): Unit = {
    node.neighbourActors.foreach { neighbour =>
      val workRequest = node.createExecutableWorkRequest(neighbour,
                                                         now.plusMillis(VConf.propagationDelay),
                                                         VExecution.ExecutionType.PropagateExternalBlock)
      val hash = node.createBlockchainHash()
      val value = () => {
        neighbour ! NodeActions.ReceiveBlock(node, node.blockchain.head, workRequest.timestamp, hash)
        self ! NodeActions.CastNextWorkRequestOnly
      }
      executables += workRequest -> value
    }
  }

  override def preStart(): Unit = {
    println(s"NodeActor started ${self.path}")
    logger.debug(s"NodeActor started ${self.path}")

    discoveryActor ! DiscoveryActions.ReceiveNode(node)
  }

  override def preRestart(reason: Throwable, message: Option[Any]): Unit = {
    println(s"PRERESTART.... ${self.path}")
  }

  override def receive: Receive = {
    case NodeActions.StartSimulation(now) =>
      println(s"StartSimulation ${now} ${self}")
      logger.debug(s"StartSimulation ${now} ${self}")
      addExecutablesForMineBlock(now)

      self ! NodeActions.CastNextWorkRequestOnly

    case NodeActions.CastNextWorkRequestOnly =>
      masterActor ! MasterActions.CastWorkRequest(executables.head._1)

    /**
      * Comes from a sender() that just mined a block, so his block executables should be empty and all other
      * nodes should remove their MineBlock executables so that they can do their best guesses via
      * addExecutablesForMineBlock(timestamp) again
      */
    case NodeActions.CastNextWorkRequestAndMine(timestamp, sender) =>
      val count = if (sender != self) 1 else 0
      assert(
        executables.count(executable => executable._1.executionType == VExecution.ExecutionType.MineBlock) == count
      )
      if (sender != self) {
        // delete previous guess to generate a new one, only the broadcaster / sender doesn't delete his block
        executables = executables
          .filter(executable => executable._1.executionType != VExecution.ExecutionType.MineBlock)
      }

      addExecutablesForMineBlock(timestamp)
      self ! NodeActions.CastNextWorkRequestOnly

    case NodeActions.ProcessNextExecutable(workRequest) =>
      val head = executables.head

      assert(
        workRequest.id == head._1.id ||
          (
            workRequest.id != head._1.id &&
              workRequest.executionType == VExecution.ExecutionType.PropagateTransaction &&
              head._1.executionType == workRequest.executionType
          )
      )

      executables = executables.tail

      head._2()

    case NodeActions.ReceiveBlock(origin, block, now, hash) =>
      if (block.level + 1 > node.blockchain.size) {

        val incomingBlock = block.addRecipient(origin, node, now)

        if (NodeActor.shouldSynch(node, hash)) {
          node = node.synch(origin, origin.blockchain, now)
        } else {
          node = node.addBlock(incomingBlock)
        }

        addExecutablesForPropagateExternalBlock(now)
      }
      self ! NodeActions.CastNextWorkRequestOnly

    case NodeActions.ReceiveNeighbours(neighbours) =>
      node = node.exchangeNeighbours(neighbours)

    case NodeActions.IssueTransaction(toActor, time) =>
      addExecutableForIssueTransaction(toActor, time)

    case NodeActions.ReceiveTransaction(origin, transaction, timestamp) =>
      if (node.isTransactionNew(transaction)) {
        val incomingTransaction = transaction.addRecipient(origin, node, timestamp)
        node = node.addTransaction(incomingTransaction)
        addExecutablesForPropagateTransaction(transaction, timestamp)
      }

      self ! NodeActions.CastNextWorkRequestOnly

    case NodeActions.End =>
      reducerActor ! ReducerActions.ReceiveNode(node)
  }
}

object NodeActor {
  def props(
    masterActor: ActorRef,
    nodeRepoActor: ActorRef,
    discoveryActor: ActorRef,
    reducerActor: ActorRef,
    lat: Double,
    lng: Double
  ): Props = Props(new NodeActor(masterActor, nodeRepoActor, discoveryActor, reducerActor, lat, lng))
  def shouldSynch(node: VNode, hash: Int): Boolean = {
    node.createBlockchainHash() != hash
  }
}
