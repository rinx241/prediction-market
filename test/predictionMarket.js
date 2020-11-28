const PredictionMarket = artifacts.require('PredictionMarket.sol');
  
const Side = {
  Suning: 0,
  Damwon: 1
};

contract('PredictionMarket', function(accounts)  {
  const admin = accounts[0];
  const oracle = accounts[1];
  const gambler1 = accounts[2];
  const gambler2 = accounts[3];
  const gambler3 = accounts[4];
  const gambler4 = accounts[5];
  const deposit = web3.utils.toBN(2)

     beforeEach(async () => {
    predictionMarket = await PredictionMarket.new(oracle)
  })
   it("should mark address as enrolled", async () => {
    await predictionMarket.enroll({from: gambler1})

    const gambler1Enrolled = await predictionMarket.enrolled(gambler1, {from: gambler1})
    assert.equal(gambler1Enrolled, true, 'enroll balance is incorrect, check balance method or constructor')
  });
   it("should not mark unenrolled users as enrolled", async() =>{
    const AdminEnrolled = await predictionMarket.enrolled(admin, {from: admin})
    assert.equal(AdminEnrolled, false, 'only enrolled users should be marked enrolled')
  })
  it("should show correct amount of bet balance", async () => {
    const balance = await predictionMarket.amountBet(0,{from: gambler1})
    assert.equal(balance.toString(), balance.toString(), 'balance amount incorrect, check amountBet method')
  })
  it("should emit the PlaceBet event", async () => {
    const result = await predictionMarket.placeBet(0,{from: gambler4, value: deposit})
    
    const expectedEventResult = {accountAddress: gambler4, amount: deposit}

    const logAccountAddress = result.logs[0].args.accountAddress
    const logDepositAmount = result.logs[0].args.amount.toNumber()

    assert.equal(expectedEventResult.accountAddress, logAccountAddress, "LogPlaceBet event accountAddress property not emitted, check placebet method");
    assert.equal(expectedEventResult.amount, logDepositAmount, "LogPlaceBet event amount property not emitted, check placebet method") 
  })
  it('should work', async () => {    
    await predictionMarket.placeBet(
      Side.Suning, 
      {from: gambler1, value: web3.utils.toWei('1')}
    );
    await predictionMarket.placeBet(
      Side.Suning, 
      {from: gambler2, value: web3.utils.toWei('1')}
    );
    await predictionMarket.placeBet(
      Side.Suning, 
      {from: gambler3, value: web3.utils.toWei('2')}
    );
    await predictionMarket.placeBet(
      Side.Damwon, 
      {from: gambler4, value: web3.utils.toWei('4')}
    );

    await predictionMarket.reportResult(
      Side.Suning, 
      Side.Damwon, 
      {from: oracle}
    );

    const balancesBefore = (await Promise.all( 
      [gambler1, gambler2, gambler3, gambler4].map(gambler => (
        web3.eth.getBalance(gambler)
      ))
    ))
    .map(balance => web3.utils.toBN(balance));
    await Promise.all(
      [gambler1, gambler2, gambler3].map(gambler => (
        predictionMarket.withdrawGain({from: gambler})
      ))
    );
    const balancesAfter = (await Promise.all( 
      [gambler1, gambler2, gambler3, gambler4].map(gambler => (
        web3.eth.getBalance(gambler)
      ))
    ))
    .map(balance => web3.utils.toBN(balance));

    //gambler 1, 2, 3 should have respectively 2, 2 and 4 extra ether
    //but we also have to take into consideration gas spent when calling
    //withdrawGain(). We can ignore this problem by just comparing
    //the first 3 digits of balances
    assert(balancesAfter[0].sub(balancesBefore[0]).toString().slice(0, 3) === '199');
    assert(balancesAfter[1].sub(balancesBefore[1]).toString().slice(0, 3) === '199');
    assert(balancesAfter[2].sub(balancesBefore[2]).toString().slice(0, 3) === '399');
    assert(balancesAfter[3].sub(balancesBefore[3]).isZero());
  });
});
