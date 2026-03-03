import * as ecc from "tiny-secp256k1";
import * as secp from "tiny-secp256k1";
import { BIP32Factory } from "bip32";
import { TronWeb } from "tronweb";
import keccak from "keccak";

const bip32 = BIP32Factory(ecc);

const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io"
});

// move XPUB to env later (recommended)
const xpub =
  (process.env.TRON_XPUB && !process.env.TRON_XPUB.includes('your-')) 
    ? process.env.TRON_XPUB 
    : "xpub6CkrNdtEzPpqBx3xXNs9vdGA3Gwn851YxRTr2vEAUxUHR9yMy8osxXvMHshmU9dUptDVAzTusgF6HYrtJ61NpTmQGN6wdjbYzyAodypwjNa";

const accountNode = bip32.fromBase58(xpub);

export function generateTronAddress(index) {

  if (index === undefined || index === null) {
    throw new Error("Index is required");
  }

  const numericIndex = Number(index);

  if (Number.isNaN(numericIndex)) {
    throw new Error("Invalid index: NaN received");
  }

  const child = accountNode.derive(0).derive(numericIndex);

  const uncompressed = secp.pointCompress(child.publicKey, false);

  const pubKey = Buffer.from(uncompressed.slice(1));

  const hash = keccak("keccak256").update(pubKey).digest();

  const addressHex = "41" + hash.slice(-20).toString("hex");

  const address = tronWeb.address.fromHex(addressHex);

  return {
    address,
    index: numericIndex
  };
}