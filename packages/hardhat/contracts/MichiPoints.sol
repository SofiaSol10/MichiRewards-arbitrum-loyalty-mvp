// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MichiPoints
/// @notice Sistema cerrado de puntos de fidelizacion (no es un token ERC-20 ni es transferible).
/// Los comercios autorizados otorgan puntos por compras registradas (`registerPurchase`) y
/// publican un catalogo de beneficios (`Reward`) que los clientes canjean con sus puntos
/// (`redeemReward`), generando un ticket de autorizacion con codigo unico y expiracion de
/// 15 minutos que el comercio valida en caja (`validateTicket`). El nivel "Michi" del cliente
/// se calcula sobre el historico de puntos ganados, nunca sobre el saldo gastable, para que
/// canjear beneficios no le haga perder nivel.
contract MichiPoints is Ownable {
    /// @notice Estado de un ticket de autorizacion generado al canjear un beneficio.
    enum TicketStatus {
        Active,
        Redeemed,
        Expired
    }

    /// @notice Beneficio publicado por un comercio en su catalogo.
    struct Reward {
        uint256 id;
        address merchant;
        string title;
        uint8 requiredLevel; // nivel Michi minimo requerido (1-5)
        uint256 costInPoints;
        uint256 stock;
        bool active;
    }

    /// @notice Ticket de autorizacion generado al canjear un beneficio.
    /// @dev `status` solo se guarda como `Active` o `Redeemed`; `Expired` se calcula
    /// en lectura comparando `expiresAt` contra `block.timestamp` (no hay keeper on-chain).
    struct Ticket {
        bytes32 ticketId;
        string code;
        address customer;
        address merchant;
        uint256 rewardId;
        uint256 pointsSpent;
        uint256 expiresAt;
        TicketStatus status;
    }

    /// @notice Comercios autorizados a registrar compras y gestionar su catalogo.
    mapping(address => bool) public merchants;

    /// @notice Saldo de puntos gastable de cada cliente (sube con compras, baja con canjes).
    mapping(address => uint256) public balanceOf;

    /// @notice Total historico de puntos ganados por cliente. Solo incrementa: es la base
    /// del calculo de nivel para que canjear beneficios nunca haga bajar de nivel.
    mapping(address => uint256) public totalPointsEarned;

    /// @notice Total de puntos otorgados por cada comercio a sus clientes (metrica de panel).
    mapping(address => uint256) public merchantPointsIssued;

    /// @notice Total de puntos recibidos por cada comercio en canjes (metrica de panel).
    mapping(address => uint256) public merchantPointsRedeemed;

    /// @notice 1 MichiPoint = 1 unidad de moneda local gastada, salvo que el owner ajuste la tasa.
    uint256 public rewardRate = 1;

    /// @notice Duracion de validez de un ticket de autorizacion (15 minutos).
    uint256 public constant TICKET_TTL = 900;

    mapping(uint256 => Reward) public rewards;
    uint256 private nextRewardId = 1;
    mapping(address => uint256[]) private merchantRewardIds;

    mapping(bytes32 => Ticket) public tickets;
    mapping(string => bytes32) private codeToTicketId;
    uint256 private ticketNonce;

    bytes private constant CODE_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    event MerchantRegistered(address merchant);
    event MerchantRemoved(address merchant);

    /// @notice Emitido en cada compra registrada; pensado para indexacion por la capa de analitica/IA.
    event PurchaseRegistered(
        address indexed user,
        address indexed merchant,
        uint256 amount,
        uint256 points,
        uint256 timestamp
    );

    event RewardCreated(
        uint256 indexed rewardId,
        address indexed merchant,
        string title,
        uint8 requiredLevel,
        uint256 costInPoints,
        uint256 stock
    );
    event RewardUpdated(uint256 indexed rewardId, bool active, uint256 stock);

    event TicketGenerated(
        bytes32 indexed ticketId,
        string code,
        address indexed customer,
        address indexed merchant,
        uint256 rewardId,
        uint256 pointsSpent,
        uint256 expiresAt
    );
    event TicketValidated(bytes32 indexed ticketId, address indexed merchant, address indexed customer);

    modifier onlyMerchant() {
        require(merchants[msg.sender], "No autorizado: no eres un comercio");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Deployer queda como comercio autorizado por defecto. No hay mint de cortesia:
        // los puntos solo se originan en compras registradas.
        merchants[msg.sender] = true;
        emit MerchantRegistered(msg.sender);
    }

    // ==========================================
    // Gestion de comercios (owner)
    // ==========================================

    function registerMerchant(address merchant) external onlyOwner {
        merchants[merchant] = true;
        emit MerchantRegistered(merchant);
    }

    function removeMerchant(address merchant) external onlyOwner {
        merchants[merchant] = false;
        emit MerchantRemoved(merchant);
    }

    function updateRewardRate(uint256 newRate) external onlyOwner {
        rewardRate = newRate;
    }

    // ==========================================
    // Registro de compras (comercio -> cliente)
    // ==========================================

    /// @notice El comercio registra una venta y otorga los MichiPoints correspondientes al cliente.
    function registerPurchase(address customer, uint256 purchaseAmount) external onlyMerchant {
        require(customer != address(0), "Direccion de cliente invalida");
        require(purchaseAmount > 0, "El monto gastado debe ser mayor a 0");

        uint256 points = purchaseAmount * rewardRate;

        balanceOf[customer] += points;
        totalPointsEarned[customer] += points;
        merchantPointsIssued[msg.sender] += points;

        emit PurchaseRegistered(customer, msg.sender, purchaseAmount, points, block.timestamp);
    }

    // ==========================================
    // Catalogo de beneficios (comercio)
    // ==========================================

    /// @notice El comercio publica un beneficio canjeable a partir de un nivel Michi minimo.
    function createReward(
        string memory title,
        uint8 requiredLevel,
        uint256 costInPoints,
        uint256 stock
    ) external onlyMerchant returns (uint256 rewardId) {
        require(requiredLevel >= 1 && requiredLevel <= 5, "Nivel invalido (1-5)");
        require(costInPoints > 0, "El costo debe ser mayor a 0");

        rewardId = nextRewardId++;
        rewards[rewardId] = Reward({
            id: rewardId,
            merchant: msg.sender,
            title: title,
            requiredLevel: requiredLevel,
            costInPoints: costInPoints,
            stock: stock,
            active: true
        });
        merchantRewardIds[msg.sender].push(rewardId);

        emit RewardCreated(rewardId, msg.sender, title, requiredLevel, costInPoints, stock);
    }

    /// @notice Activa/desactiva un beneficio propio sin borrarlo del catalogo.
    function setRewardActive(uint256 rewardId, bool active) external onlyMerchant {
        Reward storage reward = rewards[rewardId];
        require(reward.merchant == msg.sender, "No eres el dueno de este beneficio");
        reward.active = active;
        emit RewardUpdated(rewardId, reward.active, reward.stock);
    }

    /// @notice Repone stock de un beneficio propio.
    function restock(uint256 rewardId, uint256 amount) external onlyMerchant {
        require(amount > 0, "La cantidad debe ser mayor a 0");
        Reward storage reward = rewards[rewardId];
        require(reward.merchant == msg.sender, "No eres el dueno de este beneficio");
        reward.stock += amount;
        emit RewardUpdated(rewardId, reward.active, reward.stock);
    }

    /// @notice Lista los beneficios publicados por un comercio (para el panel/vista de cliente).
    function getRewardsByMerchant(address merchant) external view returns (Reward[] memory) {
        uint256[] memory ids = merchantRewardIds[merchant];
        Reward[] memory result = new Reward[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = rewards[ids[i]];
        }
        return result;
    }

    // ==========================================
    // Canje de puntos y tickets de autorizacion
    // ==========================================

    /// @notice El cliente canjea un beneficio: quema sus puntos, descuenta stock y genera
    /// un ticket de autorizacion con codigo unico que debe presentar en el comercio.
    function redeemReward(uint256 rewardId) external returns (bytes32 ticketId, string memory code) {
        Reward storage reward = rewards[rewardId];
        require(reward.merchant != address(0), "Beneficio inexistente");
        require(reward.active, "El beneficio no esta activo");
        require(reward.stock > 0, "Sin stock disponible");

        (uint8 level, ) = _levelOf(totalPointsEarned[msg.sender]);
        require(level >= reward.requiredLevel, "Nivel de Michi insuficiente para este beneficio");
        require(balanceOf[msg.sender] >= reward.costInPoints, "MichiPoints insuficientes");

        balanceOf[msg.sender] -= reward.costInPoints;
        reward.stock -= 1;
        merchantPointsRedeemed[reward.merchant] += reward.costInPoints;

        (ticketId, code) = _generateUniqueCode(msg.sender, rewardId);
        uint256 expiresAt = block.timestamp + TICKET_TTL;

        tickets[ticketId] = Ticket({
            ticketId: ticketId,
            code: code,
            customer: msg.sender,
            merchant: reward.merchant,
            rewardId: rewardId,
            pointsSpent: reward.costInPoints,
            expiresAt: expiresAt,
            status: TicketStatus.Active
        });
        codeToTicketId[code] = ticketId;

        emit TicketGenerated(ticketId, code, msg.sender, reward.merchant, rewardId, reward.costInPoints, expiresAt);
    }

    /// @notice El comercio valida en caja el codigo presentado por el cliente y consume el ticket.
    function validateTicket(string memory ticketCode) external onlyMerchant {
        bytes32 ticketId = codeToTicketId[ticketCode];
        require(ticketId != bytes32(0), "Ticket inexistente");

        Ticket storage ticket = tickets[ticketId];
        require(ticket.merchant == msg.sender, "Este ticket pertenece a otro comercio");
        require(ticket.status == TicketStatus.Active, "El ticket ya fue consumido");
        require(block.timestamp <= ticket.expiresAt, "El ticket ha expirado");

        ticket.status = TicketStatus.Redeemed;
        emit TicketValidated(ticketId, msg.sender, ticket.customer);
    }

    /// @notice Estado efectivo de un ticket, calculando la expiracion en tiempo de lectura.
    function getTicketStatus(bytes32 ticketId) external view returns (TicketStatus) {
        Ticket storage ticket = tickets[ticketId];
        require(ticket.ticketId != bytes32(0), "Ticket inexistente");

        if (ticket.status == TicketStatus.Redeemed) {
            return TicketStatus.Redeemed;
        }
        if (block.timestamp > ticket.expiresAt) {
            return TicketStatus.Expired;
        }
        return TicketStatus.Active;
    }

    // ==========================================
    // Nivel Michi
    // ==========================================

    /// @notice Nivel Michi de un usuario segun su total historico de puntos ganados.
    function getMichiLevel(address user) external view returns (uint8 level, string memory levelName) {
        return _levelOf(totalPointsEarned[user]);
    }

    function _levelOf(uint256 points) internal pure returns (uint8 level, string memory levelName) {
        if (points >= 10000) {
            return (5, unicode"Michi Cósmico");
        }
        if (points >= 5000) {
            return (4, unicode"Michi Supremo");
        }
        if (points >= 2500) {
            return (3, unicode"Michi Cazador Nocturno");
        }
        if (points >= 500) {
            return (2, unicode"Michi Explorador");
        }
        return (1, unicode"Michi Bebé");
    }

    // ==========================================
    // Generacion de codigos de ticket
    // ==========================================

    /// @dev Genera un `ticketId`/`code` unico, reintentando ante una colision de codigo
    /// (probabilisticamente nula: 1 en 36^5 por intento).
    function _generateUniqueCode(address customer, uint256 rewardId) private returns (bytes32 ticketId, string memory code) {
        for (uint256 attempt = 0; attempt < 5; attempt++) {
            bytes32 seed = keccak256(
                abi.encodePacked(customer, rewardId, block.timestamp, block.prevrandao, ticketNonce)
            );
            ticketNonce++;

            string memory candidate = _generateTicketCode(seed);
            if (codeToTicketId[candidate] == bytes32(0)) {
                return (seed, candidate);
            }
        }
        revert("No se pudo generar un codigo de ticket unico");
    }

    /// @dev Codifica 5 bytes de `seed` en base36 (0-9A-Z) con el formato "MCH-XXXX-Y".
    function _generateTicketCode(bytes32 seed) private pure returns (string memory) {
        bytes memory charset = CODE_CHARSET;
        bytes memory buffer = new bytes(10);
        buffer[0] = "M";
        buffer[1] = "C";
        buffer[2] = "H";
        buffer[3] = "-";
        for (uint256 i = 0; i < 4; i++) {
            buffer[4 + i] = charset[uint8(seed[i]) % 36];
        }
        buffer[8] = "-";
        buffer[9] = charset[uint8(seed[4]) % 36];
        return string(buffer);
    }
}
