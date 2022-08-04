// @format
const createMetaMaskProvider = require("metamask-extension-provider");
const jQuery = require("jquery");

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
					"registerToReceiveFormSubmissionOnReady",
			},
			function (response) {
				console.log(
					"registerToReceiveFormSubmissionOnReady callback is executed"
				);
			}
		);

		chrome.runtime.onMessage.addListener(function (
			request,
			sender,
			sendResponse
		) {
			if (request.contentEvent === "formSubmissionOnReady") {
				console.log(
					"formSubmissionOnReady passes event check and now executes callback"
				);
				sendResponse();
				console.log("BUTTON CLICKED!!!!!");
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
			console.log(transaction);

			chrome.runtime.sendMessage(
				{
					contentEvent:
						"walletCompletedEthTransaction",
					data: transaction,
				},
				function (response) {
					console.log(response.result);
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
								"ethAccountReady",
							data: response[0],
						},
						function (res) {
							console.log(
								"ethAccountReady message sent callback executed"
							);
						}
					);
					console.log("The account number is: ");
					console.log(response[0]);
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
				contentEvent: "transactionPriceReady",
				data: transactionPrice,
			},
			function (response) {
				console.log(
					"transactionPriceReady callback is executed"
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
