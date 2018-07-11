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

/*
* The NodeActor represents both a full Node and a miner in the blockchain network. As
* described in Chapter 6, it is a good opportunity for future work to differentiate between
* both.
* In VIBES, each NodeActor has its own blockchain, pool of pending transactions
* (candidates for the next block) and neighbours. It also works to solve the next block in
* the chain. A Node has its own priority queue of executables and the next solution of
* a block by this Node is represented by the first executable of type MineBlock in the queue.
* As a reminder, a NodeActor’s executables types are either MineBlock, IssueTransaction,
* PropagateTransaction or PropagateBlock.
* A vote is represented by a best guess (timestamped work request) sent to the
* Coordinator. The NodeActor sends votes to the Coordinator and is only allowed to
* execute a piece of work once the Coordinator has granted a permission based on the votes.
* Moreover, this Actor receives and propagates blocks from other Nodes in the network. If
* a received block comes from a longer chain, the Actor takes care to follow synchronization
* steps described in Section 2.7. The Node synchronizes its blockchain, pool of transactions,
* rolls back any orphan blocks and adds any valid transactions from orphan blocks back
* to the transaction pool if they are not already included in the chain. Besides blocks, the
* NodeActor also takes care to propagate and create transactions in the network.
*/
class NodeActor (
  masterActor: ActorRef,
  nodeRepoActor: ActorRef,
  discoveryActor: ActorRef,
  reducerActor: ActorRef,
  lat: Double,
  lng: Double,
  isEvil: Option[Boolean]
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
    long = lng,
    isMalicious = isEvil
  )

  /**
    * Every node has a priority queue of executables, current implementation utilizes TreeMap / SortedMap instead
    * because I'd also need to filter the Queue by criteria later. Node workRequest with those executables to the MasterActor
    * and the Node with the smallest timestamp for workRequested executable receives the right to fast-forward the network
    * aka run the executable and its Queue. The executable is then removed from the Queue, then the appropriate Nodes
    * recompute their Queues and workRequest again recursively
    */
  private var executables: SortedMap[VExecution.WorkRequest, VExecution.Value] = SortedMap.empty

  var blockList: Set[VBlock] = Set.empty

  private def addExecutablesForMineBlock(now: DateTime): Unit = {
    val timestamp = node.createTimestampForNextBlock(now)
    val exWorkRequest = node.createExecutableWorkRequest(self, timestamp, VExecution.ExecutionType.MineBlock)

    val value = () => {
      val newBlock = VBlock.createWinnerBlock(node, timestamp)

      if (VConf.isAlternativeHistoryAttack) {
        addBlockIfAlternativeHistoryAttack(timestamp, newBlock)
      } else {
        logger.debug(s"BLOCK MINED AT LEVEL ${node.blockchain.size + 1}..... $timestamp, ${self.path}")
        node = node.addBlock(newBlock)
      }

      reducerActor ! ReducerActions.AddBlock(newBlock)
      addExecutablesForPropagateOwnBlock(timestamp)
      nodeRepoActor ! NodeRepoActions.AnnounceNextWorkRequestAndMine(timestamp)
    }
    executables += exWorkRequest -> value
  }

  private def addExecutableForIssueTransaction(toActor: ActorRef, timestamp: DateTime): Unit = {
    val transaction = VTransaction.createOne(self, toActor, timestamp, node.blockchain.size)
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
        timestamp.plusMillis(VConf.blockPropagationDelay),
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
                                     timestamp.plusMillis(VConf.transactionPropagationDelay), // todo
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
                                                         now.plusMillis(VConf.blockPropagationDelay),
                                                         VExecution.ExecutionType.PropagateExternalBlock)
      val hash = node.createBlockchainHash()
      val value = () => {
        if (node.blockchain.isEmpty) {
          logger.debug(s"empty ${self.path}")
        }
        neighbour ! NodeActions.ReceiveBlock(node, node.blockchain.head, workRequest.timestamp, hash)
        self ! NodeActions.CastNextWorkRequestOnly
      }
      executables += workRequest -> value
    }
  }

  // method only for alternative history attack
  private def addBlockIfAlternativeHistoryAttack(timestamp: DateTime, newBlock: VBlock): Unit = {
    if (node.isMalicious.contains(true)) {
      logger.debug(s"EVIL BLOCK MINED AT LEVEL ${node.blockchain.size + 1} .....")
      // logger.debug(s"EVIL BLOCK MINED AT LEVEL ${node.blockchain.size + 1} BY NODE ${node.id}.....")
      // logger.debug(s"$timestamp, ${self.path}")
    } else {
      logger.debug(s"GOOD BLOCK MINED AT LEVEL ${node.blockchain.size + 1} .....")
      // logger.debug(s"GOOD BLOCK MINED AT LEVEL ${node.blockchain.size + 1} BY NODE ${node.id}.....")
      // logger.debug(s"$timestamp, ${self.path}")
    }

    // checks if to add block
    if (VConf.attackSuccessful) {
      logger.debug(s"addBlockIfAlternativeHistoryAttack: VConf.attackSuccessful")
      node = node.addBlock(newBlock)
    } else if (VConf.attackFailed) {
      logger.debug(s"addBlockIfAlternativeHistoryAttack: VConf.attackFailed")
      node = node.addBlock(newBlock)
    } else if (newBlock.level == 1 && node.isMalicious != newBlock.origin.isMalicious) { // block zero is the common block
      logger.debug(s"addBlockIfAlternativeHistoryAttack: newBlock.level == 1")
      node = node.addBlock(newBlock)
    } else if (newBlock.level == 0) {
      logger.debug(s"addBlockIfAlternativeHistoryAttack: newBlock.level == 0")
      node = node.addBlock(newBlock)
    } else if (node.isMalicious == newBlock.origin.isMalicious && node.blockchain.head.timestamp.isBefore(newBlock.timestamp)) {
      logger.debug(s"addBlockIfAlternativeHistoryAttack: added newBlock")
      node = node.addBlock(newBlock)
    } else {
      logger.debug(s"addBlockIfAlternativeHistoryAttack: Didn't add newBlock  ${newBlock.level}, ${VConf.attackSuccessful} and ${VConf.attackFailed}")
    }

    // checks if attack is finished
    if (!VConf.attackFailed && !VConf.attackSuccessful) {
      // sets good and evil chain length
      if (node.blockchain.size == 1) {
        VConf.evilChainLength = node.blockchain.size
        VConf.goodChainLength = node.blockchain.size
      } else if (node.isMalicious.contains(true)) {
        if (node.blockchain.size > VConf.evilChainLength) {
          VConf.evilChainLength = node.blockchain.size
        }
      } else if (node.isMalicious.contains(false)) {
        if (node.blockchain.size > VConf.goodChainLength) {
          VConf.goodChainLength = node.blockchain.size
        }
      }

      // prints chain lengths
      logger.debug(s"GOOD CHAIN LENGTH: ${VConf.goodChainLength}; BAD CHAIN LENGTH ${VConf.evilChainLength}")

      // checks if attack succeeded
      if (VConf.evilChainLength > VConf.goodChainLength && VConf.goodChainLength > VConf.confirmations) {
        logger.debug(s"ATTACK IS SUCCESSFUL.....")
        VConf.attackSuccessful = true
        VConf.attackSuccessfulInBlocks = node.blockchain.size
        discoveryActor ! DiscoveryActions.AnnounceNeighbours
      }

      // checks if attack failed
      if (((VConf.evilChainLength > VConf.attackDuration && VConf.goodChainLength > VConf.confirmations) || VConf.goodChainLength > VConf.attackDuration) && !VConf.attackSuccessful) {
        logger.debug(s"ATTACK FAILED.....  $timestamp, ${self.path}")
        VConf.attackFailed = true
        discoveryActor ! DiscoveryActions.AnnounceNeighbours
      }

      // updates neighbours to make only evil nodes work with evil nodes and good nodes with good nodes after one common block
      if (newBlock.level == 0) {
        discoveryActor ! DiscoveryActions.AnnounceNeighbours
      }
    }
  }

  override def preStart(): Unit = {
    logger.debug(s"NodeActor started ${self.path}")

    discoveryActor ! DiscoveryActions.ReceiveNode(node)
  }

  override def preRestart(reason: Throwable, message: Option[Any]): Unit = {
    VConf.attackSuccessful = false
    VConf.goodChainLength = 0
    VConf.evilChainLength = 0
    VConf.attackFailed = false
    logger.debug(s"REASON.... $reason")
    logger.debug(s"MESSAGE.... $message")
    logger.debug(s"PRERESTART.... ${self.path}")
  }

  override def receive: Receive = {
    case NodeActions.StartSimulation(now) =>
      logger.debug(s"StartSimulation $now $self")
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
      if (VConf.isAlternativeHistoryAttack) {
        if (block.level + 1 > node.blockchain.size && (node.isMalicious.contains(true) == block.origin.isMalicious.contains(true) || block.level == 0) && !VConf.attackSuccessful && !VConf.attackFailed) {
          val incomingBlock = block.addRecipient(origin, node, now)

          if (NodeActor.shouldSynch(node, hash)) {
            node = node.synch(origin, origin.blockchain, now)
          } else {
              logger.debug(s"NodeActions.ReceiveBlock: Added newBlock  ${node.isMalicious}, ${origin.isMalicious}, ${incomingBlock.level}, ${VConf.attackSuccessful} and ${VConf.attackFailed}")
              node = node.addBlock(incomingBlock)
          }
          addExecutablesForPropagateExternalBlock(now)
        } else if (block.level + 1 > node.blockchain.size && (VConf.attackSuccessful || VConf.attackFailed)) {
          val incomingBlock = block.addRecipient(origin, node, now)

          if (NodeActor.shouldSynch(node, hash)) {
            node = node.synch(origin, origin.blockchain, now)
          } else {
              logger.debug(s"NodeActions.ReceiveBlock: Added newBlock  ${node.isMalicious}, ${origin.isMalicious}, ${incomingBlock.level}, ${VConf.attackSuccessful} and ${VConf.attackFailed}")
              node = node.addBlock(incomingBlock)
          }
          addExecutablesForPropagateExternalBlock(now)
        }
      } else {
        if (block.level + 1 > node.blockchain.size) {
          val incomingBlock = block.addRecipient(origin, node, now)

          if (NodeActor.shouldSynch(node, hash)) {
            node = node.synch(origin, origin.blockchain, now)
          } else {
            node = node.addBlock(incomingBlock)
          }
          addExecutablesForPropagateExternalBlock(now)
        }
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
    lng: Double,
    isEvil: Option[Boolean] = None
  ): Props = Props(new NodeActor(masterActor, nodeRepoActor, discoveryActor, reducerActor, lat, lng, isEvil))
  def shouldSynch(node: VNode, hash: Int): Boolean = {
    node.createBlockchainHash() != hash
  }
}
