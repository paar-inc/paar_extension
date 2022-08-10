// @format
// background.js
const events = {
	CONVERT_PRICE_TO_HEX_TRANSACTION: "convert_price_to_hex_transaction_event",
	STORE_USER_WALLET_ADDRESS: "store_user_wallet_address_event",
	CREDIT_CARD_INFO_IS_INJECTED: "credit_card_info_is_injected_event",
	SUBMIT_SHOPIFY_CHECKOUT_FORM: "submit_shopify_checkout_form_event",
	RECEIVE_CREDIT_CARD_INFO: "receive_credit_card_info_event",
	REGISTER_TAB_FOR_SUBMIT_SHOPIFY_CHECKOUT_FORM: "register_tab_for_submit_shopify_checkout_form_event",
	REGISTER_TAB_FOR_RECEIVE_CREDIT_CARD_INFO: "register_tab_for_receive_credit_card_info_event",
	ETH_WALLET_TRANSACTION_SUCCESS: "eth_wallet_transaction_success_event"
}

let virtualCardHasNotBeenCreated = true;
let ETHtoUSD = null;
let transactionHexValue = null;
let registeredCardDetailsTab = null;
let registeredFormSubmissionTab = null;
let userEthAccount = null;
let transactionAmount = null;


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
	}, 500);

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (request.contentEvent === events.STORE_USER_WALLET_ADDRESS) {
			console.log(
				events.STORE_USER_WALLET_ADDRESS + " received in background.js"
			);

			if (userEthAccount === null) {
				userEthAccount = request.data;
			}
			sendResponse()
		}
	});

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (request.contentEvent === events.CONVERT_PRICE_TO_HEX_TRANSACTION) {
			console.log(
				 events.CONVERT_PRICE_TO_HEX_TRANSACTION + " received in background.js"
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
			events.CREDIT_CARD_INFO_IS_INJECTED
		) {
			console.log(
				events.CREDIT_CARD_INFO_IS_INJECTED + " executed by background.js"
			);

			chrome.tabs.sendMessage(
				registeredFormSubmissionTab,
				{
					contentEvent:
						events.SUBMIT_SHOPIFY_CHECKOUT_FORM,
				},
				function (response) {
					console.log(
						events.SUBMIT_SHOPIFY_CHECKOUT_FORM + " calback has been executed"
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
			events.REGISTER_TAB_FOR_SUBMIT_SHOPIFY_CHECKOUT_FORM
		) {
			console.log(
				events.REGISTER_TAB_FOR_SUBMIT_SHOPIFY_CHECKOUT_FORM + " exectued in background.js"
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
			events.REGISTER_TAB_FOR_RECEIVE_CREDIT_CARD_INFO
		) {
			console.log(
				events.REGISTER_TAB_FOR_RECEIVE_CREDIT_CARD_INFO + " exectued in background.js"
			);
			if (sender.tab.id != null) {
				registeredCardDetailsTab = sender.tab.id;
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
				events.ETH_WALLET_TRANSACTION_SUCCESS &&
			virtualCardHasNotBeenCreated
		) {
			virtualCardHasNotBeenCreated = false;
			console.log(
				events.ETH_WALLET_TRANSACTION_SUCCESS + " exectued in background.js"
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
								events.RECEIVE_CREDIT_CARD_INFO,
							cardDetails: details,
						},
						function () {
							console.log(
								events.RECEIVE_CREDIT_CARD_INFO + " callback executed"
							);
						}
					);
				});
			sendResponse();
		}
	});
});
