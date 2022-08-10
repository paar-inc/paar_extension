// @format
const createMetaMaskProvider = require("metamask-extension-provider");
const jQuery = require("jquery");
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

async function init() {
	console.info("init content");
	let transactionPrice = null;
	let transactionHexValue = null;
	let userWalletAddress = null

	let formCheck = document.getElementById("checkout_credit_card_vault");
	const priceEl =
		document.getElementsByClassName("payment-due__price")[0];

	if (priceEl && formCheck != null) {
		chrome.runtime.sendMessage(
			{
				contentEvent:
					events.REGISTER_TAB_FOR_SUBMIT_SHOPIFY_CHECKOUT_FORM,
			},
			function () {
				console.log(
					events.REGISTER_TAB_FOR_SUBMIT_SHOPIFY_CHECKOUT_FORM + " callback is executed"
				);
			}
		);

		chrome.runtime.onMessage.addListener(function (
			request,
			sender,
			sendResponse
		) {
			if (request.contentEvent === events.SUBMIT_SHOPIFY_CHECKOUT_FORM) {
				console.log(
					events.SUBMIT_SHOPIFY_CHECKOUT_FORM + " received in content script"
				);
				sendResponse();
				let c =
					document.getElementById(
						"continue_button"
					);
				c.click();
			}
		});

		const paymentDuePrice = priceEl.getAttribute(
			"data-checkout-payment-due-target"
		);
		transactionPrice = paymentDuePrice / 100;

		const provider = createMetaMaskProvider();
		let currentAccount = null;

		function getVirtualCard(transaction) {
			console.log(
				"getVirtualCard function callback was executed after transaction sent in content script"
			);
			chrome.runtime.sendMessage(
				{
					contentEvent:
						events.ETH_WALLET_TRANSACTION_SUCCESS,
					data: transaction,
				},
				function () {
					console.log(events.ETH_WALLET_TRANSACTION_SUCCESS + " callback executed");
				}
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
					if (err.code === 4001) {
						console.log(
							"transaction FAILED WITH 4001"
						);
					} else {
						console.error(err);
						console.log(
							"transaction FAILED!!!"
						);
					}
				});
		}

		function getWalletPermission() {
			provider.request({
				method: "eth_requestAccounts",
			})
				.then((response) => {
					chrome.runtime.sendMessage(
						{
							contentEvent:
								events.STORE_USER_WALLET_ADDRESS,
							data: response[0],
						},
						function () {
							console.log(
								events.STORE_USER_WALLET_ADDRESS + " callback executed"
							);
						}
					);
					userWalletAddress = response[0]
				})
				.catch((err) => {
					if (err.code === 4001) {
						console.log(
							"permissions fetch FAILED WITH 4001"
						);
					} else {
						console.error(err);
						console.log(
							"get PERMISSIONS FFAILED!!!"
						);
					}
				});
		}
		getWalletPermission();

		chrome.runtime.sendMessage(
			{
				contentEvent: events.CONVERT_PRICE_TO_HEX_TRANSACTION,
				data: transactionPrice,
			},
			function (response) {
				console.log(
					events.CONVERT_PRICE_TO_HEX_TRANSACTION + " event callback executed"
				);

				transactionHexValue = response.hexValue;
			}
		);

		let b = document.getElementsByClassName("section section--payment-method")[0]
		let newDiv = document.createElement("div")
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


		let h = document.getElementById("order-summary");

		// create a new div element
		const newButton = document.createElement("div");
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
		newButton.addEventListener("click", function () {
			sendTransaction(transactionHexValue, userWalletAddress);
		});

		newDiv.appendChild(newButton)
		b.parentNode.insertBefore(newDiv, b)
	}
}

init();
