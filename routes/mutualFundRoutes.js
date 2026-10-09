const express = require("express");

const router = express.Router();

const {
    searchFunds,
    getScheme,
    getLatestNav,
    getNavHistory,
    getStoredMutualFunds
} = require("../controllers/mutualFundController");


// Search mutual funds
router.get("/search", searchFunds);


// Get stored mutual funds from MongoDB
router.get("/", getStoredMutualFunds);


// Get latest NAV
router.get("/:schemeCode/latest", getLatestNav);


// Get NAV history
router.get("/:schemeCode/nav-history", getNavHistory);


// Get scheme details and store in MongoDB
router.get("/:schemeCode", getScheme);


module.exports = router;