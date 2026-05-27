import { generateKeyPair, encryptFileHybrid, EncryptionAlgorithm } from './src/services/cryptoUtils';

async function test() {
  const kp = await generateKeyPair(4096);
  const data = new TextEncoder().encode("Hello").buffer;
  const packed = await encryptFileHybrid(kp.privateKey, data, EncryptionAlgorithm.AES_256_GCM);
  const b64 = Buffer.from(packed).toString('base64');
  console.log("Prefix:", b64.substring(0, 10));
}
test().catch(console.error);
