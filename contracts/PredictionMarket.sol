import "./Ownable.sol";

pragma solidity ^0.7.3;

contract PredictionMarket is Ownable {
  enum Side { Suning, Damwon }
  struct Result {
    Side winner;
    Side loser;
  }
  Result result;
  bool gameisDone;
  bool isActive = true;
  mapping (address => bool) public enrolled;
  mapping(Side => uint) public bets;
  mapping(address => mapping(Side => uint)) public betsPerGambler;
  address public oracle;
  address admin;
  event LogEnrolled(address indexed accountAdress);
  event LogPlaceBet(address indexed accountAddress, uint indexed amount);

  constructor(address _oracle) {
    oracle = _oracle; 
    admin = msg.sender;
    }
  function CircuitBreaker() external activeContract() {
    require(admin == msg.sender);
    isActive = !isActive;
  }
  function placeBet(Side _side) external payable activeContract() {
    require(gameisDone == false, 'game is finished');
    bets[_side] += msg.value;
    betsPerGambler[msg.sender][_side] += msg.value;
    emit LogPlaceBet(msg.sender, betsPerGambler[msg.sender][_side]);
  }
  function enroll() public returns (bool){
        enrolled[msg.sender] = true;
        emit LogEnrolled(msg.sender);
        return enrolled[msg.sender]; 
  }
  function amountBet(Side _side) public view returns(uint)
  {
   return betsPerGambler[msg.sender][_side]; 
  }
  function withdrawGain() external activeContract() {
    uint gamblerBet = betsPerGambler[msg.sender][result.winner];
    require(gamblerBet > 0, 'you do not have any winning bet');  
    require(gameisDone == true, 'game not finished yet');
    uint gain = gamblerBet + bets[result.loser] * gamblerBet / bets[result.winner];
    betsPerGambler[msg.sender][Side.Suning] = 0;
    betsPerGambler[msg.sender][Side.Damwon] = 0;
    msg.sender.transfer(gain);
  }

  function reportResult(Side _winner, Side _loser) external activeContract() {
    require(oracle == msg.sender, 'only oracle');
    result.winner = _winner;
    result.loser = _loser;
    gameisDone = true;
  }
  function kill() private
    {
           if(msg.sender == owner()) selfdestruct(address(uint160(owner()))); 
    }
 modifier activeContract() {
   require(isActive == true);
   _;
 }
}
