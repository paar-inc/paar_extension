// @format
// background.js
const events = {
	// all of these below must succeed before user can click "pay w/ paar"
	REGISTER_TAB_FOR_SUBMIT_SHOPIFY_CHECKOUT_FORM: "register_tab_for_submit_shopify_checkout_form_event",
	REGISTER_TAB_FOR_RECEIVE_CREDIT_CARD_INFO: "register_tab_for_receive_credit_card_info_event",
	CONVERT_PRICE_TO_HEX_TRANSACTION: "convert_price_to_hex_transaction_event",
	STORE_USER_WALLET_ADDRESS: "store_user_wallet_address_event",
	// all of these below occur after "pay w/ paar" is clicked
	ETH_WALLET_TRANSACTION_SUCCESS: "eth_wallet_transaction_success_event",
	CREDIT_CARD_INFO_IS_INJECTED: "credit_card_info_is_injected_event",
	SUBMIT_SHOPIFY_CHECKOUT_FORM: "submit_shopify_checkout_form_event",
	RECEIVE_CREDIT_CARD_INFO: "receive_credit_card_info_event",
	CONVERT_PRICE_TO_HEX_TRANSACTION_FAILURE: "convert_price_to_hex_transaction_failure_event",
	GET_ETH_TO_USD_REQUEST_FAILURE: "get_eth_to_usd_request_failure_event",
	GET_VIRTUAL_CARD_REQUEST_FAILURE: "get_virtual_card_request_failure_event"
}

// add "transactions" where sender.tab.id is key
// let example_transaction = {
// 	createdAt: "2022-03-01-15-12345933",
// 	walletAddress: "0x38uurhvdsjahjkheih9fe8whf",
// 	usdAmount: 234549,
// 	transactionHexValue: "0x3hjdh",
// 	email: "andrew@GMAIL.COM",
// 	successfulTransactionAddresss: "0x3u2u3423u482342u43243423422",
// 	brexCardId: 123421583243,
// 	current_state: "CREDIT_CARD_INFO_IS_INJECTED"
// }
// let example_transactions = {
// 	241900: example_transaction
// }

// extension level state
let ETHtoUSD = null;
let transactions = {}

// transaction level state
// todo remove all reference to these by updating code so every
// event that previously updated one of the background scoped variables
// below 
let virtualCardHasNotBeenCreated = true;
let transactionHexValue = null;
let registeredCardDetailsTab = null;
let registeredFormSubmissionTab = null;
let transactionAmount = null;

function logTransaction(event, transaction) {
	console.log(transaction)
	// todo acm pretty up the url string for logging output in papertrail dash
	let loggingURL =
	"https://paar-server.herokuapp.com/log?event=" + event + "&data=" + JSON.stringify(transaction);
	fetch(loggingURL)
		.then(console.log("logging url server response"));
}


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
			})
			.catch((err) => {
				logTransaction(events.GET_ETH_TO_USD_REQUEST_FAILURE, {failureCode: String(err.code)})
			});
			
	}, 500);

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (request.contentEvent === events.STORE_USER_WALLET_ADDRESS) {
			currentTransaction = transactions[sender.tab.id]
			if (currentTransaction != null) {
				currentTransaction["walletAddress"] = request.data
				currentTransaction["currentState"] = events.STORE_USER_WALLET_ADDRESS
			} else {
				const currentDate = new Date();
				const currentTimestamp = currentDate.getTime();
				currentTransaction = {
					createdAt: currentTimestamp,
					walletAddress: request.data,
					currentState: events.STORE_USER_WALLET_ADDRESS
				}
			}
			transactions[sender.tab.id] = currentTransaction
			logTransaction(events.STORE_USER_WALLET_ADDRESS, currentTransaction)
			sendResponse()
		}
	});

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (request.contentEvent === events.CONVERT_PRICE_TO_HEX_TRANSACTION) {
			transactionAmount = request.data.transactionPrice * 100
			if (ETHtoUSD != null) {
				let ethTotal = request.data.transactionPrice / ETHtoUSD;
				let weiValue = Number(ethTotal * 1e18);
				transactionHexValue =
					"0x" + parseInt(weiValue).toString(16);

				currentTransaction = transactions[sender.tab.id]
				if (currentTransaction != null) {
					currentTransaction["usdAmount"] = transactionAmount
					currentTransaction["transactionHexValue"] = transactionHexValue
					currentTransaction["email"] = request.data.email
					currentTransaction["currentState"] = events.CONVERT_PRICE_TO_HEX_TRANSACTION
				} else {
					const currentDate = new Date();
					const currentTimestamp = currentDate.getTime();
					currentTransaction = {
						createdAt: currentTimestamp,
						usdAmount: transactionAmount,
						transactionHexValue: transactionHexValue,
						email: request.data.email,
						currentState: events.CONVERT_PRICE_TO_HEX_TRANSACTION
					}
				}
				transactions[sender.tab.id] = currentTransaction
				logTransaction(events.CONVERT_PRICE_TO_HEX_TRANSACTION, currentTransaction)
				sendResponse({ hexValue: transactionHexValue });
			} else {
				currentTransaction = transactions[sender.tab.id]
				if (currentTransaction != null) {
					currentTransaction["usdAmount"] = transactionAmount
					currentTransaction["email"] = request.data.email
					currentTransaction["currentState"] = events.CONVERT_PRICE_TO_HEX_TRANSACTION_FAILURE
				} else {
					const currentDate = new Date();
					const currentTimestamp = currentDate.getTime();
					currentTransaction = {
						createdAt: currentTimestamp,
						usdAmount: transactionAmount,
						email: request.data.email,
						currentState: events.events.CONVERT_PRICE_TO_HEX_TRANSACTION_FAILURE
					}
				}

				logTransaction(events.CONVERT_PRICE_TO_HEX_TRANSACTION_FAILURE, currentTransaction)
				transactions[sender.tab.id] = currentTransaction
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

			currentTransaction = transactions[sender.tab.id]
			if (currentTransaction != null) {
				currentTransaction["currentState"] = events.CREDIT_CARD_INFO_IS_INJECTED
			} else {
				// ERROR todo acm
			}
			transactions[sender.tab.id] = currentTransaction
			logTransaction(events.CREDIT_CARD_INFO_IS_INJECTED, currentTransaction)

			chrome.tabs.sendMessage(
				registeredFormSubmissionTab,
				{
					contentEvent:
						events.SUBMIT_SHOPIFY_CHECKOUT_FORM,
				},
				function (response) {
					currentTransaction = transactions[sender.tab.id]
					if (currentTransaction != null) {
						currentTransaction["currentState"] = events.SUBMIT_SHOPIFY_CHECKOUT_FORM
					} else {
						// ERROR todo acm
					}
					transactions[sender.tab.id] = currentTransaction
					logTransaction(events.SUBMIT_SHOPIFY_CHECKOUT_FORM, currentTransaction)
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

			currentTransaction = transactions[sender.tab.id]
			if (currentTransaction != null) {
				currentTransaction["successfulTransactionAddress"] = request.data
				currentTransaction["currentState"] = events.ETH_WALLET_TRANSACTION_SUCCESS
			} else {
				// ERROR todo acm
			}
			transactions[sender.tab.id] = currentTransaction
			logTransaction(events.ETH_WALLET_TRANSACTION_SUCCESS, currentTransaction)
			
			//todo acm flip to prod before zippping
			let prodUrl = "https://paar-server.herokuapp.com"
			let testUrl = "http://127.0.0.1:8000"
			let fetchURL = prodUrl + "/api/virtual-card" + "?" + "transaction=" + currentTransaction.successfulTransactionAddress + "&wallet=" + currentTransaction.walletAddress + "&email=" + currentTransaction.email
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
						function () {}
					);

					currentTransaction = transactions[sender.tab.id]
					if (currentTransaction != null) {
						// todo acm --- update this to actual brex id.. django update required
						currentTransaction["brexCardId"] = data["expiration"]
						currentTransaction["currentState"] = events.RECEIVE_CREDIT_CARD_INFO
					} else {
						// ERROR todo acm
					}
					transactions[sender.tab.id] = currentTransaction
					logTransaction(events.RECEIVE_CREDIT_CARD_INFO, currentTransaction)
				})
				.catch((err) => {
					logTransaction(events.GET_VIRTUAL_CARD_REQUEST_FAILURE, {failureCode: String(err.code)})
				});
			sendResponse();
		}
	});
});
