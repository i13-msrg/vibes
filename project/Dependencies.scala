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
  val logback: ModuleID = "ch.qos.logback" % "logback-classic" % "1.1.2"
  val scalaLogging: ModuleID = "com.typesafe.scala-logging" %% "scala-logging" % "3.5.0"

  // Poisson Random Variables
  // Last stable release
  val breeze: ModuleID = "org.scalanlp" %% "breeze" % "0.13.2"
  // Native libraries are not included by default. add this if you want them (as of 0.7)
  // Native libraries greatly improve performance, but increase jar sizes.
  // It also packages various blas implementations, which have licenses that may or may not
  // be compatible with the Apache License. No GPL code, as best I know.
  val breezeNatives: ModuleID = "org.scalanlp" %% "breeze-natives" % "0.13.2"
  // The visualization library is distributed separately as well.
  // It depends on LGPL code
  val breezeViz: ModuleID = "org.scalanlp" %% "breeze-viz" % "0.13.2"
}