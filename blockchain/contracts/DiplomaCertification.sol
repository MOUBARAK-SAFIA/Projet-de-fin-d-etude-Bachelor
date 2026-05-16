// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DiplomaCertification {
    // Mapping : diplomaId => hash
    mapping(string => string) private diplomaHashes;
    mapping(string => bool) private revokedDiplomas;
    address public owner;

    event DiplomaRegistered(string diplomaId, string hash);
    event DiplomaRevoked(string diplomaId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerDiploma(string memory diplomaId, string memory hash)
        public onlyOwner {
        diplomaHashes[diplomaId] = hash;
        emit DiplomaRegistered(diplomaId, hash);
    }

    function verifyDiploma(string memory diplomaId, string memory hash)
        public view returns (bool) {
        return (keccak256(abi.encodePacked(diplomaHashes[diplomaId]))
                == keccak256(abi.encodePacked(hash))
                && !revokedDiplomas[diplomaId]);
    }

    function getHash(string memory diplomaId)
        public view returns (string memory) {
        return diplomaHashes[diplomaId];
    }

    function revokeDiploma(string memory diplomaId) public onlyOwner {
        revokedDiplomas[diplomaId] = true;
        emit DiplomaRevoked(diplomaId);
    }

    function isRevoked(string memory diplomaId) public view returns (bool) {
        return revokedDiplomas[diplomaId];
    }
}
