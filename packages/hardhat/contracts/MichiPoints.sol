// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MichiPoints
/// @notice Sistema de puntos de fidelizacion
contract MichiPoints is Ownable {
    string public constant name = "MichiPoints";
    string public constant symbol = "MCHI";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => bool) public merchants;

    uint256 public rewardRate = 1; // 1 MCHI por unidad monetaria gastada

    event MerchantRegistered(address merchant);
    event MerchantRemoved(address merchant);
    event RewardMinted(address indexed merchant, address indexed customer, uint256 purchaseAmount, uint256 reward);
    event RewardRedeemed(address indexed merchant, address indexed customer, uint256 amount);

    modifier onlyMerchant() {
        require(merchants[msg.sender], "Not authorized merchant");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Deployer queda como comercio autorizado por defecto
        merchants[msg.sender] = true;
        emit MerchantRegistered(msg.sender);

        // 1000 MichiPoints iniciales de cortesia para el owner (test)
        uint256 initial = 1000 * 10 ** decimals;
        balanceOf[msg.sender] = initial;
        totalSupply = initial;
    }

    function registerMerchant(address merchant) external onlyOwner {
        merchants[merchant] = true;
        emit MerchantRegistered(merchant);
    }

    function removeMerchant(address merchant) external onlyOwner {
        merchants[merchant] = false;
        emit MerchantRemoved(merchant);
    }

    /// @notice El comercio otorga puntos al cliente tras una compra
    function mintRewardToken(address customer, uint256 purchaseAmount) external onlyMerchant {
        uint256 reward = purchaseAmount * rewardRate * 10 ** decimals;
        balanceOf[customer] += reward;
        totalSupply += reward;
        emit RewardMinted(msg.sender, customer, purchaseAmount, reward);
    }

    /// @notice El comercio canjea (quema) puntos cuando el cliente los redime
    function burnRewardToken(address customer, uint256 amount) external onlyMerchant {
        uint256 amt = amount * 10 ** decimals;
        require(balanceOf[customer] >= amt, "Insufficient points");
        balanceOf[customer] -= amt;
        totalSupply -= amt;
        emit RewardRedeemed(msg.sender, customer, amount);
    }

    function updateRewardRate(uint256 newRate) external onlyOwner {
        rewardRate = newRate;
    }
}
