// @format
const createMetaMaskProvider = require("metamask-extension-provider");
const jQuery = require("jquery");
const events = {
	CONVERT_PRICE_TO_HEX_TRANSACTION: "convert_price_to_hex_transaction_event",
	REQUEST_USER_WALLET_PERMISSION: "request_user_wallet_permission_event",
	REQUEST_USER_WALLET_PERMISSION_SUCCESS: "request_user_wallet_permission_success_event",
	REQUEST_USER_WALLET_PERMISSION_FAILURE: "request_user_wallet_permission_failure_event",

	STORE_USER_WALLET_ADDRESS: "store_user_wallet_address_event",
	CREDIT_CARD_INFO_IS_INJECTED: "credit_card_info_is_injected_event",
	SUBMIT_SHOPIFY_CHECKOUT_FORM: "submit_shopify_checkout_form_event",
	RECEIVE_CREDIT_CARD_INFO: "receive_credit_card_info_event",
	REGISTER_TAB_FOR_SUBMIT_SHOPIFY_CHECKOUT_FORM: "register_tab_for_submit_shopify_checkout_form_event",
	REGISTER_TAB_FOR_RECEIVE_CREDIT_CARD_INFO: "register_tab_for_receive_credit_card_info_event",
	ETH_WALLET_TRANSACTION_SUCCESS: "eth_wallet_transaction_success_event",
	ETH_WALLET_TRANSACTION_FAILURE: "eth_wallet_transaction_failure_event"
}

function logTransaction(event, transaction) {
	console.log(transaction)
	// todo acm pretty up the url string for logging output in papertrail dash
	let loggingURL =
	"https://paar-server.herokuapp.com/log?event=" + event + "&data=" + JSON.stringify(transaction);
	fetch(loggingURL)
		.then(console.log("logging url server response"));
}
let shopifyCheckoutDetected = false


async function init() {

	setInterval(() => {
		if (!shopifyCheckoutDetected) {
			let transactionPrice = null;
			let transactionHexValue = null;
			let userWalletAddress = null
			let newButton = null;
			let loader = null;
			let newDiv = null;

			let formCheck = document.getElementById("basic-direct-collapsible");
			const priceEl =
				document.getElementsByClassName("_19gi7yt0 _19gi7yto _1fragemz _19gi7ytb _19gi7yt3")[0];

			if (priceEl && formCheck != null && !shopifyCheckoutDetected) {
				shopifyCheckoutDetected = true
				chrome.runtime.sendMessage(
					{
						contentEvent:
							events.REGISTER_TAB_FOR_SUBMIT_SHOPIFY_CHECKOUT_FORM,
					},
					function () {}
				);

				chrome.runtime.onMessage.addListener(function (
					request,
					sender,
					sendResponse
				) {
					if (request.contentEvent === events.SUBMIT_SHOPIFY_CHECKOUT_FORM) {
						sendResponse();
						let c =
							document.getElementById(
								"continue_button"
							);
						c.click();
					}
				});

				const paymentDuePrice = Number(priceEl.innerHTML.substring(1))

				transactionPrice = paymentDuePrice;

				const provider = createMetaMaskProvider();
				let currentAccount = null;

				function getVirtualCard(transaction) {
					chrome.runtime.sendMessage(
						{
							contentEvent:
								events.ETH_WALLET_TRANSACTION_SUCCESS,
							data: transaction,
						},
						function () {}
					);
				}

				function sendTransaction(transaction, userAddress) {
					const transactionParams = {
						from: userAddress,
						to: "0x953A9e6AfED5F3835042B4f33D1cCe81183AdC62",
						value: transaction,
					};
					provider.request({
						method: "eth_sendTransaction",
						params: [transactionParams],
					})
						.then(getVirtualCard)
						.catch((err) => {
							newDiv.removeChild(loader)
							newDiv.appendChild(newButton)
							logTransaction(events.ETH_WALLET_TRANSACTION_FAILURE, {failureCode: String(err.code)})
						});
				}

				function getWalletPermission() {
					logTransaction(events.REQUEST_USER_WALLET_PERMISSION, {})
					provider.request({
						method: "eth_requestAccounts",
					})
						.then((response) => {
							logTransaction(events.REQUEST_USER_WALLET_PERMISSION_SUCCESS, {userWalletAddress: response[0]})
							chrome.runtime.sendMessage(
								{
									contentEvent:
										events.STORE_USER_WALLET_ADDRESS,
									data: response[0],
								},
								function () {}
							);
							userWalletAddress = response[0]
						})
						.catch((err) => {
							logTransaction(events.REQUEST_USER_WALLET_PERMISSION_FAILURE, {failureCode: String(err.code) })
						});
				}
				getWalletPermission();
				let email = document.querySelectorAll('bdo')[0].innerHTML
				chrome.runtime.sendMessage(
					{
						contentEvent: events.CONVERT_PRICE_TO_HEX_TRANSACTION,
						data: {
							transactionPrice: transactionPrice,
							email: email
						},
					},
					function (response) {
						transactionHexValue = response.hexValue;
						newDiv.removeChild(loader)
						newDiv.appendChild(newButton)
					}
				);

				let b = document.getElementsByClassName("_1xO-s _12pKa uGXqL _3eTZ7 _8ysAV")[1]
				newDiv = document.createElement("div")
				newDiv.style.width = String(b.offsetWidth) + "px"
				let adjustedHeight = b.offsetHeight - 110
				newDiv.style.height = String(adjustedHeight) + "px"
				newDiv.style.position = "absolute"
				newDiv.style.zIndex = "10000"
				newDiv.style.background = "white"
				newDiv.style.border = "1px solid"
				newDiv.style.borderColor = "#d9d9d9"
				newDiv.style.borderRadius = "5px"
				newDiv.style.marginTop = "110px"

				// create a new div element
				newButton = document.createElement("div");
				newButton.innerHTML = "Paar Pay";
				newButton.style.borderRadius = "5px"
				newButton.style.width = "40%";
				newButton.style.height = "15%";
				newButton.style.background = "black";
				newButton.style.alignItems = "center"
				newButton.style.display = "flex"
				newButton.style.justifyContent = "center"
				newButton.style.margin = "auto"
				newButton.style.color = "white";
				newButton.style.marginTop = "20px"
				loader = document.createElement("div")
				loader.className = "loader"
				
				newButton.addEventListener("click", function () {
					newDiv.removeChild(newButton)
					newDiv.appendChild(loader)
					sendTransaction(transactionHexValue, userWalletAddress);
				});


				newDiv.appendChild(loader)
				b.parentNode.insertBefore(newDiv, b)
			}
	};

}, 250);
}

init();
