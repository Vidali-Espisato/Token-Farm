pragma solidity ^0.5.0;
import "./DappToken.sol";
import "./DaiToken.sol";


contract TokenFarm {
    string public name = "Dapp Token Farm";
    DappToken public dappToken;
    DaiToken public daiToken;
    address public owner;
    address[] public stakers;

    mapping(address => bool) public isStaking;
    mapping(address => bool) public hasStaked;
    mapping(address => uint) public stakingBalance;

    constructor(DappToken _dappToken, DaiToken _daiToken) public {
        dappToken = _dappToken;
        daiToken = _daiToken;
        owner = msg.sender;
    }

    function stakeTokens(uint _amount ) public {
        require(_amount > 0, "Amount must be greater than 0.");

        daiToken.transferFrom(msg.sender, address(this), _amount);
        
        stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;
        if (!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
        }

        isStaking[msg.sender] = true;
        hasStaked[msg.sender] = true;
    }

    function issueTokens() public {
        require(msg.sender == owner, "UnAuthorized");

        for (uint i = 0; i < stakers.length; i++) {
            address staker = stakers[i];
            uint balance = stakingBalance[staker];

            if (balance > 0) {
                dappToken.transfer(staker, balance);
            }
        }
    }
}