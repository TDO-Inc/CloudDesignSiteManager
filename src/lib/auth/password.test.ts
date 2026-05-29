import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("produces a self-describing scrypt format with a unique salt each time", async () => {
    const a = await hashPassword("samePassword123");
    const b = await hashPassword("samePassword123");
    expect(a.startsWith("scrypt:")).toBe(true);
    expect(a.split(":")).toHaveLength(6);
    // Different salts → different hashes for the same input.
    expect(a).not.toBe(b);
    // ...but both still verify.
    expect(await verifyPassword("samePassword123", a)).toBe(true);
    expect(await verifyPassword("samePassword123", b)).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", async () => {
    await expect(hashPassword("short")).rejects.toThrow(/at least 8/);
  });

  it("returns false for empty or malformed stored hashes", async () => {
    expect(await verifyPassword("anything", "")).toBe(false);
    expect(await verifyPassword("anything", "not-a-real-hash")).toBe(false);
    expect(await verifyPassword("anything", "bcrypt:1:2:3:aa:bb")).toBe(false);
    expect(await verifyPassword("anything", "scrypt:16384:8:1:::")).toBe(false);
  });
});
