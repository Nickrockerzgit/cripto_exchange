// import pkg from "tronweb";

// const { TronWeb } = pkg;

// const tronWeb = new TronWeb({
//   fullHost: "https://nile.trongrid.io", // ✅ MUST BE NILE
//   headers: {
//     "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY,
//   },
// });

// export default tronWeb;

import pkg from "tronweb";

const { TronWeb } = pkg;

const tronWeb = new TronWeb({
  fullHost: "https://nile.trongrid.io",
  privateKey: process.env.PRIVATE_KEY, // 👈 HOT WALLET load hoga
  headers: {
    "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY,
  },
});

export default tronWeb;