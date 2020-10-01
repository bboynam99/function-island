var hourglassAddress="TJ9KV8DdVhVbPAMWVHEHYnXBA4vqLwk6Jr";  // DIVS Contract
var rainmakerAddress="TRrLSZknfHCS8ejYoffGsH5EeRQ4WwT2Mt"; // RainMaker Contract
var hourglassContract;
var userTokenBalance;
var account;
var prev_account;

async function loadTronWeb(){
    if( typeof (window.tronWeb)=== 'undefined'){
        setTimeout(loadTronWeb,1000)
        alertify.error('Could not connect...');
    } else {
        hourglassContract = await tronWeb.contract().at(hourglassAddress);
        rainmakerContract = await tronWeb.contract().at(rainmakerAddress);
        alertify.success('Connected to D1VS (TRON)');
        setTimeout(function(){startLoop()},1000);
    }
}

window.addEventListener("load",function() {
    loadTronWeb();

    // buy input
    $(".buy-input").change(function(){
        var txValue=$(this).val();
        var txValueFloored = Math.floor(txValue);
        
        hourglassContract.calculateTokensReceived(tronWeb.toSun(txValueFloored)).call().then((result)=>{
            var buyAmount=parseInt(result)/ (Math.pow(10,18));
            $('.token-input-buy').val(formatTrxValue(buyAmount));
        }).catch((error)=>{console.log(error)});
        
        $.ajax({
            url: "https://min-api.cryptocompare.com/data/price?fsym=TRX&tsyms=USD", success: function(trxRate){
                $('#usdBuyValue').val(txValue * trxRate.USD.toFixed(4)) // Set USD value in the text box
            }
        });
    });
    
    // sell input
    var sellAmount;
    $(".sell-input").change(function(){
        var _sellInput=$(this).val();
        var _sellInputFloored = Math.floor(_sellInput);
        
        hourglassContract.calculateTronReceived(tronWeb.toHex(_sellInputFloored * (Math.pow(10,18)))).call().then((result)=>{
            sellAmount = sunToDisplay(parseInt(result));
            $(".token-input-sell").val(sellAmount);
            $.ajax({
                url: "https://min-api.cryptocompare.com/data/price?fsym=TRX&tsyms=USD", success: function(tokenRate){
                    $('#usdSellValue').val(sellAmount * tokenRate.USD.toFixed(4)) // Set USD value in the text box
                }
            });
        }).catch((error)=>{console.log(error)});
        
        
    });
    
    // buy token button
    $(".buy-token-button").click(function(){
        var buyTotal=tronWeb.toSun($(".buy-input").val());
        
        hourglassContract.buy(getCookie("masternode").split(";")[0]).send({callValue:buyTotal}).then((result)=>{
            alertify.success('Depositing TRX, Please Wait...')
            $(".buy-input").val(0);
            $(".buy-input").trigger("change")
            console.log("Used masternode: " + getCookie("masternode").split(";")[0]);
        }).catch((error)=>{
            alertify.error('Failed to Deposit TRX');
            console.log(error);
        })
    });
    
    // sell-token-btn.click
    $(".sell-token-button").click(function(){
        var sellTotal=$(".sell-input").val();
        sellTotal= tronWeb.toHex((sellTotal * (Math.pow(10,18))));
        hourglassContract.sell(sellTotal).send().then((result)=>{
            alertify.success('Selling D1VS, Please Wait...')
            $(".sell-input").val(0);
            $(".token-input-sell").val("0.00000000")
        }).catch((error)=>{
            alertify.error('Failed to sell D1VS');
            console.log(error)
        })
    });
    
    // sell-token-btn.click
    $(".transfer-token-button").click(function(){
        var transferTotal=$(".transfer-input").val();
        var recipientAddr=$(".recipient-input").val();
        transferTotal= tronWeb.toHex((transferTotal * (Math.pow(10,18))));
        hourglassContract.transfer(recipientAddr, transferTotal).send().then((result)=>{
            alertify.success('Sending D1VS, Please Wait...')
            $(".transfer-input").val(0);
            $(".recipient-input").val("Recipient Address...")
        }).catch((error)=>{
            alertify.error('Failed to Send D1VS');
            console.log(error)
        })
    });

    $(".btn-reinvest").click(function(){
        hourglassContract.reinvest().send().then((result)=>{
            alertify.success('Reinvesting, Please Wait...')
        }).catch((error)=>{
            alertify.error('Failed to Reinvest.');
            console.log(error)
        })
    });
    
    $(".btn-withdraw").click(function(){
        hourglassContract.withdraw().send().then((result)=>{
            alertify.success('Withdrawing TRX, Please Wait...')
        }).catch((error)=>{
            alertify.error('Failed to Withdraw TRX');
            console.log(error)
        })
    });
    $("#makeItRainTx").click(function(){
        rainmakerContract.makeItRain().send().then((result)=>{
            alertify.success('Raising Pricefloor...')
    }).catch((error)=>{
            alertify.error('Raising Pricefloor Failed');
            console.log(error)
        })
    });
});

function startLoop(){
    refreshData();
    setTimeout(startLoop,3000)
}

function refreshData(){
    updateUserInformation();
    updateNetworkInformation()
}

function updateNetworkInformation(){
    hourglassContract.totalTronBalance().call().then((result)=>{
        var TRXBalance=sunToDisplay(parseInt(result));
        $("#contract-trx-balance").html(numberWithCommas(TRXBalance));
        $("#D1VSSupply").html(TRXBalance);
        
        $.ajax({
            url:"https://min-api.cryptocompare.com/data/price?fsym=TRX&tsyms=USD,BTC,ETH",success:function(result){
                $("#supply-value-usd").html(numberWithCommas(parseFloat(parseFloat(TRXBalance * result.USD)).toFixed(2)))
                $("#supply-value-btc").html(numberWithCommas(parseFloat(parseFloat(TRXBalance * result.BTC)).toFixed(2)))
                $("#supply-value-eth").html(numberWithCommas(parseFloat(parseFloat(TRXBalance * result.ETH)).toFixed(2)))
            }
        })
    }).catch((error)=>{console.log(error)});
    
    hourglassContract.totalSupply().call().then((result)=>{
        var CompleteSupply=parseInt(result)/ (Math.pow(10,18));
        $("#contract-token-balance").html(numberWithCommas(formatTrxValue(CompleteSupply)))
    }).catch((error)=>{console.log(error)});
    
    hourglassContract.calculateTokensReceived(tronWeb.toSun(1)).call().then((result)=>{
        var RateToBuy=parseInt(result)/ (Math.pow(10,18));
        RateToBuy= 1/ RateToBuy;
        $("#rate-to-buy").html(formatTrxValue(RateToBuy))
    }).catch((error)=>{console.log(error)});
    
    tronWeb.trx.getBalance(tronWeb.defaultAddress.base58).then((_0xbc13x14)=>{
        var BalanceDisplay=sunToDisplay(parseInt(_0xbc13x14));
        $("#user-wallet-balance").html(BalanceDisplay)
    }).catch((error)=>console.error(error));

    hourglassContract.calculateTronReceived(""+ (Math.pow(10,18))).call().then((result)=>{
        var _0xbc13x16=sunToDisplay(parseInt(result));
        $("#rate-to-sell").html(_0xbc13x16)
    }).catch((error)=>{console.log(error)});
    
    rainmakerContract.myTokens().call().then((result)=>{
        var _rainmakerTokens = parseInt(result)/ (Math.pow(10,18));
        $("#rainmakerTokens").html(_rainmakerTokens.toFixed(0));
    }).catch((error)=>{console.log(error)});
    
    rainmakerContract.myDividends().call().then((result)=>{
        var _rainmakerDivs = sunToDisplay(parseInt(result));
        $("#rainmakerDividends").html(_rainmakerDivs.toFixed(0));
    }).catch((error)=>{console.log(error)});
}

function updateUserInformation(){
    // User balance
    hourglassContract.balanceOf(tronWeb.defaultAddress.base58).call().then((result)=>{
        var balanceVar=parseInt(result)/ (Math.pow(10,18));
        userTokenBalance= balanceVar;
        $(".user-token-balance").html(formatTrxValue(balanceVar));
        hourglassContract.calculateTronReceived(result).call().then((result)=>{
            var _userBalance=sunToDisplay(parseInt(result));
            $("#user-trx-balance").html(_userBalance);
            $.ajax({
                url:"https://min-api.cryptocompare.com/data/price?fsym=TRX&tsyms=USD",success:function(result){
                    $("#user-usd-balance").html(parseFloat(parseFloat(_userBalance * result.USD).toFixed(2)))
                }
            })
        }).catch((error)=>{console.log(error)})
    }).catch((error)=>{console.log(error)});
    
    hourglassContract.myDividends(true).call().then((result)=>{
        var myDivsWithRefs=sunToDisplay(parseInt(result));
        $(".user-dividends").html(myDivsWithRefs);
        $.ajax({
            url:"https://min-api.cryptocompare.com/data/price?fsym=TRX&tsyms=USD",success:function(result){
                $("#user-dividends-usd").html(parseFloat(parseFloat(myDivsWithRefs * result.USD).toFixed(2)))
            }
        })
        
        hourglassContract.calculateTokensReceived(result).call().then((result)=>{
            var _tokensReceived=parseInt(result)/ (Math.pow(10,18));
            $("#user-reinvest").html(formatTrxValue(_tokensReceived))
        }).catch((error)=>{console.log(error)})
    }).catch((error)=>{console.log(error)});
    
    $("#ref-url").val("https://functionisland.xyz/divs.html?masternode=" + tronWeb.defaultAddress.base58)
    $("#qrImage").replaceWith('<img src="https://chart.googleapis.com/chart?chs=350x350&amp;cht=qr&amp;chl=' + tronWeb.defaultAddress.base58 + '&amp;choe=UTF-8" class="roundedCorners" />');
    $("#myTronAddr").replaceWith('<small>'+ tronWeb.defaultAddress.base58 +'</small>');
}

function copyRefLink() {
    /* Get the text field */
    var copyText = $("ref-url");

    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/

    /* Copy the text inside the text field */
    document.execCommand("copy");

    /* Alert the copied text */
    alertify.success("Copied Link");
}

function checkwallet(){
    var _0xbc13x1e=$("#thewallet").val();
    if(_0xbc13x1e.length== 34){
        for(i= 1;i<= 4;i++){$(".f" + i).show()};
        account= _0xbc13x1e;
        localStorage.setItem("wallet",account)
    } else {account= 0}
}

const numberWithCommas = (x) => {return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");}
function sunToDisplay(_0xbc13x20){return formatTrxValue(tronWeb.fromSun(_0xbc13x20))}
function formatTrxValue(_0xbc13x22){return parseFloat(parseFloat(_0xbc13x22).toFixed(2))}

function getQueryVariable(_0xbc13x24){
    var _0xbc13x25=window.location.search.substring(1);
    var _0xbc13x26=_0xbc13x25.split("&");
    for(
        var _0xbc13x27=0;
        _0xbc13x27< _0xbc13x26.length;
        _0xbc13x27++
    ){
        var _0xbc13x28=_0xbc13x26[_0xbc13x27].split("=");
        if(_0xbc13x28[0]== _0xbc13x24){return _0xbc13x28[1]}
    };
    return (false)
}

function translateQuantity(_0xbc13x2a,_0xbc13x2b){
    _0xbc13x2a= Number(_0xbc13x2a);
    finalquantity= _0xbc13x2a;
    modifier= "";
    if(_0xbc13x2b== undefined){_0xbc13x2b=0};
    if(_0xbc13x2a< 1000000){_0xbc13x2b=0};
    if(_0xbc13x2a> 1000000){
        modifier= "M";
        finalquantity= _0xbc13x2a/ 1000000
    };
    
    if(_0xbc13x2a> 1000000000){
        modifier= "B";
        finalquantity= _0xbc13x2a/ 1000000000
    };
    
    if(_0xbc13x2a> 1000000000000){
        modifier= "T";
        finalquantity= _0xbc13x2a/ 1000000000000
    };
    
    if(_0xbc13x2b== 0){finalquantity= Math.floor(finalquantity)};
    return finalquantity.toFixed(_0xbc13x2b)+ modifier
}