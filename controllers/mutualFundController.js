const MutualFund = require("../models/MutualFund");

const {
    searchMutualFunds,
    getSchemeDetails,
    getLatestNAV
} = require("../services/mfapiService");

const axios = require("axios");


// =====================================================
// 1. SEARCH MUTUAL FUNDS
// GET /api/mutual-funds/search?q=HDFC
// =====================================================

const searchFunds = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Search keyword is required"
            });
        }

        const data = await searchMutualFunds(q.trim());

        return res.status(200).json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error("Search error:", error.message);

        if (error.response) {
            return res.status(error.response.status || 502).json({
                success: false,
                message: "MFAPI returned an error"
            });
        }

        return res.status(503).json({
            success: false,
            message: "MFAPI is unavailable"
        });
    }
};


// =====================================================
// 2. GET SCHEME DETAILS AND STORE IN MONGODB
// GET /api/mutual-funds/:schemeCode
// =====================================================

const getScheme = async (req, res) => {
    try {
        const { schemeCode } = req.params;

        if (!schemeCode || !/^\d+$/.test(schemeCode)) {
            return res.status(400).json({
                success: false,
                message: "Valid scheme code is required"
            });
        }

        const data = await getSchemeDetails(schemeCode);

        if (!data || !data.meta) {
            return res.status(404).json({
                success: false,
                message: "Mutual fund scheme not found"
            });
        }

        const meta = data.meta;

        const mutualFundData = {
            schemeCode: String(meta.scheme_code || schemeCode),
            schemeName: meta.scheme_name,
            fundHouse: meta.fund_house,
            schemeType: meta.scheme_type,
            schemeCategory: meta.scheme_category,
            isinGrowth: meta.isin_growth || null,
            isinDivReinvestment: meta.isin_div_reinvestment || null
        };

        // Update existing record or create new record
        const mutualFund = await MutualFund.findOneAndUpdate(
            {
                schemeCode: mutualFundData.schemeCode
            },
            mutualFundData,
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Mutual fund details fetched and stored successfully",
            data: mutualFund,
            mfapiResponse: data
        });

    } catch (error) {
        console.error("Scheme details error:", error.message);

        if (error.response) {
            return res.status(error.response.status || 502).json({
                success: false,
                message: "MFAPI returned an error"
            });
        }

        if (error.name === "MongoServerError") {
            return res.status(500).json({
                success: false,
                message: "Database error while storing mutual fund"
            });
        }

        return res.status(503).json({
            success: false,
            message: "Unable to fetch mutual fund details"
        });
    }
};


// =====================================================
// 3. GET LATEST NAV AND STORE IN MONGODB
// GET /api/mutual-funds/:schemeCode/latest
// =====================================================

const getLatestNav = async (req, res) => {
    try {
        const { schemeCode } = req.params;

        if (!schemeCode || !/^\d+$/.test(schemeCode)) {
            return res.status(400).json({
                success: false,
                message: "Valid scheme code is required"
            });
        }

        const data = await getLatestNAV(schemeCode);

        if (!data || !data.data || data.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Latest NAV not found"
            });
        }

        const latestData = data.data[0];

        const latestNav = latestData.nav;
        const latestNavDate = latestData.date;

        const mutualFund = await MutualFund.findOneAndUpdate(
            {
                schemeCode: String(schemeCode)
            },
            {
                latestNav: latestNav,
                latestNavDate: latestNavDate
            },
            {
                new: true
            }
        );

        if (!mutualFund) {
            return res.status(404).json({
                success: false,
                message: "Scheme not found in database. Fetch scheme details first."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Latest NAV fetched and stored successfully",
            data: {
                schemeCode: schemeCode,
                latestNav: latestNav,
                latestNavDate: latestNavDate
            },
            mfapiResponse: data
        });

    } catch (error) {
        console.error("Latest NAV error:", error.message);

        if (error.response) {
            return res.status(error.response.status || 502).json({
                success: false,
                message: "MFAPI returned an error"
            });
        }

        return res.status(503).json({
            success: false,
            message: "Unable to fetch latest NAV"
        });
    }
};


// =====================================================
// 4. GET NAV HISTORY
// GET /api/mutual-funds/:schemeCode/nav-history
// =====================================================

const getNavHistory = async (req, res) => {
    try {
        const { schemeCode } = req.params;

        const { startDate, endDate } = req.query;

        if (!schemeCode || !/^\d+$/.test(schemeCode)) {
            return res.status(400).json({
                success: false,
                message: "Valid scheme code is required"
            });
        }

        const params = {};

        if (startDate) {
            params.startDate = startDate;
        }

        if (endDate) {
            params.endDate = endDate;
        }

        const response = await axios.get(
            `https://api.mfapi.in/mf/${schemeCode}`,
            {
                params: params,
                timeout: 10000
            }
        );

        // IMPORTANT:
        // NAV history is NOT stored in MongoDB.
        return res.status(200).json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error("NAV history error:", error.message);

        if (error.response) {
            return res.status(error.response.status || 502).json({
                success: false,
                message: "MFAPI returned an error"
            });
        }

        return res.status(503).json({
            success: false,
            message: "MFAPI is unavailable"
        });
    }
};


// =====================================================
// 5. GET MUTUAL FUNDS FROM MONGODB
// GET /api/mutual-funds
// =====================================================

const getStoredMutualFunds = async (req, res) => {
    try {
        const mutualFunds = await MutualFund.find()
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: mutualFunds.length,
            data: mutualFunds
        });

    } catch (error) {
        console.error("Database fetch error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch mutual funds from database"
        });
    }
};


module.exports = {
    searchFunds,
    getScheme,
    getLatestNav,
    getNavHistory,
    getStoredMutualFunds
};