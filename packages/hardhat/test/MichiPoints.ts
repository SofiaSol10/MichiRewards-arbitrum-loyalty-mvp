import { expect } from "chai";
import { network } from "hardhat";
import type { Abi_MichiPoints } from "../generated/abis/MichiPoints.js";
import { loadAndExecuteDeploymentsFromFiles } from "../rocketh/environment.js";

const { provider, networkHelpers, ethers } = await network.create();

const CODE_REGEX = /^MCH-[0-9A-Z]{4}-[0-9A-Z]$/;
const TICKET_TTL = 900;

// We define a fixture to reuse the same setup in every test.
async function deployFixture() {
  const env = await loadAndExecuteDeploymentsFromFiles({ provider });
  const { address, abi } = env.get<Abi_MichiPoints>("MichiPoints");
  const michiPoints = await ethers.getContractAt(abi, address);
  const [deployer, merchant2, customer, other] = await ethers.getSigners();

  // deployer ya queda registrado como comercio en el constructor
  const asDeployer = michiPoints.connect(deployer);
  const asCustomer = michiPoints.connect(customer);
  const asOther = michiPoints.connect(other);

  return { env, michiPoints, deployer, merchant2, customer, other, asDeployer, asCustomer, asOther };
}

async function extractEvent(contract: any, tx: any, eventName: string) {
  const receipt = await tx.wait();
  const parsed = receipt.logs
    .map((log: any) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event: any) => event?.name === eventName);
  expect(parsed, `Expected ${eventName} to be emitted`).to.not.be.undefined;
  return parsed!.args;
}

describe("MichiPoints", function () {
  describe("Niveles Michi", function () {
    const cases: Array<[number, number, string]> = [
      [0, 1, "Michi Bebé"],
      [499, 1, "Michi Bebé"],
      [500, 2, "Michi Explorador"],
      [2499, 2, "Michi Explorador"],
      [2500, 3, "Michi Cazador Nocturno"],
      [4999, 3, "Michi Cazador Nocturno"],
      [5000, 4, "Michi Supremo"],
      [9999, 4, "Michi Supremo"],
      [10000, 5, "Michi Cósmico"],
    ];

    for (const [points, expectedLevel, expectedName] of cases) {
      it(`otorga nivel ${expectedLevel} (${expectedName}) con ${points} puntos historicos`, async function () {
        const { asDeployer, michiPoints, customer } = await networkHelpers.loadFixture(deployFixture);
        if (points > 0) {
          await asDeployer.registerPurchase(customer.address, points);
        }
        const [level, levelName] = await michiPoints.getMichiLevel(customer.address);
        expect(level).to.equal(expectedLevel);
        expect(levelName).to.equal(expectedName);
      });
    }
  });

  describe("registerPurchase", function () {
    it("acredita balanceOf, totalPointsEarned y merchantPointsIssued", async function () {
      const { asDeployer, michiPoints, deployer, customer } = await networkHelpers.loadFixture(deployFixture);
      await asDeployer.registerPurchase(customer.address, 100);

      expect(await michiPoints.balanceOf(customer.address)).to.equal(100);
      expect(await michiPoints.totalPointsEarned(customer.address)).to.equal(100);
      expect(await michiPoints.merchantPointsIssued(deployer.address)).to.equal(100);
    });

    it("respeta el rewardRate configurado", async function () {
      const { asDeployer, michiPoints, customer } = await networkHelpers.loadFixture(deployFixture);
      await asDeployer.updateRewardRate(3);
      await asDeployer.registerPurchase(customer.address, 100);
      expect(await michiPoints.balanceOf(customer.address)).to.equal(300);
    });

    it("emite PurchaseRegistered con los campos correctos", async function () {
      const { asDeployer, michiPoints, deployer, customer } = await networkHelpers.loadFixture(deployFixture);
      const tx = await asDeployer.registerPurchase(customer.address, 100);
      const args = await extractEvent(michiPoints, tx, "PurchaseRegistered");
      expect(args.user).to.equal(customer.address);
      expect(args.merchant).to.equal(deployer.address);
      expect(args.amount).to.equal(100);
      expect(args.points).to.equal(100);
    });

    it("revierte si quien llama no es un comercio autorizado", async function () {
      const { asOther, customer } = await networkHelpers.loadFixture(deployFixture);
      await expect(asOther.registerPurchase(customer.address, 100)).to.be.revertedWith(
        "No autorizado: no eres un comercio",
      );
    });

    it("revierte si el monto es cero", async function () {
      const { asDeployer, customer } = await networkHelpers.loadFixture(deployFixture);
      await expect(asDeployer.registerPurchase(customer.address, 0)).to.be.revertedWith(
        "El monto gastado debe ser mayor a 0",
      );
    });
  });

  describe("registerMerchant / removeMerchant", function () {
    it("solo el owner puede registrar o remover comercios", async function () {
      const { asOther, michiPoints, other } = await networkHelpers.loadFixture(deployFixture);
      await expect(asOther.registerMerchant(other.address)).to.be.revertedWithCustomError(
        michiPoints,
        "OwnableUnauthorizedAccount",
      );
    });

    it("habilita y luego bloquea registerPurchase segun el estado de comercio", async function () {
      const { asDeployer, michiPoints, merchant2, customer } = await networkHelpers.loadFixture(deployFixture);
      const asMerchant2 = michiPoints.connect(merchant2);

      await expect(asMerchant2.registerPurchase(customer.address, 10)).to.be.revertedWith(
        "No autorizado: no eres un comercio",
      );

      await asDeployer.registerMerchant(merchant2.address);
      await asMerchant2.registerPurchase(customer.address, 10);
      expect(await michiPoints.balanceOf(customer.address)).to.equal(10);

      await asDeployer.removeMerchant(merchant2.address);
      await expect(asMerchant2.registerPurchase(customer.address, 10)).to.be.revertedWith(
        "No autorizado: no eres un comercio",
      );
    });
  });

  describe("Catalogo de beneficios", function () {
    it("createReward publica el beneficio y getRewardsByMerchant lo lista", async function () {
      const { asDeployer, deployer } = await networkHelpers.loadFixture(deployFixture);
      await asDeployer.createReward("Café gratis", 1, 50, 10);

      const list = await asDeployer.getRewardsByMerchant(deployer.address);
      expect(list.length).to.equal(1);
      expect(list[0].title).to.equal("Café gratis");
      expect(list[0].requiredLevel).to.equal(1);
      expect(list[0].costInPoints).to.equal(50);
      expect(list[0].stock).to.equal(10);
      expect(list[0].active).to.equal(true);
    });

    it("revierte createReward si no es comercio, nivel invalido o costo cero", async function () {
      const { asDeployer, asOther } = await networkHelpers.loadFixture(deployFixture);
      await expect(asOther.createReward("X", 1, 50, 10)).to.be.revertedWith("No autorizado: no eres un comercio");
      await expect(asDeployer.createReward("X", 0, 50, 10)).to.be.revertedWith("Nivel invalido (1-5)");
      await expect(asDeployer.createReward("X", 6, 50, 10)).to.be.revertedWith("Nivel invalido (1-5)");
      await expect(asDeployer.createReward("X", 1, 0, 10)).to.be.revertedWith("El costo debe ser mayor a 0");
    });

    it("setRewardActive solo lo puede llamar el dueno del beneficio", async function () {
      const { asDeployer, michiPoints, merchant2, deployer } = await networkHelpers.loadFixture(deployFixture);
      await asDeployer.createReward("X", 1, 50, 10);
      await asDeployer.registerMerchant(merchant2.address);
      const asMerchant2 = michiPoints.connect(merchant2);

      await expect(asMerchant2.setRewardActive(1, false)).to.be.revertedWith("No eres el dueno de este beneficio");

      await asDeployer.setRewardActive(1, false);
      const list = await asDeployer.getRewardsByMerchant(deployer.address);
      expect(list[0].active).to.equal(false);
    });

    it("restock solo lo puede llamar el dueno y suma al stock existente", async function () {
      const { asDeployer, deployer } = await networkHelpers.loadFixture(deployFixture);
      await asDeployer.createReward("X", 1, 50, 10);
      await asDeployer.restock(1, 5);
      const list = await asDeployer.getRewardsByMerchant(deployer.address);
      expect(list[0].stock).to.equal(15);
    });
  });

  describe("redeemReward", function () {
    async function setupRewardAndBalance(fixture: Awaited<ReturnType<typeof deployFixture>>, points = 1000) {
      const { asDeployer, customer } = fixture;
      await asDeployer.createReward("Café gratis", 1, 50, 2);
      await asDeployer.registerPurchase(customer.address, points);
    }

    it("revierte si el beneficio no existe", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      await expect(fixture.asCustomer.redeemReward(999)).to.be.revertedWith("Beneficio inexistente");
    });

    it("revierte si el beneficio esta inactivo", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      await setupRewardAndBalance(fixture);
      await fixture.asDeployer.setRewardActive(1, false);
      await expect(fixture.asCustomer.redeemReward(1)).to.be.revertedWith("El beneficio no esta activo");
    });

    it("revierte si no queda stock", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      await setupRewardAndBalance(fixture, 1000);
      await fixture.asCustomer.redeemReward(1);
      await fixture.asCustomer.redeemReward(1);
      await expect(fixture.asCustomer.redeemReward(1)).to.be.revertedWith("Sin stock disponible");
    });

    it("revierte si el nivel Michi del cliente es insuficiente", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      await fixture.asDeployer.createReward("VIP", 3, 50, 5);
      // cliente sin compras registradas => nivel 1, la oferta requiere nivel 3
      await expect(fixture.asCustomer.redeemReward(1)).to.be.revertedWith(
        "Nivel de Michi insuficiente para este beneficio",
      );
    });

    it("revierte si el saldo gastable es insuficiente", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      // suficiente historico para el nivel, pero el costo del canje excede el saldo
      await fixture.asDeployer.createReward("Caro", 1, 5000, 5);
      await fixture.asDeployer.registerPurchase(fixture.customer.address, 100);
      await expect(fixture.asCustomer.redeemReward(1)).to.be.revertedWith("MichiPoints insuficientes");
    });

    it("descuenta saldo y stock, y emite TicketGenerated con codigo valido", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      await setupRewardAndBalance(fixture, 1000);
      const { asCustomer, michiPoints, customer, deployer } = fixture;

      const tx = await asCustomer.redeemReward(1);
      const args = await extractEvent(michiPoints, tx, "TicketGenerated");

      expect(args.code).to.match(CODE_REGEX);
      expect(args.customer).to.equal(customer.address);
      expect(args.merchant).to.equal(deployer.address);
      expect(args.rewardId).to.equal(1);
      expect(args.pointsSpent).to.equal(50);

      expect(await michiPoints.balanceOf(customer.address)).to.equal(950);
      expect(await michiPoints.merchantPointsRedeemed(deployer.address)).to.equal(50);

      const list = await fixture.asDeployer.getRewardsByMerchant(deployer.address);
      expect(list[0].stock).to.equal(1);

      const ticket = await michiPoints.tickets(args.ticketId);
      expect(ticket.status).to.equal(0n); // TicketStatus.Active
    });
  });

  describe("validateTicket / getTicketStatus", function () {
    async function redeemAndGetTicket(fixture: Awaited<ReturnType<typeof deployFixture>>) {
      await fixture.asDeployer.createReward("Café gratis", 1, 50, 2);
      await fixture.asDeployer.registerPurchase(fixture.customer.address, 1000);
      const tx = await fixture.asCustomer.redeemReward(1);
      const args = await extractEvent(fixture.michiPoints, tx, "TicketGenerated");
      return args as { ticketId: string; code: string };
    }

    it("el comercio dueno valida el ticket y lo marca Redeemed", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      const { code, ticketId } = await redeemAndGetTicket(fixture);

      const tx = await fixture.asDeployer.validateTicket(code);
      const args = await extractEvent(fixture.michiPoints, tx, "TicketValidated");
      expect(args.ticketId).to.equal(ticketId);
      expect(args.customer).to.equal(fixture.customer.address);

      expect(await fixture.michiPoints.getTicketStatus(ticketId)).to.equal(1n); // Redeemed
    });

    it("revierte si otro comercio intenta validar el ticket", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      const { code } = await redeemAndGetTicket(fixture);
      const { michiPoints, merchant2 } = fixture;

      await fixture.asDeployer.registerMerchant(merchant2.address);
      const asMerchant2 = michiPoints.connect(merchant2);
      await expect(asMerchant2.validateTicket(code)).to.be.revertedWith("Este ticket pertenece a otro comercio");
    });

    it("revierte si el ticket ya fue consumido", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      const { code } = await redeemAndGetTicket(fixture);
      await fixture.asDeployer.validateTicket(code);
      await expect(fixture.asDeployer.validateTicket(code)).to.be.revertedWith("El ticket ya fue consumido");
    });

    it("revierte si el ticket ya expiro, y getTicketStatus lo refleja sin necesidad de validar", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      const { code, ticketId } = await redeemAndGetTicket(fixture);

      await networkHelpers.time.increase(TICKET_TTL + 1);

      expect(await fixture.michiPoints.getTicketStatus(ticketId)).to.equal(2n); // Expired (computado)
      await expect(fixture.asDeployer.validateTicket(code)).to.be.revertedWith("El ticket ha expirado");
    });

    it("revierte validateTicket si quien llama no es un comercio autorizado", async function () {
      const fixture = await networkHelpers.loadFixture(deployFixture);
      const { code } = await redeemAndGetTicket(fixture);
      await expect(fixture.asOther.validateTicket(code)).to.be.revertedWith("No autorizado: no eres un comercio");
    });
  });
});
