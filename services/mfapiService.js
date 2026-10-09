const axios = require("axios");

const MFAPI_BASE_URL = "https://api.mfapi.in";

// Search mutual funds
const searchMutualFunds = async (keyword) => {
    const response = await axios.get(
        `${MFAPI_BASE_URL}/mf/search`,
        {
            params: {
                q: keyword
            },
            timeout: 10000
        }
    );

    return response.data;
};

// Get scheme details
const getSchemeDetails = async (schemeCode) => {
    const response = await axios.get(
        `${MFAPI_BASE_URL}/mf/${schemeCode}`,
        {
            timeout: 10000
        }
    );

    return response.data;
};

// Get latest NAV
const getLatestNAV = async (schemeCode) => {
    const response = await axios.get(
        `${MFAPI_BASE_URL}/mf/${schemeCode}/latest`,
        {
            timeout: 10000
        }
    );

    return response.data;
};

module.exports = {
    searchMutualFunds,
    getSchemeDetails,
    getLatestNAV
};