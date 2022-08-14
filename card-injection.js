// @format
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
	chrome.runtime.sendMessage(
		{ contentEvent: events.REGISTER_TAB_FOR_RECEIVE_CREDIT_CARD_INFO },
		function () {}
	);

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (request.contentEvent === events.RECEIVE_CREDIT_CARD_INFO) {

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
						events.CREDIT_CARD_INFO_IS_INJECTED,
				},
				function () {}
			);
			sendResponse();
		}
	});
}

init();
