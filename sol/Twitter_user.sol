// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @title Profile Contract
 * @notice This contract allows users to set and get their profiles, which include a display name and bio.
 */
contract Profile {
    struct UserProfile {
        string displayName;
        string bio;
    }
    
    // Mapping to store user profiles
    mapping(address => UserProfile) public profiles;

    /**
     * @notice Allows a user to set their profile with a display name and bio.
     * @param _displayName The display name of the user.
     * @param _bio The bio of the user.
     */
    function setProfile(string calldata _displayName, string calldata _bio) external {
        profiles[msg.sender] = UserProfile(_displayName, _bio);
    }

    /**
     * @notice Returns the profile of a specific user.
     * @param _user The address of the user whose profile is being requested.
     * @return The UserProfile struct containing the display name and bio of the user.
     */
    function getProfile(address _user) external view returns (UserProfile memory) {
        return profiles[_user];
    }
}
