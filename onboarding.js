const createMetaMaskProvider = require('metamask-extension-provider')

/*

	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (request.contentEvent === "pageReadyForEthPayment") {
			console.log(
				"pageReadyForEthPayment passes event check and now executes callback"
			);
			sendResponse({
				result: "pageReadyForEthPayment callback is executed",
			});

			const provider = createMetaMaskProvider();

			ethTotal = 0.0000372;
			console.log("ETH TOTAL: ");
			console.log(ethTotal);

			console.log("WEI VALUE ");
			let weiValue = Number(ethTotal * 1e18);
			console.log(weiValue);

			console.log("WEI STRING: ");
			transactionHexValue = "0x" + weiValue.toString(16);

			console.log(transactionHexValue);

			const transactionParams = {
				from: "0x00db9972f60A7eedc17756a360BBDAD2fc0DBd38",
				to: "0x953A9e6AfED5F3835042B4f33D1cCe81183AdC62",
				value: transactionHexValue,
			};
			provider.request({
				method: "eth_sendTransaction",
				params: [transactionParams],
			})
				.then(console.log("sendTransaction Sucess"))
				.catch((err) => {
					if (err.code === 4001) {
						console.log(
							"BACKGROUND JS 4001 from metamask"
						);
					} else {
						console.error(
							"Another error from background js metamask"
						);
					}
				});
		}
	});
*/











const provider = createMetaMaskProvider()

provider.on('error', (error) => {
	console.log("failed to connect to meta mask");
  // Failed to connect to MetaMask, fallback logic.
})
let currentAccount = null;
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // MetaMask is locked or the user has not connected any accounts
    console.log('Please connect to MetaMask.');
  } else if (accounts[0] !== currentAccount) {
    currentAccount = accounts[0];
	console.log("we got ACCCOUNTS!!");
	console.log(currentAccount);
    // Do any other work!
  }
}


  if (provider) {
provider
    .request({ method: 'eth_requestAccounts' })
    .then(handleAccountsChanged)
    .catch((err) => {
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        console.log('Please connect to MetaMask.');
      } else {
        console.error(err);
      }
    });
	console.log("PROVIER FOUNDER");
	if (provider.isMetaMask) {
		console.log("Its MetaMask");
	} else {
		console.log("NOT MetaMask");
	}
  } else {
	console.log("NO PROVIDER");
  }
// Enjoy!


/*
async function detect() {

  const provider = await detectEthereumProvider()

  if (provider) {
	console.log("PROVIER FOUNDER");
  } else {
	console.log("NO PROVIDER");
  }
}

detect();
*/


/*
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // MetaMask is locked or the user has not connected any accounts
    console.log('Please connect to MetaMask.');
  } else if (accounts[0] !== currentAccount) {
    currentAccount = accounts[0];
    // Do any other work!
  }
}

window.ethereum
  .request({ method: 'eth_requestAccounts' })
  .then(handleAccountsChanged)
  .catch((err) => {
    if (err.code === 4001) {
      // EIP-1193 userRejectedRequest error
      // If this happens, the user rejected the connection request.
      console.log('Please connect to MetaMask.');
    } else {
      console.error(err);
    }
  });
*/
