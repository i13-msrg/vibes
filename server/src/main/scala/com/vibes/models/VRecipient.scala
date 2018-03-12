package com.vibes.models

import akka.actor.ActorRef
import org.joda.time.DateTime

case class VRecipient(from: VNode, to: VNode, timestamp: DateTime)
