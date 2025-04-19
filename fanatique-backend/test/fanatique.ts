/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "hardhat";
import { FanScore } from "../typechain-types";
import { deployFanScore } from "./deploy/deploy";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("\n\n  == FANSCORE == \n\n", function () {
  let contractFanScore: FanScore;
  let addressFanScore: string;
  let ownerSigner: HardhatEthersSigner;
  let israel: HardhatEthersSigner;
  let vit: HardhatEthersSigner;
  let israelSigner: FanScore;
  let vitSigner: FanScore;

  before(async function () {
    // Obtem os signers da rede de teste
    [ownerSigner, israel, vit] = await ethers.getSigners() as unknown as HardhatEthersSigner[];

    // Realiza o deploy do contrato principal FanScore
    contractFanScore = await deployFanScore() as FanScore;
    addressFanScore = await contractFanScore.getAddress();

    // Cria instâncias do contrato conectadas aos respectivos signers para simular interações de usuário
    israelSigner = contractFanScore.connect(israel);
    vitSigner = contractFanScore.connect(vit);
  });

  it("Deve criar dois clubes e validar as informações", async function () {
    // Cria o clube A
    let txA = await contractFanScore.createClub("Gremio");
    await txA.wait();         
    // Obtém as informações do clube criado (id = 1)
    let clubA = await contractFanScore.getClub(1);
    // Verifica se o nome e o criador estão corretos
    expect(clubA.name).to.deep.equal("Gremio");
    expect(clubA.creator).to.deep.equal(ownerSigner.address);

    // Cria o clube B
    let txB = await contractFanScore.createClub("Inter");
    await txB.wait();
    // Obtém as informações do clube criado (id = 2)
    let clubB = await contractFanScore.getClub(2);
    // Valida as informações do clube B
    expect(clubB.name).to.deep.equal("Inter");
    expect(clubB.creator).to.deep.equal(ownerSigner.address);
  });

  it("Deve registrar torcedores aos clubes corretos", async function () {
    // israel se registra no Clube A (id = 1)
    let tx1 = await israelSigner.registerFanToClub(1);
    await tx1.wait();
    let israelFan = await contractFanScore.getFan(israel.address);
    // Verifica se o torcedor está vinculado ao clube 1
    expect(israelFan.clubId.toString()).to.deep.equal("1");

    // vit se registra no Clube B (id = 2)
    let tx2 = await vitSigner.registerFanToClub(2);
    await tx2.wait();
    let vitFan = await contractFanScore.getFan(vit.address);
    // Verifica se o torcedor está vinculado ao clube 2
    expect(vitFan.clubId.toString()).to.deep.equal("2");
  });

  it("Deve adicionar pontos aos torcedores e atualizar os pontos dos clubes", async function () {
    // Adiciona 100 pontos ao torcedor israel
    let tx1 = await contractFanScore.addFanPoints(israel.address, 100);
    await tx1.wait();
    let israelFanUpdated = await contractFanScore.getFan(israel.address);
    // Valida se os pontos do israel foram atualizados para 100
    expect(israelFanUpdated.points.toString()).to.deep.equal("100");
    // Valida se o clube do israel (Clube A) teve sua pontuação atualizada
    let clubAUpdated = await contractFanScore.getClub(1);
    expect(clubAUpdated.totalPoints.toString()).to.deep.equal("100");

    // Adiciona 50 pontos ao torcedor vit
    let tx2 = await contractFanScore.addFanPoints(vit.address, 50);
    await tx2.wait();
    let vitFanUpdated = await contractFanScore.getFan(vit.address);
    // Verifica se os pontos do vit foram atualizados para 50
    expect(vitFanUpdated.points.toString()).to.deep.equal("50");
    // Verifica se o clube do vit (Clube B) teve sua pontuação atualizada
    let clubBUpdated = await contractFanScore.getClub(2);
    expect(clubBUpdated.totalPoints.toString()).to.deep.equal("50");
  });

  it("Deve retornar o ranking dos torcedores em ordem decrescente de pontos", async function () {
    // Obtém o ranking dos torcedores
    let fanRanking = await contractFanScore.getFanRanking();
    // Como israel tem 100 pontos e vit 50, a ordem deve ser [israel, vit]
    expect(fanRanking[0]).to.deep.equal(israel.address);
    expect(fanRanking[1]).to.deep.equal(vit.address);
  });

  it("Deve retornar o ranking dos clubes em ordem decrescente de pontos", async function () {
    // Obtém o ranking dos clubes
    let clubRanking = await contractFanScore.getClubRanking();
    // O Clube A (id 1) possui 100 pontos e o Clube B (id 2) possui 50 pontos,
    // portanto, a ordem deve ser [1, 2]
    expect(clubRanking[0].toString()).to.deep.equal("1");
    expect(clubRanking[1].toString()).to.deep.equal("2");
  });
});
