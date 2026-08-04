// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MichiCoin is ERC20, Ownable {
    uint256 public rewardRate = 10;
    // 10 tokens por cada unidad monetaria

    mapping(address => bool) public merchants;

    event MerchantRegistered(address merchant);
    event MerchantRemoved(address merchant);

    event RewardMinted(address merchant, address customer, uint256 purchaseAmount, uint256 reward);

    event RewardRedeemed(address merchant, address customer, uint256 amount);

    constructor() ERC20("MichiCoin", "MCHI") Ownable(msg.sender) {}

    modifier onlyMerchant() {
        require(merchants[msg.sender], "Not authorized merchant");
        _;
    }

    function registerMerchant(address merchant) external onlyOwner {
        merchants[merchant] = true;
        emit MerchantRegistered(merchant);
    }

    function removeMerchant(address merchant) external onlyOwner {
        merchants[merchant] = false;
        emit MerchantRemoved(merchant);
    }

    function mintRewardToken(address customer, uint256 purchaseAmount) external onlyMerchant {
        uint256 reward = purchaseAmount * rewardRate;

        _mint(customer, reward);

        emit RewardMinted(msg.sender, customer, purchaseAmount, reward);
    }

    function burnRewardToken(address customer, uint256 amount) external onlyMerchant {
        _burn(customer, amount);

        emit RewardRedeemed(msg.sender, customer, amount);
    }

    function updateRewardRate(uint256 newRate) external onlyOwner {
        rewardRate = newRate;
    }
}
