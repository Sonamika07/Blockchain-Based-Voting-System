import hre from "hardhat";

async function main() {
    const connection = await hre.network.connect();

    const { ethers } = connection;

    const [admin] = await ethers.getSigners();

    console.log("Deploying contract...");
    console.log("Admin address:", admin.address);

    const VotingSystem =
        await ethers.getContractFactory("VotingSystem");

    const votingSystem =
        await VotingSystem.deploy(
            "Student Blockchain Election"
        );

    await votingSystem.waitForDeployment();

    const contractAddress =
        await votingSystem.getAddress();

    console.log(
        "VotingSystem deployed to:",
        contractAddress
    );

    await connection.close();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});