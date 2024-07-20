// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Twitter Contract
 * @notice This contract allows users to create, like, and unlike tweets. Only registered users can interact with the tweet functionalities.
 */
interface IProfile {
    struct UserProfile {
        string displayName;
        string bio;
    }
    
    function getProfile(address _user) external view returns (UserProfile memory);
}

contract Twitter is Ownable {
    uint16 public MAX_TWEET_LENGTH = 280; // Maximum allowed length for a tweet

    struct Tweet {
        uint256 id;
        address author;
        string content;
        uint256 timestamp;
        uint256 likes;
    }

    // Mapping to store tweets for each user
    mapping(address => Tweet[]) public tweets;
    IProfile public profileContract;

    // Events to log actions
    event TweetCreated(uint256 id, address author, string content, uint256 timestamp);
    event TweetLiked(address liker, address tweetAuthor, uint256 tweetId, uint256 newLikeCount);
    event TweetUnliked(address unliker, address tweetAuthor, uint256 tweetId, uint256 newLikeCount);

    // Modifier to check if the user is registered
    modifier onlyRegistered() {
        IProfile.UserProfile memory userProfileTemp = profileContract.getProfile(msg.sender);
        require(bytes(userProfileTemp.displayName).length > 0, "User not registered");
        _;
    }

    /**
     * @notice Constructor to set the profile contract and initial owner.
     * @param _profileContract Address of the profile contract.
     * @param _initialOwner Address of the initial owner of the contract.
     */
    constructor(address _profileContract, address _initialOwner) Ownable(_initialOwner) {
        profileContract = IProfile(_profileContract);
    }

    /**
     * @notice Allows the owner to change the maximum tweet length.
     * @param newTweetLength New maximum length for a tweet.
     */
    function changeTweetLength(uint16 newTweetLength) external onlyOwner {
        MAX_TWEET_LENGTH = newTweetLength;
    }

    /**
     * @notice Returns the total number of likes for all tweets by a specific author.
     * @param _author Address of the tweet author.
     * @return totalLikes The total number of likes.
     */
    function getTotalLikes(address _author) external view returns (uint256 totalLikes) {
        for (uint256 i = 0; i < tweets[_author].length; i++) {
            totalLikes += tweets[_author][i].likes;
        }
    }

    /**
     * @notice Allows a registered user to create a new tweet.
     * @param _tweet Content of the tweet.
     */
    function createTweet(string calldata _tweet) external onlyRegistered {
        require(bytes(_tweet).length <= MAX_TWEET_LENGTH, "Tweet is too long!");

        Tweet memory newTweet = Tweet({
            id: tweets[msg.sender].length,
            author: msg.sender,
            content: _tweet,
            timestamp: block.timestamp,
            likes: 0
        });

        tweets[msg.sender].push(newTweet);

        emit TweetCreated(newTweet.id, newTweet.author, newTweet.content, newTweet.timestamp);
    }

    /**
     * @notice Allows a registered user to like a specific tweet.
     * @param author Address of the tweet author.
     * @param id ID of the tweet to like.
     */
    function likeTweet(address author, uint256 id) external onlyRegistered {
        require(id < tweets[author].length, "Tweet does not exist!");

        tweets[author][id].likes++;

        emit TweetLiked(msg.sender, author, id, tweets[author][id].likes);
    }

    /**
     * @notice Allows a registered user to unlike a specific tweet.
     * @param author Address of the tweet author.
     * @param id ID of the tweet to unlike.
     */
    function unlikeTweet(address author, uint256 id) external onlyRegistered {
        require(id < tweets[author].length, "Tweet does not exist!");
        require(tweets[author][id].likes > 0, "Tweet has no likes");

        tweets[author][id].likes--;

        emit TweetUnliked(msg.sender, author, id, tweets[author][id].likes);
    }

    /**
     * @notice Returns a specific tweet by its index for the calling user.
     * @param _i Index of the tweet.
     * @return The tweet at the given index.
     */
    function getTweet(uint256 _i) external view returns (Tweet memory) {
        return tweets[msg.sender][_i];
    }

    /**
     * @notice Returns all tweets for a specific user.
     * @param _owner Address of the tweet owner.
     * @return An array of all tweets by the specified user.
     */
    function getAllTweets(address _owner) external view returns (Tweet[] memory) {
        return tweets[_owner];
    }
}
