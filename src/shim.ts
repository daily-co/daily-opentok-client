function initSession(apiKey: string, sessionId: string) {
  
}

function initPublisher(type: string, publisherOptions: any, handleError: any) {
  
}



window.OT.initSession = initSession;

function handleError(error) {
  if (error) {
    console.error(error);
  }
}

var session = window.OT.initSession(apiKey, sessionId);

// Subscribe to a newly created stream
session.on("streamCreated", function streamCreated(event) {
  var subscriberOptions = {
    insertMode: "append",
    width: "100%",
    height: "100%",
  };
  session.subscribe(event.stream, "subscriber", subscriberOptions, handleError);
});

session.on("sessionDisconnected", function sessionDisconnected(event) {
  console.log("You were disconnected from the session.", event.reason);
});

// initialize the publisher
var publisherOptions = {
  insertMode: "append",
  width: "100%",
  height: "100%",
};
var publisher = window.OT.initPublisher(
  "publisher",
  publisherOptions,
  handleError
);

// Connect to the session
session.connect(token, function callback(error) {
  if (error) {
    handleError(error);
  } else {
    // If the connection is successful, publish the publisher to the session
    session.publish(publisher, handleError);
  }
});
