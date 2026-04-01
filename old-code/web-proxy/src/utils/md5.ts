/**
 * 简单的MD5哈希函数实现
 * 用于密码加密等场景
 */

// MD5哈希函数的辅助函数
function addUnsigned(a: number, b: number): number {
  const lsw = (a & 0xFFFF) + (b & 0xFFFF)
  const msw = (a >> 16) + (b >> 16) + (lsw >> 16)
  return (msw << 16) | (lsw & 0xFFFF)
}

function leftRotate(value: number, shift: number): number {
  return (value << shift) | (value >>> (32 - shift))
}

function F(x: number, y: number, z: number): number {
  return (x & y) | (~x & z)
}

function G(x: number, y: number, z: number): number {
  return (x & z) | (y & ~z)
}

function H(x: number, y: number, z: number): number {
  return x ^ y ^ z
}

function I(x: number, y: number, z: number): number {
  return y ^ (x | ~z)
}

function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
  a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac))
  return addUnsigned(leftRotate(a, s), b)
}

function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
  a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac))
  return addUnsigned(leftRotate(a, s), b)
}

function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
  a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac))
  return addUnsigned(leftRotate(a, s), b)
}

function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
  a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac))
  return addUnsigned(leftRotate(a, s), b)
}

function convertToWordArray(str: string): number[] {
  const messageLength = str.length
  const numberOfWordsTemp1 = messageLength + 8
  const numberOfWordsTemp2 = (numberOfWordsTemp1 - (numberOfWordsTemp1 % 64)) / 64
  const numberOfWords = (numberOfWordsTemp2 + 1) * 16
  const wordArray = new Array(numberOfWords - 1)

  for (let i = 0; i < numberOfWords - 1; i++) {
    wordArray[i] = 0
  }

  let bytePosition = 0
  let byteCount = 0

  while (byteCount < messageLength) {
    const count = (byteCount - (byteCount % 4)) / 4
    bytePosition = (byteCount % 4) * 8
    wordArray[count] = (wordArray[count] | (str.charCodeAt(byteCount) << bytePosition))
    byteCount++
  }

  const count = (byteCount - (byteCount % 4)) / 4
  bytePosition = (byteCount % 4) * 8
  wordArray[count] = wordArray[count] | (0x80 << bytePosition)
  wordArray[numberOfWords - 2] = messageLength << 3
  wordArray[numberOfWords - 1] = messageLength >>> 29

  return wordArray
}

function wordToHex(value: number): string {
  let hex = ''
  for (let i = 0; i <= 3; i++) {
    const byte = (value >>> (i * 8)) & 255
    hex += ('0' + byte.toString(16)).slice(-2)
  }
  return hex
}

/**
 * 计算字符串的MD5哈希值
 * @param str 要哈希的字符串
 * @returns MD5哈希值的十六进制字符串
 */
export function md5(str: string): string {
  const x = convertToWordArray(str)
  let a = 0x67452301
  let b = 0xEFCDAB89
  let c = 0x98BADCFE
  let d = 0x10325476

  for (let i = 0; i < x.length; i += 16) {
    const AA = a, BB = b, CC = c, DD = d

    a = FF(a, b, c, d, x[i + 0], 7, 0xD76AA478)
    d = FF(d, a, b, c, x[i + 1], 12, 0xE8C7B756)
    c = FF(c, d, a, b, x[i + 2], 17, 0x242070DB)
    b = FF(b, c, d, a, x[i + 3], 22, 0xC1BDCEEE)
    a = FF(a, b, c, d, x[i + 4], 7, 0xF57C0FAF)
    d = FF(d, a, b, c, x[i + 5], 12, 0x4787C62A)
    c = FF(c, d, a, b, x[i + 6], 17, 0xA8304613)
    b = FF(b, c, d, a, x[i + 7], 22, 0xFD469501)
    a = FF(a, b, c, d, x[i + 8], 7, 0x698098D8)
    d = FF(d, a, b, c, x[i + 9], 12, 0x8B44F7AF)
    c = FF(c, d, a, b, x[i + 10], 17, 0xFFFF5BB1)
    b = FF(b, c, d, a, x[i + 11], 22, 0x895CD7BE)
    a = FF(a, b, c, d, x[i + 12], 7, 0x6B901122)
    d = FF(d, a, b, c, x[i + 13], 12, 0xFD987193)
    c = FF(c, d, a, b, x[i + 14], 17, 0xA679438E)
    b = FF(b, c, d, a, x[i + 15], 22, 0x49B40821)

    a = GG(a, b, c, d, x[i + 1], 5, 0xF61E2562)
    d = GG(d, a, b, c, x[i + 6], 9, 0xC040B340)
    c = GG(c, d, a, b, x[i + 11], 14, 0x265E5A51)
    b = GG(b, c, d, a, x[i + 0], 20, 0xE9B6C7AA)
    a = GG(a, b, c, d, x[i + 5], 5, 0xD62F105D)
    d = GG(d, a, b, c, x[i + 10], 9, 0x02441453)
    c = GG(c, d, a, b, x[i + 15], 14, 0xD8A1E681)
    b = GG(b, c, d, a, x[i + 4], 20, 0xE7D3FBC8)
    a = GG(a, b, c, d, x[i + 9], 5, 0x21E1CDE6)
    d = GG(d, a, b, c, x[i + 14], 9, 0xC33707D6)
    c = GG(c, d, a, b, x[i + 3], 14, 0xF4D50D87)
    b = GG(b, c, d, a, x[i + 8], 20, 0x455A14ED)
    a = GG(a, b, c, d, x[i + 13], 5, 0xA9E3E905)
    d = GG(d, a, b, c, x[i + 2], 9, 0xFCEFA3F8)
    c = GG(c, d, a, b, x[i + 7], 14, 0x676F02D9)
    b = GG(b, c, d, a, x[i + 12], 20, 0x8D2A4C8A)

    a = HH(a, b, c, d, x[i + 5], 4, 0xFFFA3942)
    d = HH(d, a, b, c, x[i + 8], 11, 0x8771F681)
    c = HH(c, d, a, b, x[i + 11], 16, 0x6D9D6122)
    b = HH(b, c, d, a, x[i + 14], 23, 0xFDE5380C)
    a = HH(a, b, c, d, x[i + 1], 4, 0xA4BEEA44)
    d = HH(d, a, b, c, x[i + 4], 11, 0x4BDECFA9)
    c = HH(c, d, a, b, x[i + 7], 16, 0xF6BB4B60)
    b = HH(b, c, d, a, x[i + 10], 23, 0xBEBFBC70)
    a = HH(a, b, c, d, x[i + 13], 4, 0x289B7EC6)
    d = HH(d, a, b, c, x[i + 0], 11, 0xEAA127FA)
    c = HH(c, d, a, b, x[i + 3], 16, 0xD4EF3085)
    b = HH(b, c, d, a, x[i + 6], 23, 0x04881D05)
    a = HH(a, b, c, d, x[i + 9], 4, 0xD9D4D039)
    d = HH(d, a, b, c, x[i + 12], 11, 0xE6DB99E5)
    c = HH(c, d, a, b, x[i + 15], 16, 0x1FA27CF8)
    b = HH(b, c, d, a, x[i + 2], 23, 0xC4AC5665)

    a = II(a, b, c, d, x[i + 0], 6, 0xF4292244)
    d = II(d, a, b, c, x[i + 7], 10, 0x432AFF97)
    c = II(c, d, a, b, x[i + 14], 15, 0xAB9423A7)
    b = II(b, c, d, a, x[i + 5], 21, 0xFC93A039)
    a = II(a, b, c, d, x[i + 12], 6, 0x655B59C3)
    d = II(d, a, b, c, x[i + 3], 10, 0x8F0CCC92)
    c = II(c, d, a, b, x[i + 10], 15, 0xFFEFF47D)
    b = II(b, c, d, a, x[i + 1], 21, 0x85845DD1)
    a = II(a, b, c, d, x[i + 8], 6, 0x6FA87E4F)
    d = II(d, a, b, c, x[i + 15], 10, 0xFE2CE6E0)
    c = II(c, d, a, b, x[i + 6], 15, 0xA3014314)
    b = II(b, c, d, a, x[i + 13], 21, 0x4E0811A1)
    a = II(a, b, c, d, x[i + 4], 6, 0xF7537E82)
    d = II(d, a, b, c, x[i + 11], 10, 0xBD3AF235)
    c = II(c, d, a, b, x[i + 2], 15, 0x2AD7D2BB)
    b = II(b, c, d, a, x[i + 9], 21, 0xEB86D391)

    a = addUnsigned(a, AA)
    b = addUnsigned(b, BB)
    c = addUnsigned(c, CC)
    d = addUnsigned(d, DD)
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase()
}
