import { expect } from "chai";
import hre from "hardhat";

describe("VotingSystem", function () {

  async function deployVotingSystem() {

    const connection = await hre.network.connect();
    const { ethers } = connection;

    const [admin, voterA, voterB, voterC, outsider] =
      await ethers.getSigners();

    const VotingSystem =
      await ethers.getContractFactory("VotingSystem");

    const votingSystem =
      await VotingSystem.deploy(
        "Student Blockchain Election"
      );

    await votingSystem.waitForDeployment();

    return {
      connection,
      ethers,
      votingSystem,
      admin,
      voterA,
      voterB,
      voterC,
      outsider
    };
  }

  it("should set deployer as admin", async function () {

    const {
      connection,
      votingSystem,
      admin
    } = await deployVotingSystem();

    expect(await votingSystem.admin())
      .to.equal(admin.address);

    await connection.close();
  });


  it("should add candidates", async function () {

    const {
      connection,
      votingSystem
    } = await deployVotingSystem();

    await votingSystem.addCandidate(
      "Candidate A",
      "Group A"
    );

    await votingSystem.addCandidate(
      "Candidate B",
      "Group B"
    );

    expect(
      await votingSystem.getCandidateCount()
    ).to.equal(2n);

    const candidate =
      await votingSystem.getCandidate(1);

    expect(candidate.name)
      .to.equal("Candidate A");

    await connection.close();
  });


  it("should prevent non-admin from adding candidates", async function () {

    const {
      connection,
      votingSystem,
      voterA
    } = await deployVotingSystem();

    await expect(
      votingSystem
        .connect(voterA)
        .addCandidate(
          "Candidate X",
          "Group X"
        )
    ).to.be.revertedWith(
      "Only admin can perform this action"
    );

    await connection.close();
  });


  it("should register voters", async function () {

    const {
      connection,
      votingSystem,
      voterA
    } = await deployVotingSystem();

    await votingSystem.registerVoter(
      voterA.address
    );

    const status =
      await votingSystem.getVoterStatus(
        voterA.address
      );

    expect(status.isRegistered)
      .to.equal(true);

    expect(status.hasVoted)
      .to.equal(false);

    await connection.close();
  });


  it("should reject duplicate voter registration", async function () {

    const {
      connection,
      votingSystem,
      voterA
    } = await deployVotingSystem();

    await votingSystem.registerVoter(
      voterA.address
    );

    await expect(
      votingSystem.registerVoter(
        voterA.address
      )
    ).to.be.revertedWith(
      "Voter already registered"
    );

    await connection.close();
  });


  it("should reject voting before election starts", async function () {

    const {
      connection,
      votingSystem,
      voterA
    } = await deployVotingSystem();

    await votingSystem.addCandidate(
      "Candidate A",
      "Group A"
    );

    await votingSystem.addCandidate(
      "Candidate B",
      "Group B"
    );

    await votingSystem.registerVoter(
      voterA.address
    );

    await expect(
      votingSystem
        .connect(voterA)
        .vote(1)
    ).to.be.revertedWith(
      "Election is not active"
    );

    await connection.close();
  });


  it("should allow a registered voter to vote", async function () {

    const {
      connection,
      votingSystem,
      voterA
    } = await deployVotingSystem();

    await votingSystem.addCandidate(
      "Candidate A",
      "Group A"
    );

    await votingSystem.addCandidate(
      "Candidate B",
      "Group B"
    );

    await votingSystem.registerVoter(
      voterA.address
    );

    await votingSystem.startElection();

    await votingSystem
      .connect(voterA)
      .vote(1);

    const candidate =
      await votingSystem.getCandidate(1);

    expect(candidate.voteCount)
      .to.equal(1n);

    expect(
      await votingSystem.totalVotes()
    ).to.equal(1n);

    await connection.close();
  });


  it("should prevent double voting", async function () {

    const {
      connection,
      votingSystem,
      voterA
    } = await deployVotingSystem();

    await votingSystem.addCandidate(
      "Candidate A",
      "Group A"
    );

    await votingSystem.addCandidate(
      "Candidate B",
      "Group B"
    );

    await votingSystem.registerVoter(
      voterA.address
    );

    await votingSystem.startElection();

    await votingSystem
      .connect(voterA)
      .vote(1);

    await expect(
      votingSystem
        .connect(voterA)
        .vote(2)
    ).to.be.revertedWith(
      "Voter has already voted"
    );

    await connection.close();
  });


  it("should reject unregistered voters", async function () {

    const {
      connection,
      votingSystem,
      outsider
    } = await deployVotingSystem();

    await votingSystem.addCandidate(
      "Candidate A",
      "Group A"
    );

    await votingSystem.addCandidate(
      "Candidate B",
      "Group B"
    );

    await votingSystem.startElection();

    await expect(
      votingSystem
        .connect(outsider)
        .vote(1)
    ).to.be.revertedWith(
      "Voter is not registered"
    );

    await connection.close();
  });


  it("should reject invalid candidate ID", async function () {

    const {
      connection,
      votingSystem,
      voterA
    } = await deployVotingSystem();

    await votingSystem.addCandidate(
      "Candidate A",
      "Group A"
    );

    await votingSystem.addCandidate(
      "Candidate B",
      "Group B"
    );

    await votingSystem.registerVoter(
      voterA.address
    );

    await votingSystem.startElection();

    await expect(
      votingSystem
        .connect(voterA)
        .vote(99)
    ).to.be.revertedWith(
      "Invalid candidate ID"
    );

    await connection.close();
  });


  it("should end the election", async function () {

    const {
      connection,
      votingSystem,
      voterA
    } = await deployVotingSystem();

    await votingSystem.addCandidate(
      "Candidate A",
      "Group A"
    );

    await votingSystem.addCandidate(
      "Candidate B",
      "Group B"
    );

    await votingSystem.registerVoter(
      voterA.address
    );

    await votingSystem.startElection();

    await votingSystem.endElection();

    expect(
      await votingSystem.getElectionStatus()
    ).to.equal(2n);

    await connection.close();
  });


  it("should reject voting after election ends", async function () {

    const {
      connection,
      votingSystem,
      voterA
    } = await deployVotingSystem();

    await votingSystem.addCandidate(
      "Candidate A",
      "Group A"
    );

    await votingSystem.addCandidate(
      "Candidate B",
      "Group B"
    );

    await votingSystem.registerVoter(
      voterA.address
    );

    await votingSystem.startElection();

    await votingSystem.endElection();

    await expect(
      votingSystem
        .connect(voterA)
        .vote(1)
    ).to.be.revertedWith(
      "Election is not active"
    );

    await connection.close();
  });


  it("should calculate the winner", async function () {

    const {
      connection,
      votingSystem,
      voterA,
      voterB
    } = await deployVotingSystem();

    await votingSystem.addCandidate(
      "Candidate A",
      "Group A"
    );

    await votingSystem.addCandidate(
      "Candidate B",
      "Group B"
    );

    await votingSystem.registerVoter(
      voterA.address
    );

    await votingSystem.registerVoter(
      voterB.address
    );

    await votingSystem.startElection();

    await votingSystem
      .connect(voterA)
      .vote(1);

    await votingSystem
      .connect(voterB)
      .vote(1);

    await votingSystem.endElection();

    const winner =
      await votingSystem.getWinner();

    expect(winner.winnerName)
      .to.equal("Candidate A");

    expect(winner.winnerVotes)
      .to.equal(2n);

    expect(winner.isTie)
      .to.equal(false);

    await connection.close();
  });

});