lazy val root = (project in file("."))
  .settings(name := "vibes")
  // Global settings for all projects
  .settings(
    inThisBuild(
      Seq(
        version := "0.0.1",
        scalaVersion := Dependencies.scalaVersion,
        scalacOptions ++= Seq(
          // Enable essential warnings
          "-deprecation",
          "-feature",
          "-unchecked",
          "-Xlint:-unused,_", // Linter enabled except setting Ywarn-unused implicitly
          "-Ywarn-unused:-imports", // don't warn if imports are unused for now
          // Fail on compiler warnings
          "-Xfatal-warnings"
        )
      )
    )
  )
  .aggregate(
    server
  )
val circeVersion = "0.9.0"


lazy val server = (project in file("server"))
  .settings(
    name := "server",
    resolvers += Resolver.bintrayRepo("hseeberger", "maven"),
    libraryDependencies ++= Seq(
      Dependencies.akkaActor,
      Dependencies.akkaStream,
      Dependencies.akkaHttp,
      Dependencies.akkaTestkit,
      Dependencies.akkaStream,
      Dependencies.scalaTime,
      Dependencies.scalaTest,
      Dependencies.slf4jApi,
      Dependencies.slf4jLog,
      Dependencies.logback,
      "de.heikoseeberger" %% "akka-http-circe" % "1.20.0-RC1",
      "ch.megard" %% "akka-http-cors" % "0.2.2"
    ) ++ Seq(
      "io.circe" %% "circe-core",
      "io.circe" %% "circe-generic",
      "io.circe" %% "circe-parser"
    ).map(_ % circeVersion)
  )
