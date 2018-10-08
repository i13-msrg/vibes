package com.vibes.models

import java.util.UUID

import com.typesafe.scalalogging.LazyLogging
import com.vibes.utils.VConf
import org.joda.time.{DateTime, Duration}
import scala.collection.mutable.ListBuffer

// todo maybe: genesis block has no transactions, because transaction pool is zero
// todo maybe: after last block new transactions are added to the transaction pool

case class VBlock(
  id: String,
  origin: VNode,
  transactions: Set[VTransaction],
  level: Int,
  timestamp: DateTime,
  private val recipients: ListBuffer[VRecipient],
  transactionPoolSize: Int,
) {
  def numberOfRecipients: Int = recipients.size

  def copy(
    id: String = id,
    origin: VNode = origin,
    transactions: Set[VTransaction] = transactions,
    level: Int = level,
    timestamp: DateTime = timestamp,
    recipients: ListBuffer[VRecipient] = recipients,
    transactionPoolSize: Int = transactionPoolSize,
  ): VBlock = {
    new VBlock(id, origin, transactions, level, timestamp, recipients, transactionPoolSize)
  }
  def currentRecipients: List[VRecipient] = recipients.toList

  def containsRecipient(recipient: VNode): Boolean = {
    recipients.map(_.to.actor).contains(recipient.actor)
  }
  // This assumes that recipients of a block are always nonEmpty, which is currently the case
  // since block is created only via createWinnerBlock for now
  def addRecipient(from: VNode, to: VNode, timestamp: DateTime): VBlock = {
    // in case of an double-spending attack the recipient can currently be empty
    if (VConf.hashRate == 0) {
      assert(!containsRecipient(to), "This assumes that recipients of a block are always nonEmpty, which is currently the case since block is created only via createWinnerBlock for now")
    }

    if (to.actor != origin.actor) {
      recipients += VRecipient(from, to, timestamp)
    }

    copy()
  }

  def calculatePropagationTimes(): (Option[Float], Option[Float], Option[Float]) = {
    // -1 cause we don't count origin
    val n1 = Math.floor((VConf.numberOfNodes - 1) * 0.01).toInt
    val n2 = Math.floor((VConf.numberOfNodes - 1) * 0.5).toInt
    val n3 = Math.floor((VConf.numberOfNodes - 1) * 0.90).toInt
    import com.vibes.utils.Joda._

    val sortedRecipients = recipients.sortBy(_.timestamp)

    if(VConf.isAlternativeHistoryAttack && sortedRecipients.isEmpty) {
      val t1: Option[Float] = None
      val t2: Option[Float] = None
      val t3: Option[Float] = None
      return (t1, t2, t3)
    }

    assert(sortedRecipients.nonEmpty, "sortedRecipients are empty")

    val t0                = sortedRecipients.head.timestamp
    var t1: Option[Float] = None
    var t2: Option[Float] = None
    var t3: Option[Float] = None

    if (sortedRecipients.lengthCompare(n1) > 0) {
      t1 = Some(new Duration(t0, sortedRecipients(n1).timestamp).toDuration.getMillis.toFloat / 1000)
    }

    if (sortedRecipients.lengthCompare(n2) > 0) {
      t2 = Some(new Duration(t0, sortedRecipients(n2).timestamp).toDuration.getMillis.toFloat / 1000)
    }

    if (sortedRecipients.lengthCompare(n3) > 0) {
      t3 = Some(new Duration(t0, sortedRecipients(n3).timestamp).toDuration.getMillis.toFloat / 1000)
    }

    (t1, t2, t3)
  }
}

object VBlock extends LazyLogging {
  def createWinnerBlock(node: VNode, timestamp: DateTime): VBlock = {
    var maxTransactionsPerBlock : Int = 0
    var processedTransactionsInBlock: Set[VTransaction] = Set.empty

    // block size limit & SegWit
    if (VConf.strategy == "BITCOIN_LIKE_BLOCKCHAIN" && VConf.transactionSize != 0) {
      // this part could be moved to Main for constant transaction weight and size to save calculations, but is necessary here for non-constant transaction weight and size
      if (VConf.maxBlockWeight != 0 && VConf.transactionWeight != 0) {
        // SegWit is enabled
        maxTransactionsPerBlock = Math.floor(VConf.maxBlockWeight / VConf.transactionWeight).toInt
      } else if (VConf.maxBlockSize != 0) {
        // SegWit is disabled
        maxTransactionsPerBlock = Math.floor(VConf.maxBlockSize / VConf.transactionSize).toInt
      } else {
        // any number of transactions is accepted
        maxTransactionsPerBlock = node.transactionPool.size
      }

      // sorts the transaction pool by the transaction fee and takes the amount of maxTransactionsPerBlock out of the transaction pool into the winner block
      processedTransactionsInBlock = node.transactionPool.toSeq.sortWith(_.transactionFee > _.transactionFee).take(maxTransactionsPerBlock).toSet

      // sets confirmation status of transaction true
      processedTransactionsInBlock.foreach { _.confirmation = true }

      // sets confirmation level of transaction
      processedTransactionsInBlock.foreach { _.confirmationLevel = node.blockchain.size }
    } else {
      maxTransactionsPerBlock = node.transactionPool.size
      processedTransactionsInBlock = node.transactionPool
    }

    // sets flood transaction pool to ensure buffer
    if (VConf.strategy == "BITCOIN_LIKE_BLOCKCHAIN" && VConf.floodAttackTransactionFee > 0 ) {
      VConf.floodAttackTransactionPool = processedTransactionsInBlock.count(_.isFloodAttack)
    }

    VBlock(
      id = UUID.randomUUID().toString,
      origin = node,
      transactions = processedTransactionsInBlock,
      level = node.blockchain.size,
      timestamp = timestamp,
      recipients = ListBuffer.empty,
      transactionPoolSize = node.transactionPool.size - processedTransactionsInBlock.size
    )
  }
}
