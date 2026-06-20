import {
  Contract,
  JsonRpcProvider,
  Signature,
  keccak256,
  toUtf8Bytes,
} from "ethers";

const CONTRACT_ABI = [
  "function verify(bytes32 messageHash, bytes signature, address signerAddress) returns (bool)",
  "event SignatureVerified(address indexed signer, bytes32 indexed messageHash, bool valid)",
] as const;

export function getContract() {
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC;
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!rpcUrl || !contractAddress) {
    throw new Error("Missing contract environment variables.");
  }

  const provider = new JsonRpcProvider(rpcUrl);
  return new Contract(contractAddress, CONTRACT_ABI, provider);
}

export async function verifySignature(
  signature: string,
  message: string,
  signerAddress: string,
) {
  try {
    const contract = getContract();
    const parsedSignature = Signature.from(signature);
    const messageHash = keccak256(toUtf8Bytes(message));

    const result = await contract.verify(
      messageHash,
      parsedSignature.serialized,
      signerAddress,
    );

    if (typeof result === "boolean") {
      return { valid: result as boolean };
    }

    const receipt = await result.wait();
    return {
      valid: true,
      txHash: receipt?.hash,
    };
  } catch {
    return { valid: false };
  }
}
