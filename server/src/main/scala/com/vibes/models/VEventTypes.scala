package com.vibes.models

import io.circe.{Encoder, Json}
import io.circe.generic.semiauto._
import org.joda.time.DateTime
import io.circe.syntax._

sealed trait VEventType {
  def eventType: String
  def timestamp: DateTime
}

object VEventType {
  import com.vibes.utils.Joda._
  implicit val OrderingVEventType: Ordering[VEventType] = Ordering.by(vote => (vote.timestamp, vote.eventType))
}

case class MinedBlock(origin: VNode, timestamp: DateTime, transactionPoolSize: Int, eventType: String = "MinedBlock", level: Int, transactions: Set[VTransaction], isMalicious: Option[Boolean]) extends VEventType

object MinedBlock {
  implicit val minedBlockEncoder: Encoder[MinedBlock] = new Encoder[MinedBlock] {
    override def apply(minedBlock: MinedBlock): Json = Json.obj(
      ("timestamp", Json.fromString(minedBlock.timestamp.toString())),
      ("eventType", Json.fromString(minedBlock.eventType)),
      ("transactionPoolSize", Json.fromInt(minedBlock.transactionPoolSize)),
      ("origin", minedBlock.origin.asJson),
      ("level", Json.fromInt(minedBlock.level)),
      ("processedTransactions", Json.fromInt(minedBlock.transactions.size)),
      ("isMalicious", Json.fromBoolean(minedBlock.isMalicious.contains(true))),
    )
  }
}

case class TransferBlock(from: VNode, to: VNode, timestamp: DateTime, eventType: String = "TransferBlock")
  extends VEventType

object TransferBlock {
  implicit val transferBlockEncoder: Encoder[TransferBlock] = (transferBlock: TransferBlock) => Json.obj(
    ("timestamp", Json.fromString(transferBlock.timestamp.toString())),
    ("eventType", Json.fromString(transferBlock.eventType)),
    ("toNode", transferBlock.to.asJson),
    ("fromNode", transferBlock.from.asJson)
  )
}

case class ReducerResult(
  events: List[Json],
  duration: Double,
  longestChainLength: Int,
  longestChainSize: Int,
  longestChainNumberTransactions: Int,
  timesWithOutliers10: Float,
  timesWithOutliers50: Float,
  timesWithOutliers90: Float,
  timesNoOutliers10: Float,
  timesNoOutliers50: Float,
  timesNoOutliers90: Float,
  firstBlockNumberOfRecipients: Int,
  lastBlockNumberOfRecipients: Int,
  nonSegWitMaxTransactionsPerBlock: Int,
  segWitMaxTransactionsPerBlock: Int,
  nonSegWitMaxTPS: Double,
  segWitMaxTPS: Double,
  segWitMaxBlockWeight: Int,
  transactions: List[Json],
  totalNumberOfNodes: Int,
  orphans: Int,
  attackSucceeded: Int,
  successfulAttackInBlocks: Int,
  probabilityOfSuccessfulAttack: Double,
  maximumSafeTransactionValue: Int,
  maliciousBlockchainLength: Int,
  goodBlockchainLength: Int,
  attackDuration: Int,
  B: Double,
  o: Int,
  alpha: Int,
  k: Int,
  tps: Double,
  avgBlockTime: Int,
  simulationStart: String
)

object ReducerResult {
  implicit val eventResultEncoder: Encoder[ReducerResult] = deriveEncoder
}
