const PredictionMarket = artifacts.require('PredictionMarket');


module.exports = async function (deployer, _network, addresses) {
  const [admin, oracle] = addresses;
   deployer.deploy(PredictionMarket, oracle);
};
