
// GG33 Numerology Engine for RAV_OS Identity Decryption

export function reduce(num: number): number {
  let val = num;
  if (isNaN(val)) return 0;
  while (![11, 22, 33].includes(val) && val > 9) {
    val = val.toString().split('').reduce((a, b) => a + Number(b), 0);
  }
  return val;
}

export function lifePath(dob: string): number {
  if (!dob) return 0;
  // Expected format: YYYY-MM-DD
  const digits = dob.replace(/-/g, '').split('').map(Number);
  return reduce(digits.reduce((a, b) => a + b, 0));
}

export function expression(fullName: string): number {
  if (!fullName) return 0;
  const map: Record<string, number> = {
    A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
    J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
    S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8
  };
  const sum = fullName
    .toUpperCase()
    .replace(/[^A-Z]/g,'')
    .split('')
    .reduce((a, c) => a + (map[c] || 0), 0);

  return reduce(sum);
}

export function soulUrge(fullName: string): number {
  if (!fullName) return 0;
  const vowels = ['A','E','I','O','U'];
  const map: Record<string, number> = {A:1,E:5,I:9,O:6,U:3};
  const sum = fullName
    .toUpperCase()
    .split('')
    .filter(c => vowels.includes(c))
    .reduce((a, c) => a + (map[c] || 0), 0);

  return reduce(sum);
}

export function isWealth28(num: number): boolean {
  return reduce(num) === 28 || num === 28;
}

export interface NumerologyData {
  lifePath: number;
  expression: number;
  soulUrge: number;
  isWealth: boolean;
}

export function calculateNumerology(name: string, dob: string): NumerologyData {
  const lp = lifePath(dob);
  const ex = expression(name);
  const su = soulUrge(name);
  return {
    lifePath: lp,
    expression: ex,
    soulUrge: su,
    isWealth: isWealth28(lp) || isWealth28(ex)
  };
}
