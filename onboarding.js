const createMetaMaskProvider = require('metamask-extension-provider')
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