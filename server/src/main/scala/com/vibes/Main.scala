package vibes

import akka.actor.{ActorSystem, PoisonPill}
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.headers.{HttpOrigin, HttpOriginRange}
import akka.http.scaladsl.model.{StatusCodes, _}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.{ExceptionHandler, RejectionHandler, Route}
import akka.pattern.ask
import akka.stream.ActorMaterializer
import akka.util.Timeout
import ch.megard.akka.http.cors.scaladsl.settings.CorsSettings
import com.typesafe.scalalogging.LazyLogging
import com.vibes.actions.MasterActions
import com.vibes.actors.{MasterActor, ReducerIntermediateResult}
import com.vibes.models.{MinedBlock, ReducerResult, TransferBlock}
import com.vibes.utils.VConf
import de.heikoseeberger.akkahttpcirce.FailFastCirceSupport
import io.circe.syntax._
import org.joda.time.DateTime

import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContextExecutor, Future, Promise}
import scala.language.postfixOps
import scala.util.Success

object Main extends App with FailFastCirceSupport with LazyLogging {
  implicit val system: ActorSystem = ActorSystem("VSystem")
  implicit val materializer: ActorMaterializer = ActorMaterializer()

  // needed for the future flatMap/onComplete in the end
  implicit val executionContext: ExecutionContextExecutor = system.dispatcher
  // do not start two simulations at once because of collisions
  private var lock = false

  val route: Route = {
    import ch.megard.akka.http.cors.scaladsl.CorsDirectives._

    // CORS settings [hardcoded;-)]
    val corsSettings = CorsSettings.defaultSettings.copy(
      allowedOrigins = HttpOriginRange(HttpOrigin("http://localhost:8080"))
    )

    // Rejection handler
    val rejectionHandler = corsRejectionHandler withFallback RejectionHandler.default

    // Exception handler
    val exceptionHandler = ExceptionHandler {
      case e: NoSuchElementException => complete(StatusCodes.NotFound -> e.getMessage)
    }

    // Combining the two handlers only for convenience
    val handleErrors = handleRejections(rejectionHandler) & handleExceptions(exceptionHandler)

    val timeoutResponse = HttpResponse(StatusCodes.EnhanceYourCalm,
      entity = "Unable to serve response within time limit, please enchance your calm.")

    // Note how rejections and exceptions are handled *before* the CORS directive (in the inner route).
    // This is required to have the correct CORS headers in the response even when an error occurs.
    handleErrors {
      logger.debug(s"HANDLE ERRORS... $handleErrors ${rejectionHandler.toString()} $exceptionHandler")
      cors(corsSettings) {
        handleErrors {
          // http://localhost:8082/vibe?blockTime=600&numberOfNeighbours=4&numberOfNodes=10&simulateUntil=1526647160712&transactionSize=250&throughput=10&latency=900&neighboursDiscoveryInterval=3000&maxBlockSize=1&maxBlockWeight=4&networkBandwidth=1&strategy=PROOF_OF_WORK
          path("vibe") {
            logger.debug(s"GET...")
            get {
              logger.debug(s"WITHREQUESTTIMEOUT...")
              withRequestTimeout(900.seconds, request => timeoutResponse) {
                logger.debug(s"PARAMETERS...")
                parameters(
                  (
                    'blockTime.as[Int],
                    'numberOfNeighbours.as[Int],
                    'numberOfNodes.as[Int],
                    'simulateUntil.as[Long],
                    'transactionSize.as[Int],
                    'throughput.as[Int],
                    'latency.as[Int],
                    'neighboursDiscoveryInterval.as[Int],
                    'maxBlockSize.as[Int],
                    'networkBandwidth.as[Int],
                    'strategy.as[String],
                    'transactionPropagationDelay.as[Int],
                    'hashrate.as[Int],
                    'confirmations.as[Int]
                  )) {
                  (blockTime,
                   numberOfNeighbours,
                   numberOfNodes,
                   simulateUntil,
                   transactionSize,
                   throughput,
                   latency,
                   neighboursDiscoveryInterval,
                   maxBlockSize,
                   networkBandwidth,
                   strategy,
                   transactionPropagationDelay,
                   hashrate,
                   confirmations
                  ) =>
                    logger.debug(s"ATTEMPT START... $lock")
                    if (!lock) {
                      lock = true
                      logger.debug("==============================================================")
                      logger.debug("=============================START============================")
                      logger.debug("==============================================================")
                      VConf.blockTime = blockTime
                      VConf.numberOfNeighbours = numberOfNeighbours
                      VConf.numberOfNodes = numberOfNodes
                      VConf.simulateUntil = new DateTime(simulateUntil)
                      VConf.transactionSize = transactionSize
                      VConf.throughPut = throughput
                      VConf.blockPropagationDelay = latency
                      VConf.neighboursDiscoveryInterval = neighboursDiscoveryInterval
                      VConf.maxBlockSize = maxBlockSize
                      VConf.networkBandwidth = networkBandwidth
                      VConf.strategy = strategy
                      logger.debug(s"STRATEGY... $strategy")
                      VConf.transactionPropagationDelay = transactionPropagationDelay
                      logger.debug(s"TRANSACTION PROPAGATION DELAY... $transactionPropagationDelay")
                      VConf.hashrate = hashrate
                      logger.debug(s"HASHRATE... $hashrate")
                      VConf.confirmations = confirmations
                      logger.debug(s"CONFIRMATIONS... $confirmations")
                      val masterActor = system.actorOf(MasterActor.props(), "Master")
                      // timeout for the ask pattern
                      implicit val timeout: Timeout = Timeout(900.seconds)

                      val reducerIntermediateResult: Future[Promise[ReducerIntermediateResult]] =
                        ask(masterActor, MasterActions.Start).mapTo[Promise[ReducerIntermediateResult]]

                      logger.debug(s"reducerIntermediateResult... $reducerIntermediateResult")

                      val result2 = Await.result(reducerIntermediateResult, 900 seconds)
                      logger.debug(s"result2 ${result2}")

                      onComplete(reducerIntermediateResult.flatMap(promise =>
                        promise.future.map { intermediateResult =>
                          val eventsJson = intermediateResult.events.map {
                            case event@(_: MinedBlock) => event.asJson
                            case event@(_: TransferBlock) => event.asJson
                          }

                          val transactionsJson = intermediateResult.transactions.map {
                            transaction => transaction.asJson
                          }

                          ReducerResult(
                            eventsJson,
                            intermediateResult.duration,
                            intermediateResult.longestChainLength,
                            intermediateResult.longestChainSize,
                            intermediateResult.longestChainNumberTransactions,
                            intermediateResult.timesAvgWithOutliers._1,
                            intermediateResult.timesAvgWithOutliers._2,
                            intermediateResult.timesAvgWithOutliers._3,
                            intermediateResult.timesAvgNoOutliers._1,
                            intermediateResult.timesAvgNoOutliers._2,
                            intermediateResult.timesAvgNoOutliers._3,
                            intermediateResult.firstBlockNumberOfRecipients,
                            intermediateResult.lastBlockNumberOfRecipients,
                            intermediateResult.maxProcessedTransactions,
                            transactionsJson,
                            VConf.numberOfNodes,
                            intermediateResult.orphans,
                            intermediateResult.attackSuccessful,
                            intermediateResult.successfulAttackInBlocks,
                            intermediateResult.probabilityOfSuccessfulAttack,
                            intermediateResult.maximumSafeTransactionValue
                          )
                        })) { extraction =>
                        lock = false
                        logger.debug("EXTRACTION...")
                        extraction match {
                          case Success(result) =>
                            logger.debug("SUCCESS...")
                            masterActor ! PoisonPill
                            complete(result.asJson)

                          case _ =>
                            logger.debug(s"EXTRACTION COMPLETE HTTP FAILURE...")
                            masterActor ! PoisonPill
                            complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "<h1>Failure"))
                        }
                      }
                    } else {
                      logger.debug(s"COMPLETE HTTP FAILURE...")
                      complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "<h1>Failure"))
                    }
                }
              }
            }
          }
        }
      }
    }
  }

  val bindingFuture = Http().bindAndHandle(route, "localhost", 8082)

  logger.debug("Server online at http://localhost:8082/")
  logger.debug("Press RETURN to stop...")
}
