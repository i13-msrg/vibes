package vibes

import akka.actor.{ActorSystem, PoisonPill}
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.{StatusCodes, _}
import akka.http.scaladsl.model.headers.{HttpOrigin, HttpOriginRange}
import akka.http.scaladsl.server.{Directives, ExceptionHandler, RejectionHandler, Route}
import akka.pattern.ask
import akka.stream.ActorMaterializer
import akka.util.Timeout
import ch.megard.akka.http.cors.scaladsl.settings.CorsSettings
import com.vibes.actions.MasterActions
import com.vibes.actors.{MasterActor, ReducerIntermediateResult}
import com.vibes.models.{MinedBlock, ReducerResult, TransferBlock}
import com.vibes.utils.VConf
import de.heikoseeberger.akkahttpcirce.FailFastCirceSupport
import io.circe.syntax._
import org.joda.time.DateTime

import scala.concurrent.duration._
import scala.concurrent.{Future, Promise}
import scala.language.postfixOps
import scala.util.Success

object Main extends App with FailFastCirceSupport {
  implicit val system       = ActorSystem("VSystem")
  implicit val materializer = ActorMaterializer()
  // needed for the future flatMap/onComplete in the end
  implicit val executionContext = system.dispatcher
  // do not start two simulations at once because of collisions
  private var lock = false

  val route: Route = {
    import Directives._
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

    // Note how rejections and exceptions are handled *before* the CORS directive (in the inner route).
    // This is required to have the correct CORS headers in the response even when an error occurs.
    handleErrors {
      cors(corsSettings) {
        handleErrors {
          path("vibe") {
            get {
              withRequestTimeout(1000.seconds) {
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
                    'blockSize.as[Int],
                    'networkBandwidth.as[Int]
                  )) {
                  (blockTime,
                   numberOfNeighbours,
                   numberOfNodes,
                   simulateUntil,
                   transactionSize,
                   throughput,
                   latency,
                   neighboursDiscoveryInterval,
                   blockSize,
                   networkBandwidth) =>
                    println(s"ATTEMPT START.......")

                    if (!lock) {
                      lock = true
                      println(s"START.......")
                      VConf.blockTime = blockTime
                      VConf.numberOfNeighbours = numberOfNeighbours
                      VConf.numberOfNodes = numberOfNodes
                      VConf.simulateUntil = new DateTime(simulateUntil)
                      VConf.transactionSize = transactionSize
                      VConf.throughPut = throughput
                      VConf.propagationDelay = latency
                      VConf.neighboursDiscoveryInterval = neighboursDiscoveryInterval
                      VConf.blockSize = blockSize
                      VConf.networkBandwidth = networkBandwidth
                      val masterActor = system.actorOf(MasterActor.props(), "Master")
                      // timeout for the ask pattern
                      implicit val timeout = Timeout(5000 seconds)

                      val reducerIntermediateResult: Future[Promise[ReducerIntermediateResult]] =
                        ask(masterActor, MasterActions.Start).mapTo[Promise[ReducerIntermediateResult]]

                      onComplete(reducerIntermediateResult.flatMap(promise =>
                        promise.future.map { intermediateResult =>
                          val json = intermediateResult.events.map {
                            case event @ (_: MinedBlock)    => event.asJson
                            case event @ (_: TransferBlock) => event.asJson
                          }

                          ReducerResult(
                            json,
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
                            intermediateResult.firstBlockNumberOfRecipents,
                            intermediateResult.lastBlockNumberOfRecipents,
                            VConf.numberOfNodes
                          )
                      })) { extraction =>
                        lock = false
                        extraction match {
                          case Success(result) =>
                            masterActor ! PoisonPill
                            complete(result.asJson)

                          case _ =>
                            masterActor ! PoisonPill
                            complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "<h1>Failure"))
                        }
                      }
                    } else {
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

  println(s"Server online at http://localhost:8082/\nPress RETURN to stop...")
}
