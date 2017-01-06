var StellarSdk = require('stellar-sdk');

// StellarSdk.Network.use(new StellarSdk.Network('basement.network'))
StellarSdk.Network.use(new StellarSdk.Network('euah.network'))

var horizon            = new StellarSdk.Server('http://de.euah.pw:8000');
var currency           = 'EUAH';

var key_master         = StellarSdk.Keypair.fromSeed('SAWVTL2JG2HTPPABJZKN3GJEDTHT7YD3TW5XWAWPKAE2NNZPWNNBOIXE');
var key_comission      = StellarSdk.Keypair.fromSeed('SDJMPBP56ID252RRQC4Q2IQ4ANDVADZ72B77KSUUZUXAAAXQVOLLL6BG');
var key_general        = StellarSdk.Keypair.fromSeed('SC4WEX3G4G2ANQNEWK2XLZTWYJGBA5LSM54XSDWDKGUUFVODBG2OQZGO');

var key_admin          = StellarSdk.Keypair.random()
var key_emission       = StellarSdk.Keypair.random()
var key_general_signer = StellarSdk.Keypair.random()

var g_agent_signer     = StellarSdk.Keypair.random()
var d_agent            = StellarSdk.Keypair.random() //distr agent

function createAdmin(){
    return horizon.loadAccount(key_master.accountId())
        .then(function (source) {
            var tx = new StellarSdk.TransactionBuilder(source)
                .addOperation(StellarSdk.Operation.setOptions({
                    signer: {
                        pubKey: key_admin.accountId(),
                        weight: 1,
                        signerType: StellarSdk.xdr.SignerType.signerAdmin().value
                    }
                }))
                .build();

            tx.sign(key_master)

            return horizon.submitTransaction(tx)
        })
}

function createAsset(){
    return horizon.loadAccount(key_master.accountId())
        .then(function (source) {
            var asset = new StellarSdk.Asset(currency, key_master.accountId());

            var tx = new StellarSdk.TransactionBuilder(source).addOperation(
                StellarSdk.Operation.manageAssets(asset, true, false)
            ).build();

            tx.sign(key_admin);
            return horizon.submitTransaction(tx);
        })
}

function generateEmission(){
    return horizon.loadAccount(key_master.accountId())
        .then(function (source) {
            var tx = new StellarSdk.TransactionBuilder(source)
                .addOperation(StellarSdk.Operation.setOptions({
                    signer: {
                        pubKey: key_emission.accountId(),
                        weight: StellarSdk.xdr.SignerType.signerEmission().value,
                        signerType: StellarSdk.xdr.SignerType.signerEmission().value
                        // signerType: StellarSdk.xdr.SignerType.signerGeneral().value
                    }
                }))
                .build();

            tx.sign(key_master)
            return horizon.submitTransaction(tx)
        })
}

function createDistrAgent(){
    return horizon.loadAccount(key_master.accountId())
        .then(function (source) {
            var tx = new StellarSdk.TransactionBuilder(source)
                .addOperation(StellarSdk.Operation.createAccount({
                    destination: d_agent.accountId(),
                    accountType: StellarSdk.xdr.AccountType.accountDistributionAgent().value
                }))
                .build();

            tx.sign(key_admin);

            return horizon.submitTransaction(tx);
        })
}

function createGeneralSigner(){
    return horizon.loadAccount(key_master.accountId())
        .then(function (source) {
            var tx = new StellarSdk.TransactionBuilder(source)
                .addOperation(StellarSdk.Operation.setOptions({
                    signer: {
                        pubKey: key_general_signer.accountId(),
                        weight: StellarSdk.xdr.SignerType.signerGeneral().value,
                        signerType: StellarSdk.xdr.SignerType.signerGeneral().value
                    }
                }))
                .build();

            tx.sign(key_master)
            return horizon.submitTransaction(tx)
        })
}

function changeTrust(a, signer) {
    horizon.loadAccount(a.accountId())
        .then(function (source) {
            var tx = new StellarSdk.TransactionBuilder(source)
                .addOperation(
                    StellarSdk.Operation.changeTrust({
                        asset: new StellarSdk.Asset(currency, key_master.accountId())
                    })
                ).build();

            tx.sign(signer);
            return horizon.submitTransaction(tx);
        })
        .catch(err => {
            console.log(err.response.data.extras);
        })
}

function sendMoney(){
    return horizon.loadAccount(key_master.accountId())
        .then(source => {
            var tx = new StellarSdk.TransactionBuilder(source)
                .addOperation(StellarSdk.Operation.payment({
                    destination: key_general.accountId(),
                    amount: "0.10",
                    asset: new StellarSdk.Asset(currency, source.accountId())
                }))
                .build();

            tx.sign(key_emission);
            return horizon.submitTransaction(tx)
        })
}

createAdmin()
.then(createAsset)
.then(generateEmission)
.then(createDistrAgent)
.then(createGeneralSigner)
// .then(sendMoney)
    .then(resp => {
        console.log('200');
        console.log(resp);
    })
    .catch(err => {
        console.log(err)
        // console.log(err.response.data);
    });