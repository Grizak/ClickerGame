let score = 0;
let cookiesPerClick = 1;
let upgradeCost = 10;
let autoClickerCost = 50;
let autoClickerProCost = 200;
let doubleClickCost = 100;
let superAutoCost = 500;
let autoClickerInterval = null;
let autoClickerProInterval = null;
let superAutoClickerInterval = null;

// DOM Elements
const scoreDisplay = document.getElementById("score");
const upgradeButton = document.getElementById("upgrade");
const autoClickerButton = document.getElementById("auto-clicker");
const autoClickerProButton = document.getElementById("auto-clicker-pro");
const doubleClickButton = document.getElementById("double-click");
const superAutoClickerButton = document.getElementById("super-auto-clicker");
const resetButton = document.getElementById("reset");

// Save game state to localStorage
function saveGame() {
  const gameState = {
    score,
    cookiesPerClick,
    upgradeCost,
    autoClickerCost,
    autoClickerProCost,
    doubleClickCost,
    superAutoCost,
    autoClickerInterval,
    autoClickerProInterval,
    superAutoClickerInterval,
  };
  localStorage.setItem("clickerGame", JSON.stringify(gameState));
}

// Load game state from localStorage
function loadGame() {
  const savedGame = JSON.parse(localStorage.getItem("clickerGame"));
  if (savedGame) {
    score = savedGame.score;
    cookiesPerClick = savedGame.cookiesPerClick;
    upgradeCost = savedGame.upgradeCost;
    autoClickerCost = savedGame.autoClickerCost;
    autoClickerProCost = savedGame.autoClickerProCost;
    doubleClickCost = savedGame.doubleClickCost;
    superAutoCost = savedGame.superAutoCost;
    autoClickerInterval = savedGame.autoClickerInterval;
    autoClickerProInterval = savedGame.autoClickerProInterval;
    superAutoClickerInterval = savedGame.superAutoClickerInterval;

    if (savedGame.autoClickerInterval) {
      clearInterval(autoClickerInterval);
      autoClickerInterval = setInterval(() => {
        score += cookiesPerClick;
        updateScore();
        checkUpgrades();
        saveGame();
      }, 1000);
    }

    if (savedGame.autoClickerProInterval) {
      clearInterval(autoClickerProInterval);
      autoClickerProInterval = setInterval(() => {
        score += cookiesPerClick;
        updateScore();
        checkUpgrades();
        saveGame();
      }, 1000);

      if (savedGame.superAutoClickerInterval) {
        clearInterval(superAutoClickerInterval);
        superAutoClickerInterval = setInterval(() => {
          score += cookiesPerClick;
          updateScore();
          checkUpgrades();
          saveGame();
        }, 1000);
      }
    }

    // Update HTML to reflect loaded game state
    document.getElementById(
      "upgrade-cost"
    ).textContent = `${upgradeCost} cookies`;
    document.getElementById("auto-clicker-cost").textContent =
      autoClickerInterval ? "Purchased" : autoClickerCost;
    document.getElementById("auto-clicker-pro-cost").textContent =
      autoClickerProInterval ? "Purchased" : autoClickerProCost;
    document.getElementById(
      "double-click-cost"
    ).textContent = `${doubleClickCost} cookies`;
    document.getElementById("super-auto-cost").textContent =
      superAutoClickerInterval ? "Purchased" : superAutoCost;

    updateScore();
    checkUpgrades();
  }
}

// Initialize
loadGame();
updateScore();
checkUpgrades();

// Update HTML button states after loading
function checkUpgrades() {
  upgradeButton.disabled = score < upgradeCost;
  autoClickerButton.disabled =
    autoClickerInterval !== null || score < autoClickerCost;
  autoClickerProButton.disabled =
    autoClickerProInterval !== null || score < autoClickerProCost;
  doubleClickButton.disabled = score < doubleClickCost;
  superAutoClickerButton.disabled =
    superAutoClickerInterval !== null || score < superAutoCost;
}

// Update score display
function updateScore() {
  scoreDisplay.textContent = score;
  checkUpgrades();
}

// Add event listener for clicking
document.getElementById("clickButton").addEventListener("click", () => {
  score += cookiesPerClick;
  updateScore();
  checkUpgrades();
  saveGame();
});

// Click upgrade button
upgradeButton.addEventListener("click", () => {
  if (score >= upgradeCost) {
    score -= upgradeCost;
    cookiesPerClick++;
    upgradeCost *= 2;
    document.getElementById(
      "upgrade-cost"
    ).textContent = `${upgradeCost} cookies`;
    updateScore();
    checkUpgrades();
    saveGame();
  }
});

// Auto clicker button
autoClickerButton.addEventListener("click", () => {
  if (score >= autoClickerCost && autoClickerInterval === null) {
    score -= autoClickerCost;
    autoClickerButton.disabled = true;
    autoClickerInterval = setInterval(() => {
      score += cookiesPerClick;
      updateScore();
      checkUpgrades();
      saveGame();
    }, 1000);
    document.getElementById("auto-clicker-cost").textContent = "Purchased";
    updateScore();
    saveGame();
  }
});

// Auto clicker pro button
autoClickerProButton.addEventListener("click", () => {
  if (score >= autoClickerProCost && autoClickerProInterval === null) {
    score -= autoClickerProCost;
    autoClickerProButton.disabled = true;
    autoClickerProInterval = setInterval(() => {
      score += cookiesPerClick;
      updateScore();
      checkUpgrades();
      saveGame();
    }, 1000);
    document.getElementById("auto-clicker-pro-cost").textContent = "Purchased";
    updateScore();
    saveGame();
  }
});

// Double cookies per click button
doubleClickButton.addEventListener("click", () => {
  if (score >= doubleClickCost) {
    score -= doubleClickCost;
    cookiesPerClick *= 2;
    doubleClickCost *= 3;
    document.getElementById(
      "double-click-cost"
    ).textContent = `${doubleClickCost} cookies`;
    updateScore();
    checkUpgrades();
    saveGame();
  }
});

// Super auto-clicker button
superAutoClickerButton.addEventListener("click", () => {
  if (score >= superAutoCost && superAutoClickerInterval === null) {
    score -= superAutoCost;
    superAutoClickerButton.disabled = true;
    superAutoClickerInterval = setInterval(() => {
      score += cookiesPerClick;
      updateScore();
      checkUpgrades();
      saveGame();
    }, 1000);
    document.getElementById("super-auto-cost").textContent = "Purchased";
    updateScore();
    saveGame();
  }
});

// Initialize
loadGame();
updateScore();
checkUpgrades();

// Save game every 60 seconds in case the user forgets
setInterval(saveGame, 60000);

// Golden Cookie Variables
let goldenCookieTimeout;
const goldenCookieBonus = [50, 100, 200]; // Possible bonuses
const goldenCookieMultiplierDuration = 5000; // Multiplier active for 5 seconds
let goldenCookieActive = false;

// Create Golden Cookie DOM Element
const goldenCookie = document.createElement("div");
goldenCookie.id = "golden-cookie";
goldenCookie.style.position = "absolute";
goldenCookie.style.width = "50px";
goldenCookie.style.height = "50px";
goldenCookie.style.backgroundColor = "gold";
goldenCookie.style.borderRadius = "50%";
goldenCookie.style.boxShadow = "0 0 10px 5px rgba(255, 215, 0, 0.8)";
goldenCookie.style.cursor = "pointer";
goldenCookie.style.display = "none";
document.body.appendChild(goldenCookie);

// Handle Golden Cookie Click
goldenCookie.addEventListener("click", () => {
  if (!goldenCookieActive) return;

  const bonus =
    goldenCookieBonus[Math.floor(Math.random() * goldenCookieBonus.length)];
  score += bonus;
  scoreDisplay.textContent = score;

  // Apply a temporary multiplier effect
  if (Math.random() > 0.5) {
    cookiesPerClick *= 2;
    setTimeout(() => {
      cookiesPerClick /= 2;
    }, goldenCookieMultiplierDuration);
  }

  goldenCookie.style.display = "none";
  goldenCookieActive = false;

  saveGame(); // Save the game state
});

// Function to Show Golden Cookie Randomly
function showGoldenCookie() {
  if (goldenCookieActive) return;

  const x = Math.random() * (window.innerWidth - 50); // Random x position
  const y = Math.random() * (window.innerHeight - 50); // Random y position

  goldenCookie.style.left = `${x}px`;
  goldenCookie.style.top = `${y}px`;
  goldenCookie.style.display = "block";
  goldenCookieActive = true;

  // Hide Golden Cookie after 5 seconds if not clicked
  goldenCookieTimeout = setTimeout(() => {
    goldenCookie.style.display = "none";
    goldenCookieActive = false;
  }, 5000);
}

// Start Golden Cookie Interval
setInterval(showGoldenCookie, 600000); // Golden cookie appears every 600 seconds

resetButton.addEventListener("click", () => {
  // Reset game state and HTML elements
  score = 0;
  cookiesPerClick = 1;
  upgradeCost = 10;
  autoClickerCost = 50;
  autoClickerProCost = 200;
  doubleClickCost = 100;
  superAutoCost = 500;
  
  clearInterval(autoClickerInterval);
  clearInterval(autoClickerProInterval);
  clearInterval(superAutoClickerInterval);
  
  autoClickerInterval = null;
  autoClickerProInterval = null;
  superAutoClickerInterval = null;
  
  // Clear localstorage
  localStorage.clear();

  updateGUI();
});

function updateGUI() {
  updateScore();
  checkUpgrades();
  document.getElementById(
    "upgrade-cost"
  ).textContent = `${upgradeCost} cookies`;
  document.getElementById(
    "auto-clicker-cost"
  ).textContent = `${autoClickerCost} cookies`;
  document.getElementById(
    "auto-clicker-pro-cost"
  ).textContent = `${autoClickerProCost} cookies`;
  document.getElementById(
    "double-click-cost"
  ).textContent = `${doubleClickCost} cookies`;
  document.getElementById(
    "super-auto-cost"
  ).textContent = `${superAutoCost} cookies`;
}
