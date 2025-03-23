// Create a Stripe client.
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'stripe'.
const stripe = Stripe("pk_test_Nw7zXh6zu9SXKrzk7KDxKUiV004Ly59ywq");

// Create an instance of Elements.
const elements = stripe.elements();

const style = {
  base: {
    color: "#32325d",
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: "antialiased",
    fontSize: "16px",
  },
  invalid: {
    color: "#fa755a",
    iconColor: "#fa755a",
  },
};

// Create an instance of the card Element.
const card = elements.create("card", { style: style });

// Add an instance of the card Element into the `card-element` <div>.
card.mount("#card-element");

// Handle real-time validation errors from the card Element.
card.addEventListener("change", function (event) {
  const displayError = document.getElementById("card-errors");
  if (event.error) {
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    displayError.textContent = event.error.message;
  } else {
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    displayError.textContent = "";
  }
});

// Handle form submission.
// @ts-expect-error TS(2581): Cannot find name '$'. Do you need to install type ... Remove this comment to see the full error message
const $form = $("#checkout-form");

$form.submit(function (event) {
  event.preventDefault();
  $form.find("button").prop("disabled", true);

  const extraDetails = {
    // @ts-expect-error TS(2581): Cannot find name '$'. Do you need to install type ... Remove this comment to see the full error message
    name: $("#card-name").val(),
  };

  stripe.createToken(card, extraDetails).then(function (result) {
    if (result.error) {
      $form.find("button").prop("disabled", false); // Re-enable submission
    } else {
      // Send the token to your server.
      stripeTokenHandler(result.token);
    }
  });
});

// Submit the form with the token ID.
function stripeTokenHandler(token) {
  // Insert the token ID into the form so it gets submitted to the server
  // @ts-expect-error TS(2581): Cannot find name '$'. Do you need to install type ... Remove this comment to see the full error message
  $form.append($('<input type="hidden" name="stripeToken" />').val(token.id));
  // Submit the form
  $form.get(0).submit();
}
