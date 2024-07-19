import contractABI from "./abi.json";

// Set the address of the smart contract
const contractAddress = "0x46178E5DF9AEFccEA1ac552112650A3A7d81b0Fc";

// Initialize web3 with the current provider
let web3 = new Web3(window.ethereum);

// Create a contract instance
let contract = new web3.eth.Contract(contractABI, contractAddress);

/**
 * Connects to the user's wallet using MetaMask.
 */
async function connectWallet() {
  if (window.ethereum) {
    try {
      // Request account access from MetaMask
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setConnected(accounts[0]);
    } catch (err) {
      if (err.code === 4001) {
        console.log("Please connect to Metamask.");
      } else {
        console.error(err);
      }
    }
  } else {
    console.error("No web3 provider detected");
    document.getElementById("connectMessage").innerText = "No web3 provider detected. Please install MetaMask.";
  }
}

/**
 * Creates a new tweet by interacting with the smart contract.
 * @param {string} content - The content of the tweet.
 */
async function createTweet(content) {
  const accounts = await web3.eth.getAccounts();
  try {
    // Call the createTweet method on the smart contract
    await contract.methods.createTweet(content).send({ from: accounts[0] });

    // Refresh the list of tweets after creating a new tweet
    displayTweets(accounts[0]);
  } catch (error) {
    console.error("Error creating tweet:", error);
  }
}

/**
 * Displays all tweets from a specific user.
 * @param {string} userAddress - The address of the user whose tweets are to be displayed.
 */
async function displayTweets(userAddress) {
  const tweetsContainer = document.getElementById("tweetsContainer");
  let tempTweets = [];
  tweetsContainer.innerHTML = "";

  // Fetch all tweets from the smart contract
  tempTweets = await contract.methods.getAllTweets(userAddress).call();

  // Sort tweets by timestamp in descending order
  const tweets = [...tempTweets];
  tweets.sort((a, b) => b.timestamp - a.timestamp);

  // Create and append tweet elements to the container
  for (let i = 0; i < tweets.length; i++) {
    const tweetElement = document.createElement("div");
    tweetElement.className = "tweet";

    const userIcon = document.createElement("img");
    userIcon.className = "user-icon";
    userIcon.src = `https://avatars.dicebear.com/api/human/${tweets[i].author}.svg`;
    userIcon.alt = "User Icon";

    tweetElement.appendChild(userIcon);

    const tweetInner = document.createElement("div");
    tweetInner.className = "tweet-inner";

    tweetInner.innerHTML += `
        <div class="author">${shortAddress(tweets[i].author)}</div>
        <div class="content">${tweets[i].content}</div>
    `;

    const likeButton = document.createElement("button");
    likeButton.className = "like-button";
    likeButton.innerHTML = `
        <i class="far fa-heart"></i>
        <span class="likes-count">${tweets[i].likes}</span>
    `;
    likeButton.setAttribute("data-id", tweets[i].id);
    likeButton.setAttribute("data-author", tweets[i].author);

    addLikeButtonListener(
      likeButton,
      userAddress,
      tweets[i].id,
      tweets[i].author
    );
    tweetInner.appendChild(likeButton);
    tweetElement.appendChild(tweetInner);

    tweetsContainer.appendChild(tweetElement);
  }
}

/**
 * Adds a click event listener to a like button.
 * @param {HTMLElement} likeButton - The like button element.
 * @param {string} address - The address of the user.
 * @param {number} id - The ID of the tweet.
 * @param {string} author - The address of the tweet's author.
 */
function addLikeButtonListener(likeButton, address, id, author) {
  likeButton.addEventListener("click", async (e) => {
    e.preventDefault();
    e.currentTarget.innerHTML = '<div class="spinner"></div>';
    e.currentTarget.disabled = true;
    try {
      await likeTweet(author, id);
      displayTweets(address);
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  });
}

/**
 * Shortens an Ethereum address for display purposes.
 * @param {string} address - The Ethereum address.
 * @param {number} startLength - The number of characters to display from the start.
 * @param {number} endLength - The number of characters to display from the end.
 * @returns {string} The shortened address.
 */
function shortAddress(address, startLength = 6, endLength = 4) {
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Likes a tweet by interacting with the smart contract.
 * @param {string} author - The address of the tweet's author.
 * @param {number} id - The ID of the tweet to like.
 */
async function likeTweet(author, id) {
  try {
    // Call the likeTweet method on the smart contract
    await contract.methods.likeTweet(author, id).send({ from: (await web3.eth.getAccounts())[0] });
  } catch (error) {
    console.error("Error liking tweet:", error);
  }
}

/**
 * Sets the user interface for a connected user.
 * @param {string} address - The address of the connected user.
 */
function setConnected(address) {
  document.getElementById("userAddress").innerText = "Connected: " + shortAddress(address);
  document.getElementById("connectMessage").style.display = "none";
  document.getElementById("tweetForm").style.display = "block";

  // Display all tweets after connecting to MetaMask
  displayTweets(address);
}

// Event listener for the "Connect Wallet" button
document
  .getElementById("connectWalletBtn")
  .addEventListener("click", connectWallet);

// Event listener for the tweet form submission
document.getElementById("tweetForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = document.getElementById("tweetContent").value;
  const tweetSubmitButton = document.getElementById("tweetSubmitBtn");
  tweetSubmitButton.innerHTML = '<div class="spinner"></div>';
  tweetSubmitButton.disabled = true;
  try {
    await createTweet(content);
  } catch (error) {
    console.error("Error sending tweet:", error);
  } finally {
    // Restore the original button text
    tweetSubmitButton.innerHTML = "Tweet";
    tweetSubmitButton.disabled = false;
  }
});
