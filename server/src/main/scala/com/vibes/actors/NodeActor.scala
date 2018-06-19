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
      // logging
      logger.debug(s"{${node.isMalicious.contains(true)}} BLOCK MINED AT SIZE ${node.blockchain.size}..... $timestamp, ${self.path}")

      var newBlock = VBlock.createWinnerBlock(node, timestamp)

      if (!VConf.isAlternativeHistoryAttack) {
        logger.debug(s"addExecutablesForMineBlock: !VConf.isAlternativeHistoryAttack")
        node = node.addBlock(newBlock)
      } else if (VConf.attackSuccessful) {
        logger.debug(s"addExecutablesForMineBlock: VConf.attackSuccessful")
        node = node.addBlock(newBlock)
      } else if (VConf.attackFailed) {
        logger.debug(s"addExecutablesForMineBlock: VConf.attackFailed")
        node = node.addBlock(newBlock)
      } else if (newBlock.level == 0) {
        logger.debug(s"addExecutablesForMineBlock: newBlock.level == 0")
        node = node.addBlock(newBlock)
      } else if (node.isMalicious == newBlock.origin.isMalicious) {
        logger.debug(s"addExecutablesForMineBlock: added newBlock")
        node = node.addBlock(newBlock)
      } else {
        logger.debug(s"addExecutablesForMineBlock: Didn't add newBlock  ${newBlock.level}, ${VConf.attackSuccessful} and ${VConf.attackFailed}")
      }

      reducerActor ! ReducerActions.AddBlock(newBlock)
      addExecutablesForPropagateOwnBlock(timestamp)
      nodeRepoActor ! NodeRepoActions.AnnounceNextWorkRequestAndMine(timestamp)

      // todo clean up ifs
      if(VConf.evilChainLength >= VConf.attackDuration  && !VConf.attackSuccessful && !VConf.attackFailed) {
        logger.debug(s"ATTACK FAILED.....  $timestamp, ${self.path}")
        VConf.attackFailed = true
      }
      if (VConf.isAlternativeHistoryAttack && !VConf.attackFailed) {
        if (VConf.evilChainLength > VConf.goodChainLength && node.blockchain.size >= VConf.confirmations + 1 && !VConf.attackSuccessful) {
          VConf.attackSuccessful = true
          VConf.attackSuccessfulInBlocks = node.blockchain.size
          logger.debug(s"ATTACK IS SUCCESSFUL.....")
          logger.debug(s"GOOD CHAIN LENGTH: ${VConf.goodChainLength}; BAD CHAIN LENGTH ${VConf.evilChainLength}")
        }
        if (node.isMalicious.contains(true)) {
          if (node.blockchain.size > VConf.evilChainLength) {
            VConf.evilChainLength = node.blockchain.size
          }
        } else if (node.isMalicious.contains(false)) {
          if (node.blockchain.size > VConf.goodChainLength) {
            VConf.goodChainLength = node.blockchain.size
          }
        }
        if (!VConf.attackSuccessful && !VConf.attackFailed) {
          logger.debug(s"GOOD CHAIN LENGTH: ${VConf.goodChainLength}; BAD CHAIN LENGTH ${VConf.evilChainLength}")
        }
      }
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
      if (block.level + 1 > node.blockchain.size) {

        val incomingBlock = block.addRecipient(origin, node, now)

        if (NodeActor.shouldSynch(node, hash)) {
          node = node.synch(origin, origin.blockchain, now)
        } else {
          if ((node.isMalicious == origin.isMalicious || block.level == 0) && (VConf.isAlternativeHistoryAttack && !VConf.attackSuccessful && !VConf.attackFailed)) {
            logger.debug(s"NodeActions.ReceiveBlock: Added newBlock  ${node.isMalicious}, ${origin.isMalicious}, ${incomingBlock.level}, ${VConf.attackSuccessful} and ${VConf.attackFailed}")
            node = node.addBlock(incomingBlock)
          } else {
            logger.debug(s"NodeActions.ReceiveBlock: Didn't add newBlock  ${node.isMalicious}, ${origin.isMalicious}, ${incomingBlock.level}, ${VConf.attackSuccessful} and ${VConf.attackFailed}")
          }
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
    lng: Double,
    isEvil: Option[Boolean] = None
  ): Props = Props(new NodeActor(masterActor, nodeRepoActor, discoveryActor, reducerActor, lat, lng, isEvil))
  def shouldSynch(node: VNode, hash: Int): Boolean = {
    node.createBlockchainHash() != hash
  }
}
