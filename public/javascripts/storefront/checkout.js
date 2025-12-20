// Create a Stripe client.
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
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = "";
  }
});

// Handle form submission.
const form = document.getElementById("checkout-form");

if (form) {
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // Disable submit button
    const submitButton = form.querySelector("button");
    if (submitButton) {
      submitButton.disabled = true;
    }

    // Get card name value
    const cardNameInput = document.getElementById("card-name");
    const extraDetails = {
      name: cardNameInput ? cardNameInput.value : "",
    };

    stripe.createToken(card, extraDetails).then(function (result) {
      if (result.error) {
        // Re-enable submit button
        if (submitButton) {
          submitButton.disabled = false;
        }
      } else {
        // Send the token to your server.
        stripeTokenHandler(result.token);
      }
    });
  });
}

// Submit the form with the token ID.
function stripeTokenHandler(token) {
  // Insert the token ID into the form so it gets submitted to the server
  const tokenInput = document.createElement("input");
  tokenInput.type = "hidden";
  tokenInput.name = "stripeToken";
  tokenInput.value = token.id;

  if (form) {
    form.appendChild(tokenInput);
    // Submit the form
    form.submit();
  }
}

// Checkout form interactions
document.addEventListener('DOMContentLoaded', function() {
  // Toggle shipping address visibility
  const sameAddressCheckbox = document.getElementById('sameAddress');
  if (sameAddressCheckbox) {
    sameAddressCheckbox.addEventListener('change', function() {
      const shippingSection = document.getElementById('shippingAddress');
      if (shippingSection) {
        shippingSection.classList.toggle('hidden');

        // Copy billing to shipping if same address
        if (this.checked) {
          const billingFirstName = document.getElementById('billingFirstName');
          const billingLastName = document.getElementById('billingLastName');
          const billingAddress = document.getElementById('billingAddress');
          const billingCity = document.getElementById('billingCity');
          const billingState = document.getElementById('billingState');
          const billingZip = document.getElementById('billingZip');

          const shippingFirstName = document.getElementById('shippingFirstName');
          const shippingLastName = document.getElementById('shippingLastName');
          const shippingAddressInput = document.getElementById('shippingAddressInput');
          const shippingCity = document.getElementById('shippingCity');
          const shippingState = document.getElementById('shippingState');
          const shippingZip = document.getElementById('shippingZip');

          if (shippingFirstName && billingFirstName) shippingFirstName.value = billingFirstName.value;
          if (shippingLastName && billingLastName) shippingLastName.value = billingLastName.value;
          if (shippingAddressInput && billingAddress) shippingAddressInput.value = billingAddress.value;
          if (shippingCity && billingCity) shippingCity.value = billingCity.value;
          if (shippingState && billingState) shippingState.value = billingState.value;
          if (shippingZip && billingZip) shippingZip.value = billingZip.value;
        }
      }
    });
  }

  // Toggle payment forms
  const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
  paymentMethodRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      const creditForm = document.getElementById('credit-card-form');
      const paypalForm = document.getElementById('paypal-form');

      if (this.value === 'credit_card') {
        if (creditForm) creditForm.classList.remove('hidden');
        if (paypalForm) paypalForm.classList.add('hidden');
      } else {
        if (creditForm) creditForm.classList.add('hidden');
        if (paypalForm) paypalForm.classList.remove('hidden');
      }
    });
  });
});
