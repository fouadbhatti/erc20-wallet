class Core {
	constructor() {
		this.$infoHeader = $('#info-header');
		this.$noWallet = $('#no-wallets-empty');
		this.$summaryBalances = $('#summaryBalances');
		this.$walletDetails = $('#wallet-details');

		myWallets.onWalletSaved(() => {
			let wallets = myWallets.fetch();
			this.getTokensAndRender(wallets);
		});

		let wallets = myWallets.fetch();

		if (wallets.length === 0) {
			this.noWallets();
			return;
		}

		this.getTokensAndRender(wallets);
	}

	registerRemoveWallet() {
		this.$removeWallet = $('.remove-wallet');

		Rx.Observable.fromEvent(this.$removeWallet, 'click')
		.map(e => {
			let address = $(e.target).closest('.card').find('.address-id').text();
			return address;
		})
		.subscribe(address => {
			let removed = Settings.removeWallet(address);
			console.log(removed);
		});
	}

	noWallets() {
		this.$noWallet.show();
		this.$infoHeader.html(`This is a Free, open-source, client-side interface for Ethereum wallet dashboard that shows, 
			in depth balance and summary of your all your Ethereum & ERC-20 tokens.<br> <b>To get started just add all your Ethereum wallet public keys and see the magic.</b>`)
	}

	getTokensAndRender(wallets) {
		this.$infoHeader.text('Tokens Summary');
		this.$noWallet.hide();
		this.$summaryBalances.empty().html(`<span class="col-sm-12">Loading Blockchain....</span>`).show();

		myWallets.getTokens(wallets)
			.subscribe((list) => {
				let summary = this.computeSummary(list);
				this.renderSummaryView(summary);
				this.renderWalletDetails(list);
				this.registerRemoveWallet();
			});
	}

	computeSummary(list) {
		// As we are changing inside wallets array thus need to cloneDeep.
		//let wallets = _.cloneDeep(list);
		let wallets = list.filter(b => !_.property('error')(b));

		return wallets.reduce((totalTokenSummary, wallet) => {
			let tokens = wallet.tokens;
			for (let token of tokens) {
					// Find if that token exists, then add baalance to it.
				let tokenIndex = _.findIndex(totalTokenSummary, _token => _token.symbol == token.symbol);
				if (tokenIndex !== -1) {
					totalTokenSummary[tokenIndex].balance = totalTokenSummary[tokenIndex].balance + token.balance;
				} else {
					totalTokenSummary.push(token);
				}
			}
			return totalTokenSummary;
		}, [])
	}

	renderTokens(tokens) {
		//<i class="align-middle pr-2 cc ${token.symbol}"></i>
		return `
			${tokens.map(token => `<span class="col-sm-4 col-6 mt-4">
                          <div class="text-center token-label">${token.symbol}</div>
                           <div class="mt-1 text-center">${Utils.roundOff(token.balance)}</div>
                        </span>`
		).join('')}`;
	}

	renderWalletDetails(list) {
		let filteredList = list.filter(b => !_.property('error')(b));
		let errorList = list.filter(b => !!_.property('error')(b));

		if (filteredList.length > 0) {
			let details = `
			${filteredList.map(item => `
				<div class="col-lg-4 mt-5 pr-2 pl-2">
					<div class="card">
            <div class="card-body">
            	<div>
	              <h5 class="card-title mt-0" style="display: inline;">${item.name}</h5>
	              <button type="button" class="close remove-wallet" aria-label="Close">
								  <span aria-hidden="true">&times;</span>
								</button>
							</div>
               <h7 class="card-subtitle mb-2 text-muted address-id">${item.address}</h7>
                <div class="row balances">
									${this.renderTokens(item.tokens)}
                 </div>
            </div>
          </div>
      	</div>
			`).join('')}
		`;
			this.$walletDetails.empty().append(details);
		}

		if (errorList.length > 0) {
			let errorDetails = `
			${errorList.map(item => `
				<div class="col-lg-4 mt-5 pr-2 pl-2">
					<div class="card">
            <div class="card-body">
            	<div>
	              <h5 class="card-title mt-0" style="display: inline;">${item.name}</h5>
	              <button type="button" class="close remove-wallet" aria-label="Close">
								  <span aria-hidden="true">&times;</span>
								</button>
							</div>
							<h7 class="card-subtitle mb-2 text-muted address-id">${item.address}</h7>
							<div class="row balances">
								<span class="col-sm-4 col-6 mt-4">
                   <div class="text-center text-danger">${item.error.message}</div>
                </span>
               </div>
            </div>
          </div>
      	</div>
			`).join('')}
		`;
			this.$walletDetails.append(errorDetails);
		}
	}

	renderSummaryView(summary) {
		const $summaryBalances = this.$summaryBalances;
		$summaryBalances.empty();
		if (summary.length > 0) {
			for (let token of summary) {
				if (token.balance >= 0.00001) {
					let balance = Utils.roundOff(token.balance);
					let className = `cc ${token.symbol} pr-2`;
					$summaryBalances.append(`<span class="col-sm-4 col-lg-3 col-xl-2 col-6 mt-4"><i class="${className}"></i>${balance} ${token.symbol}</span>`);
					const icon = $summaryBalances[0].getElementsByClassName(className)[0];

					const psudeo = window.getComputedStyle(icon, ':before').getPropertyValue('content');
					if (!psudeo) {
						$(icon).removeClass(token.symbol).addClass('BTC-alt');
					}
				}
			}
		}
	}



}

const init = new Core();