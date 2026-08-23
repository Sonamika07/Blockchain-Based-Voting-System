// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingSystem {

    // =========================
    // ENUM: Election Status
    // =========================

    enum ElectionStatus {
        NOT_STARTED,
        ACTIVE,
        ENDED
    }

    // =========================
    // STRUCT: Candidate
    // =========================

    struct Candidate {
        uint256 id;
        string name;
        string party;
        uint256 voteCount;
    }

    // =========================
    // STRUCT: Voter
    // =========================

    struct Voter {
        bool isRegistered;
        bool hasVoted;
    }

    // =========================
    // STATE VARIABLES
    // =========================

    address public admin;

    string public electionName;

    ElectionStatus public electionStatus;

    uint256 public totalVotes;

    uint256 private candidateCount;

    mapping(uint256 => Candidate) private candidates;

    mapping(address => Voter) private voters;

    // =========================
    // EVENTS
    // =========================

    event CandidateAdded(
        uint256 indexed candidateId,
        string name,
        string party
    );

    event VoterRegistered(
        address indexed voter
    );

    event ElectionStarted(
        uint256 startTime
    );

    event VoteRecorded(
        bytes32 indexed voteReference
    );

    event ElectionEnded(
        uint256 endTime
    );

    // =========================
    // MODIFIER: ONLY ADMIN
    // =========================

    modifier onlyAdmin() {
        require(
            msg.sender == admin,
            "Only admin can perform this action"
        );
        _;
    }

    // =========================
    // MODIFIER: NOT STARTED
    // =========================

    modifier onlyBeforeElection() {
        require(
            electionStatus == ElectionStatus.NOT_STARTED,
            "Election already started"
        );
        _;
    }

    // =========================
    // CONSTRUCTOR
    // =========================

    constructor(string memory _electionName) {

        require(
            bytes(_electionName).length > 0,
            "Election name cannot be empty"
        );

        admin = msg.sender;

        electionName = _electionName;

        electionStatus = ElectionStatus.NOT_STARTED;
    }

    // =========================
    // ADD CANDIDATE
    // =========================

    function addCandidate(
        string memory _name,
        string memory _party
    )
        external
        onlyAdmin
        onlyBeforeElection
    {
        require(
            bytes(_name).length > 0,
            "Candidate name cannot be empty"
        );

        candidateCount++;

        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            party: _party,
            voteCount: 0
        });

        emit CandidateAdded(
            candidateCount,
            _name,
            _party
        );
    }

    // =========================
    // REGISTER VOTER
    // =========================

    function registerVoter(
        address _voter
    )
        external
        onlyAdmin
        onlyBeforeElection
    {
        require(
            _voter != address(0),
            "Invalid voter address"
        );

        require(
            !voters[_voter].isRegistered,
            "Voter already registered"
        );

        voters[_voter].isRegistered = true;

        emit VoterRegistered(_voter);
    }

    // =========================
    // START ELECTION
    // =========================

    function startElection()
        external
        onlyAdmin
    {
        require(
            electionStatus == ElectionStatus.NOT_STARTED,
            "Election cannot be started"
        );

        require(
            candidateCount >= 2,
            "At least two candidates required"
        );

        electionStatus = ElectionStatus.ACTIVE;

        emit ElectionStarted(block.timestamp);
    }

    // =========================
    // CAST VOTE
    // =========================

    function vote(
        uint256 _candidateId
    )
        external
    {
        require(
            electionStatus == ElectionStatus.ACTIVE,
            "Election is not active"
        );

        require(
            voters[msg.sender].isRegistered,
            "Voter is not registered"
        );

        require(
            !voters[msg.sender].hasVoted,
            "Voter has already voted"
        );

        require(
            _candidateId > 0 &&
            _candidateId <= candidateCount,
            "Invalid candidate ID"
        );

        voters[msg.sender].hasVoted = true;

        candidates[_candidateId].voteCount++;

        totalVotes++;

        bytes32 voteReference = keccak256(
            abi.encodePacked(
                msg.sender,
                block.number,
                totalVotes
            )
        );

        emit VoteRecorded(voteReference);
    }

    // =========================
    // END ELECTION
    // =========================

    function endElection()
        external
        onlyAdmin
    {
        require(
            electionStatus == ElectionStatus.ACTIVE,
            "Election is not active"
        );

        electionStatus = ElectionStatus.ENDED;

        emit ElectionEnded(block.timestamp);
    }

    // =========================
    // GET CANDIDATE
    // =========================

    function getCandidate(
        uint256 _candidateId
    )
        external
        view
        returns (
            uint256 id,
            string memory name,
            string memory party,
            uint256 voteCount
        )
    {
        require(
            _candidateId > 0 &&
            _candidateId <= candidateCount,
            "Invalid candidate ID"
        );

        Candidate memory candidate =
            candidates[_candidateId];

        return (
            candidate.id,
            candidate.name,
            candidate.party,
            candidate.voteCount
        );
    }

    // =========================
    // GET ALL CANDIDATES
    // =========================

    function getAllCandidates()
        external
        view
        returns (Candidate[] memory)
    {
        Candidate[] memory result =
            new Candidate[](candidateCount);

        for (
            uint256 i = 1;
            i <= candidateCount;
            i++
        ) {
            result[i - 1] = candidates[i];
        }

        return result;
    }

    // =========================
    // GET CANDIDATE COUNT
    // =========================

    function getCandidateCount()
        external
        view
        returns (uint256)
    {
        return candidateCount;
    }

    // =========================
    // GET VOTER STATUS
    // =========================

    function getVoterStatus(
        address _voter
    )
        external
        view
        returns (
            bool isRegistered,
            bool hasVoted
        )
    {
        Voter memory voter = voters[_voter];

        return (
            voter.isRegistered,
            voter.hasVoted
        );
    }

    // =========================
    // GET ELECTION STATUS
    // =========================

    function getElectionStatus()
        external
        view
        returns (ElectionStatus)
    {
        return electionStatus;
    }

    // =========================
    // GET WINNER
    // =========================

    function getWinner()
        external
        view
        returns (
            string memory winnerName,
            uint256 winnerVotes,
            bool isTie
        )
    {
        require(
            electionStatus == ElectionStatus.ENDED,
            "Election has not ended"
        );

        require(
            candidateCount > 0,
            "No candidates available"
        );

        uint256 highestVotes = 0;
        uint256 winnerId = 0;
        uint256 winners = 0;

        for (
            uint256 i = 1;
            i <= candidateCount;
            i++
        ) {

            uint256 votes =
                candidates[i].voteCount;

            if (votes > highestVotes) {

                highestVotes = votes;

                winnerId = i;

                winners = 1;

            } else if (
                votes == highestVotes &&
                votes > 0
            ) {

                winners++;

            }
        }

        require(
            highestVotes > 0,
            "No votes were cast"
        );

        if (winners > 1) {

            return (
                "TIE",
                highestVotes,
                true
            );

        }

        return (
            candidates[winnerId].name,
            highestVotes,
            false
        );
    }
}