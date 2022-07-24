// @format
const jQuery = require("jquery");

async function init() {
	chrome.runtime.sendMessage(
		{ contentEvent: "registerToReceiveCardDetails" },
		function (response) {
			console.log(
				"registerToReceiveCardDetails callback executed"
			);
		}
	);

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (request.contentEvent === "cardDetailsReceived") {
			console.log(
				"cardDetailsReceived passes event check and now executes callback"
			);
			let ccValue = request.cardDetails;
			jQuery('form input[name="number"]').val(ccValue.num);
			jQuery('form input[name="name"]').val("Tom Smith");
			jQuery('form input[name="expiry"]').val(
				ccValue.expiration
			);
			jQuery('form input[name="verification_value"]').val(
				ccValue.cv
			);
			chrome.runtime.sendMessage(
				{
					contentEvent:
						"cardDetailsHaveBeenInjectedInUI",
				},
				function (response) {
					console.log(
						"cardDetailsHaveBeenInjectedInUI callback executed"
					);
				}
			);
			sendResponse();
		}
	});
}

init();
