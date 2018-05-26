package com.vibes.models

import java.util.UUID

import akka.actor.ActorRef
import com.typesafe.scalalogging.LazyLogging
import com.vibes.utils.VExecution
import io.circe.{Encoder, Json}
import org.joda.time.DateTime
import io.circe.syntax._

import scala.collection.mutable.ListBuffer
import scala.util.Random
import scala.util.hashing.MurmurHash3

class VTransaction(
  val id: String,
  val origin: ActorRef,
  val recipient: ActorRef,
  val amount: Int,
  val transactionFee: Int, //  satoshi per byte
  var confirmation: Boolean,
  var creationLevel: Int,
  var confirmationLevel: Int,
  private val recipients: ListBuffer[VRecipient] // maybe use mutable sorted set instead todo
) {
  def canEqual(a: Any) = a.isInstanceOf[VTransaction]
  override def equals(that: Any): Boolean =
    that match {
      case that: VTransaction =>
        that.canEqual(this) && this.hashCode == that.hashCode
      case _ => false
    }
  override def hashCode: Int = {
    MurmurHash3.stringHash(this.id)
  }

  def currentRecipients: List[VRecipient] = recipients.toList

  def copy(
    id: String = id,
    origin: ActorRef = origin,
    recipient: ActorRef = recipient,
    amount: Int = amount,
    transactionFee: Int = transactionFee,
    confirmation: Boolean = confirmation,
    creationLevel: Int = creationLevel,
    confirmationLevel: Int = confirmationLevel,
    recipients: ListBuffer[VRecipient] = recipients,
  ): VTransaction = {
    new VTransaction(id, origin, recipient, amount, transactionFee, confirmation, creationLevel, confirmationLevel, recipients)
  }

  def createExecutableWorkRequest(
    actor: ActorRef,
    toActor: ActorRef,
    timestamp: DateTime,
    executionType: VExecution.ExecutionType.Value
  ): VExecution.WorkRequest = {
    VExecution.WorkRequest(UUID.randomUUID().toString, actor, toActor, timestamp, executionType)
  }

  // Assumes current recipients is non empty, which is the case since transaction is only issued via issueOne
  def addRecipient(from: VNode, to: VNode, timestamp: DateTime): VTransaction = {
    if (origin != to.actor) {
      recipients += VRecipient(from, to, timestamp)
    }

    copy()
  }
}

object VTransaction extends LazyLogging{
  implicit val transactionEncoder: Encoder[VTransaction] = new Encoder[VTransaction] {
    override def apply(transaction: VTransaction): Json = Json.obj(
      ("transactionFee", transaction.transactionFee.asJson),
      ("confirmation", transaction.confirmation.asJson),
      ("confirmationLevel", transaction.confirmationLevel.asJson),
      ("creationLevel", transaction.creationLevel.asJson),
    )
  }

  def createNewTransactionPool(
    longerBlockchain: List[VBlock],
    tail: List[VBlock],
    transactionPool: Set[VTransaction]
  ): Set[VTransaction] = {
    val potentialTransactions = tail
      .flatMap(_.transactions)
      .toSet ++ transactionPool
    val confirmedTransactions = longerBlockchain.flatMap(_.transactions).toSet

    potentialTransactions.diff(confirmedTransactions)
  }

  def createOne(from: ActorRef, to: ActorRef, timestamp: DateTime, creationLevel: Int): VTransaction = {
    val amount = Random.nextInt(1000)
    val transactionFee = Random.nextInt(125)
    val confirmation = false
    val confirmationLevel: Int = 0
    new VTransaction(
      UUID.randomUUID().toString,
      from,
      to,
      amount,
      transactionFee,
      confirmation,
      creationLevel,
      confirmationLevel,
      ListBuffer.empty
    )
  }
}
