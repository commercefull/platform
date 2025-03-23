// fade out for flash messages
setTimeout(function () {
  // @ts-expect-error TS(2581): Cannot find name '$'. Do you need to install type ... Remove this comment to see the full error message
  $("#flash-msg").fadeOut("slow");
}, 3000);

setTimeout(function () {
  // @ts-expect-error TS(2581): Cannot find name '$'. Do you need to install type ... Remove this comment to see the full error message
  $("#success").fadeOut("slow");
}, 3000);

setTimeout(function () {
  // @ts-expect-error TS(2581): Cannot find name '$'. Do you need to install type ... Remove this comment to see the full error message
  $("#error").fadeOut("slow");
}, 3000);
