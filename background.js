// @format
// background.js

let virtualCardHasNotBeenCreated = true;
let transactionComplete = false;
let cardInjected = false;
let transactionValue = null;
let ETHtoUSD = null;
let transactionHexValue = null;
let registeredCardDetailsTab = null;
let registeredFormSubmissionTab = null;
let userEthAccount = null;

chrome.runtime.onStartup.addListener(() => {});

console.log("RUNNING BACKGROUND JS");
chrome.runtime.onInstalled.addListener(() => {
	setInterval(() => {
		let coinbaseURL =
			"https://api.coinbase.com/v2/exchange-rates?currency=ETH";
		let etherScanURL =
			"https://api.etherscan.io/api?module=stats&action=ethprice";
		fetch(coinbaseURL)
			.then((response) => response.json())
			.then((data) => {
				console.log("ETH TO USD set in bkacground.js");
				console.log(data);
				result = data["data"]["rates"]["USD"];
				if (result != null) {
					ETHtoUSD = result;
					console.log(ETHtoUSD);
				}
			});
	}, 7000);

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (request.contentEvent === "ethAccountReady") {
			console.log(
				"ethAccountReady passes event check and now executes callback"
			);

			if (userEthAccount === null) {
				userEthAccount = request.data
			}
		}
	});

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (request.contentEvent === "transactionPriceReady") {
			console.log(
				"transactionPriceReady passes event check and now executes callback"
			);

			if (ETHtoUSD != null) {
				console.log("transaction price: ")
				console.log(request.data)
				let ethTotal = request.data / ETHtoUSD;
				console.log("Eth total: ")
				console.log(ethTotal)
				let weiValue = Number(ethTotal * 1e18);
				console.log("WEI value: ")
				transactionHexValue =
					"0x" + weiValue.toString(16);
				console.log(transactionHexValue)
				sendResponse({hexValue: transactionHexValue});
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
			"cardDetailsHaveBeenInjectedInUI"
		) {
			console.log(
				"cardDetailsHaveBeenInjectedInUI passes event check and now executes callback"
			);

			chrome.tabs.sendMessage(
				registeredFormSubmissionTab,
				{
					contentEvent: "formSubmissionOnReady",
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
			"registerToReceiveFormSubmissionOnReady"
		) {
			console.log(
				"registerToReceiveFormSubmissionOnReady passes event check and now executes callback"
			);
			console.log("tabID: " + sender.tab.id);
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
		if (request.contentEvent === "registerToReceiveCardDetails") {
			console.log(
				"registerToReceiveCardDetails passes event check and now executes callback"
			);
			console.log("tabID: " + sender.tab.id);
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
				"walletCompletedEthTransaction" &&
			virtualCardHasNotBeenCreated
		) {
			virtualCardHasNotBeenCreated = false;
			console.log(
				"walletCompletedEthTransaction event recevied in backgroud.js process"
			);
			console.log("Transaction from wallet: ")
			console.log(request.data)
			console.log("Ethereum account where funds are coming from: ")
			console.log(userEthAccount)

			fetch("http://127.0.0.1:8000/api/virtual-card")
				.then((response) => response.json())
				.then((data) => {
					let cardNum = data["num"];
					let exp = data["expiration"];
					let cvv = data["cvv"];
					console.log("VIRTUAL CARD!!!!!: ");
					console.log(cardNum);
					console.log(data);
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
