// @format
// background.js

let virtualCardHasNotBeenCreated = true;
let ETHtoUSD = null;
let transactionHexValue = null;
let registeredCardDetailsTab = null;
let registeredFormSubmissionTab = null;
let userEthAccount = null;
let transactionAmount = null;

let ethAccountReadyEvent = "ethAccountReady";
let transactionPriceReadyEvent = "transactionPriceReady";
let cardDetailsHaveBeenInjectedInUIEvent = "cardDetailsHaveBeenInjectedInUI";
let formSubmissionOnReadyEvent = "formSubmissionOnReady";
let registerToReceiveFormSubmissionOnReadyEvent =
	"registerToReceiveFormSubmissionOnReady";
let registerToReceiveCardDetailsEvent = "registerToReceiveCardDetails";
let walletCompletedEthTransactionEvent = "walletCompletedEthTransaction";

console.log("RUNNING BACKGROUND JS");
chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.sync.get(["ETHtoUSD"], function (result) {
		ETHtoUSD = result.ETHtoUSD;
		console.log("ETHtoUSD is fetched " + result.ETHtoUSD);
	});

	setInterval(() => {
		let coinbaseURL =
			"https://api.coinbase.com/v2/exchange-rates?currency=ETH";
		fetch(coinbaseURL)
			.then((response) => response.json())
			.then((data) => {
				result = data["data"]["rates"]["USD"];
				if (result != null) {
					ETHtoUSD = result;
					chrome.storage.sync.set(
						{ ETHtoUSD: result },
						function () {
							console.log(
								"ETHtoUSD updated in storage to " +
									result
							);
						}
					);
				}
			});
	}, 7000);

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (request.contentEvent === ethAccountReadyEvent) {
			console.log(
				"ethAccountReady passes event check and now executes callback"
			);

			if (userEthAccount === null) {
				userEthAccount = request.data;
			}
		}
	});

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (request.contentEvent === transactionPriceReadyEvent) {
			console.log(
				"transactionPriceReady passes event check and now executes callback"
			);

			if (ETHtoUSD != null) {
				transactionAmount = request.data * 100
				let ethTotal = request.data / ETHtoUSD;
				let weiValue = Number(ethTotal * 1e18);
				transactionHexValue =
					"0x" + parseInt(weiValue).toString(16);
				sendResponse({ hexValue: transactionHexValue });
			} else {
				console.log(
					"ETHtoUSD is null and transaction cant be initiated"
				);
			}
		}
	});

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (
			request.contentEvent ===
			cardDetailsHaveBeenInjectedInUIEvent
		) {
			console.log(
				"cardDetailsHaveBeenInjectedInUI passes event check and now executes callback"
			);

			chrome.tabs.sendMessage(
				registeredFormSubmissionTab,
				{
					contentEvent:
						formSubmissionOnReadyEvent,
				},
				function (response) {
					console.log(
						"formSubmissionOnReady calback has been executed"
					);
				}
			);
			sendResponse();
		}
	});

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (
			request.contentEvent ===
			registerToReceiveFormSubmissionOnReadyEvent
		) {
			console.log(
				"registerToReceiveFormSubmissionOnReady passes event check and now executes callback"
			);
			if (sender.tab.id != null) {
				registeredFormSubmissionTab = sender.tab.id;
			}
			sendResponse();
		}
	});

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (
			request.contentEvent ===
			registerToReceiveCardDetailsEvent
		) {
			console.log(
				"registerToReceiveCardDetails passes event check and now executes callback"
			);
			if (sender.tab.id != null) {
				registeredCardDetailsTab = sender.tab.id;
			}
			sendResponse({
				result: "registerToReceiveCardDetails response",
			});
		}
	});

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (
			request.contentEvent ===
				walletCompletedEthTransactionEvent &&
			virtualCardHasNotBeenCreated
		) {
			virtualCardHasNotBeenCreated = false;
			console.log(
				"walletCompletedEthTransaction event recevied in backgroud.js process"
			);

			let fetchURL = "https://paar-server.herokuapp.com/api/virtual-card" + "?" + "transaction=" + request.data + "&wallet=" + userEthAccount + "&transaction_amount=" + transactionAmount
			fetch(fetchURL)
				.then((response) => response.json())
				.then((data) => {
					let cardNum = data["num"];
					let exp = data["expiration"];
					let cvv = data["cvv"];

					let details = {
						num: cardNum,
						expiration: exp,
						cv: cvv,
					};
					chrome.tabs.sendMessage(
						registeredCardDetailsTab,
						{
							contentEvent:
								"cardDetailsReceived",
							cardDetails: details,
						},
						function (response) {
							console.log(
								"sendMessage to registerdCardDeatilsTab callback was executed, it WORKEDDDDDD!"
							);
						}
					);
				});
			sendResponse({
				result: "walletCompletedEthTransaction event callback executed",
			});
		}
	});
});
