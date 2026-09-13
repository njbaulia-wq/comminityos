import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Strict NON-GOALS Architectural Compliance Audit', () => {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  it('NON-GOAL 1: Should NOT contain payroll, double-entry ERP packages', () => {
    const bannedPayroll = ['payroll', 'erp', 'accounting', 'ledger-cli'];
    for (const dep of Object.keys(allDeps)) {
      expect(bannedPayroll.some((b) => dep.includes(b))).toBe(false);
    }
  });

  it('NON-GOAL 2: Should NOT contain in-app chat, WebRTC, or Socket.io packages', () => {
    const bannedChat = ['socket.io', 'webrtc', 'agora', 'twilio', 'stream-chat'];
    for (const dep of Object.keys(allDeps)) {
      expect(bannedChat.some((b) => dep.includes(b))).toBe(false);
    }
  });

  it('NON-GOAL 4: Should NOT contain native mobile app frameworks in web repo', () => {
    const bannedMobile = ['react-native', '@capacitor', '@ionic', 'expo'];
    for (const dep of Object.keys(allDeps)) {
      expect(bannedMobile.some((b) => dep.includes(b))).toBe(false);
    }
  });

  it('NON-GOAL 7: Should NOT contain automated payment gateway SDKs in MVP', () => {
    const bannedPayments = ['midtrans-client', 'xendit-node', 'stripe', 'doku', 'razorpay'];
    for (const dep of Object.keys(allDeps)) {
      expect(bannedPayments.some((b) => dep.includes(b))).toBe(false);
    }
  });

  it('NON-GOAL 8: Should NOT contain autonomous AI agent frameworks', () => {
    const bannedAI = ['langchain', 'llamaindex', 'openai', '@google/generative-ai', 'autogen'];
    for (const dep of Object.keys(allDeps)) {
      expect(bannedAI.some((b) => dep.includes(b))).toBe(false);
    }
  });

  it('NON-GOAL 9: Should NOT contain Web3, crypto, or blockchain libraries', () => {
    const bannedWeb3 = ['web3', 'ethers', '@solana/web3.js', 'viem', 'wagmi', 'alchemy-sdk'];
    for (const dep of Object.keys(allDeps)) {
      expect(bannedWeb3.some((b) => dep.includes(b))).toBe(false);
    }
  });

  it('NON-GOAL 10: Should keep dependencies minimal and clean (Zero bloat)', () => {
    const prodDepsCount = Object.keys(pkg.dependencies || {}).length;
    // Maximum allowed production dependencies in MVP: 10
    expect(prodDepsCount).toBeLessThanOrEqual(10);
  });
});
