export function connectEnvelope(json: unknown, flags = 0): Buffer {
  const body = Buffer.from(JSON.stringify(json));
  const header = Buffer.alloc(5);
  header[0] = flags;
  header.writeUInt32BE(body.length, 1);
  return Buffer.concat([header, body]);
}

export function decodeConnectStream(bytes: Buffer): { messages: unknown[]; trailer: unknown } {
  const messages: unknown[] = [];
  let trailer: unknown;
  let offset = 0;
  while (offset + 5 <= bytes.length) {
    const flags = bytes[offset] ?? 0;
    const length = bytes.readUInt32BE(offset + 1);
    offset += 5;
    const slice = bytes.subarray(offset, offset + length);
    offset += length;
    const text = slice.toString('utf8');
    if (text.trim() === '') continue;
    const parsed: unknown = JSON.parse(text);
    if ((flags & 0x02) !== 0) trailer = parsed;
    else messages.push(parsed);
  }
  return { messages, trailer };
}

export async function execRequest(port: number, token: string, message: unknown): Promise<{ status: number; messages: unknown[]; trailer: unknown; raw: string }> {
  const body = Buffer.concat([connectEnvelope(message), connectEnvelope({}, 0x02)]);
  const response = await fetch(`http://127.0.0.1:${port}/agent.v1.ExecService/Exec`, {
    method: 'POST',
    headers: {
      'content-type': 'application/connect+json',
      'connect-protocol-version': '1',
      authorization: `Bearer ${token}`,
    },
    body,
  });
  const rawBytes = Buffer.from(await response.arrayBuffer());
  const raw = rawBytes.toString('utf8');
  if (!response.ok && !rawBytes.subarray(0, 1).equals(Buffer.from([0])) && raw.trim().startsWith('{') === false && rawBytes.length < 5) {
    return { status: response.status, messages: [], trailer: undefined, raw };
  }
  try {
    const decoded = decodeConnectStream(rawBytes);
    return { status: response.status, messages: decoded.messages, trailer: decoded.trailer, raw };
  } catch {
    return { status: response.status, messages: [], trailer: undefined, raw };
  }
}
