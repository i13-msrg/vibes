import sbt._

object Dependencies {

  val scalaVersion = "2.12.3"
  val akkaVersion = "2.5.6"

  val akkaActor: ModuleID =  "com.typesafe.akka" %% "akka-actor" % akkaVersion
  var akkaStream: ModuleID = "com.typesafe.akka" %% "akka-stream" % akkaVersion
  val akkaHttp: ModuleID = "com.typesafe.akka" %% "akka-http" % "10.0.10"

  val scalaTime: ModuleID = "com.github.nscala-time" %% "nscala-time" % "2.16.0"

  // Tests
  val akkaTestkit: ModuleID = "com.typesafe.akka" %% "akka-testkit" % akkaVersion
  val scalaTest: ModuleID = "org.scalatest" %% "scalatest" % "3.0.1" % "test"
  val slf4jApi: ModuleID = "org.slf4j" % "slf4j-api" % "1.7.1"
  val slf4jLog: ModuleID = "org.slf4j" % "log4j-over-slf4j" % "1.7.1" // for any java classes looking for this

  // Logging
  val logback2: ModuleID = "ch.qos.logback" % "logback-classic" % "1.1.2"
  val scalaLogging2: ModuleID = "com.typesafe.scala-logging" %% "scala-logging" % "3.5.0"
}