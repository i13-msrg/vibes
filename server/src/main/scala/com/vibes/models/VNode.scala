package com.vibes.models

import java.util.UUID
import akka.actor.ActorRef
import com.vibes.utils.{VConf, VExecution}
import io.circe.{Encoder, Json}
import org.joda.time.DateTime
import scala.util.Random
import scala.util.hashing.MurmurHash3

class VNode(
  val id: String,
  val actor: ActorRef,
  val blockchain: List[VBlock],
  val transactionPool: Set[VTransaction],
  val neighbourActors: Set[ActorRef],
  val nextRecipient: Option[ActorRef],
  val lat: Double,
  val long: Double,
  val isMalicious: Option[Boolean]
) {
  def copy(
    id: String = id,
    actor: ActorRef = actor,
    blockchain: List[VBlock] = blockchain,
    transactionPool: Set[VTransaction] = transactionPool,
    neighbourActors: Set[ActorRef] = neighbourActors,
    nextRecipient: Option[ActorRef] = nextRecipient,
    lat: Double = lat,
    long: Double = long,
    isMalicious: Option[Boolean] = isMalicious
  ): VNode = {
    new VNode(id, actor, blockchain, transactionPool, neighbourActors, nextRecipient, lat, long, isMalicious)
  }

  def createExecutableWorkRequest(toActor: ActorRef,
                                  timestamp: DateTime,
                                  executionType: VExecution.ExecutionType.Value): VExecution.WorkRequest = {
    VExecution.WorkRequest(UUID.randomUUID().toString, actor, toActor, timestamp, executionType)
  }

  def addBlock(block: VBlock): VNode = {
    copy(
      transactionPool = transactionPool.diff(block.transactions),
      blockchain = block :: blockchain
    )
  }

  def exchangeNeighbours(neighbours: Set[ActorRef]): VNode = {
    copy(
      neighbourActors = scala.util.Random.shuffle((neighbourActors ++ neighbours).toList).take(neighbours.size).toSet)
  }

  def replaceNextRecipient(actor: ActorRef): VNode = {
    copy(
      nextRecipient = Some(actor)
    )
  }

  def addTransaction(incomingTransaction: VTransaction): VNode = {
    val newTransactionPool = transactionPool + incomingTransaction

    copy(
      transactionPool = newTransactionPool
    )
  }

  def addNeighbours(neighbours: Set[ActorRef]): VNode = {
    copy(
      neighbourActors = neighbourActors ++ neighbours
    )
  }

  // Formula comes from here
  // https://math.stackexchange.com/questions/786392/expectation-of-minimum-of-n-i-i-d-uniform-random-variables
  def createTimestampForNextBlock(now: DateTime): DateTime = {
    val numberOfVotes = VConf.numberOfNodes
    val expectedTime  = VConf.blockTime
    // b = blockTime * (n + 1) - n
    val until = expectedTime * (numberOfVotes + 1) - numberOfVotes

    now.plusSeconds(Random.nextInt(until))
  }

  def createBlockchainHash(): Int = {
    MurmurHash3.orderedHash(blockchain.map(_.id))
  }

  def synch(origin: VNode, longerBlockchain: List[VBlock], now: DateTime): VNode = {

    if (longerBlockchain.lengthCompare(blockchain.size) <= 0) {
      return copy()
    }

    val maybeBlock = VNode.findLastCommonBlock(longerBlockchain, blockchain)
    var tail       = blockchain
    maybeBlock match {
      case Some(block) =>
        val index = blockchain.indexOf(block)
        tail = blockchain.drop(index + 1)
      case _ =>
    }

    val newTransactionPool = VTransaction.createNewTransactionPool(longerBlockchain, tail, transactionPool)

    // add itself as a recipient to all unreceived blocks
    longerBlockchain.foreach { block =>
      if (!block.containsRecipient(this)) {
        block.addRecipient(origin, this, now)
      }
    }

    copy(
      blockchain = longerBlockchain,
      transactionPool = newTransactionPool
    )
  }

  def isTransactionNew(transaction: VTransaction): Boolean = {
    !(blockchain.takeRight(6).flatMap(block => block.transactions) ++ transactionPool).contains(transaction)
  }
}

object VNode {
  def findLastCommonBlock(blockchain1: List[VBlock], blockchain2: List[VBlock]): Option[VBlock] = {
    val result = (blockchain1 zip blockchain2).filter(item => item._1.id == item._2.id)
    if (result.isEmpty) None else Some(result.last._2)
  }

  implicit val vNodeEncoder: Encoder[VNode] = new Encoder[VNode] {
    override def apply(vNode: VNode): Json = Json.obj(
      ("id", Json.fromString(vNode.id)),
      ("lat", Json.fromString(vNode.lat.toString)),
      ("long", Json.fromString(vNode.long.toString))
    )
  }
}
