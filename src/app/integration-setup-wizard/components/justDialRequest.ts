export const JUSTDIAL_SAMPLE = {
  LeadId: '6aa27ac0e7cf2325c753c627',
  LeadType: 'company',
  Prefix: null,
  Name: 'Jagan Behera',
  Mobile: '8327742041',
  Phone: null,
  Email: null,
  Date: '2026-09-10T00:00:00',
  Category: 'Nilaya Education Group And Nilaya Icats Institute Of Commerce.',
  Area: 'Sadashiv Peth',
  City: 'Pune',
  BranchArea: 'Sadashiv Peth',
  DncMobile: 0,
  DncPhone: 0,
  Company: 'Nilaya Education Group and Nilaya ICATS Institute Of Commerce.',
  Pincode: '411030',
  Time: '15:09:12',
  BranchPin: '411030',
  ParentId: 'PXX20.XX20.090630145913.S5R6',
  Query: null,
  LeadName: null,
  LeadSource: null,
  Course: null,
  Flag: false,
  CreatedOn: null,
  UpdatedOn: null,
  ResponseResult: null,
  ApiURL: null,
};
export type JDRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string;
  fields: Record<string, unknown>;
};
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let word = '',
    quote = '',
    started = false;
  const s = text.replace(/\\\r?\n|\^\r?\n|`\r?\n/g, ' ');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === quote) quote = '';
      else if (quote === '"' && c === '\\' && ['"', '\\'].includes(s[i + 1])) word += s[++i];
      else word += c;
    } else if (c === "'" || c === '"') {
      quote = c;
      started = true;
    } else if (/\s/.test(c)) {
      if (started) {
        tokens.push(word);
        word = '';
        started = false;
      }
    } else if (c === '\\' && i + 1 < s.length) {
      word += s[++i];
      started = true;
    } else {
      word += c;
      started = true;
    }
  }
  if (quote) throw new Error('Unclosed quote in cURL request.');
  if (started) tokens.push(word);
  return tokens;
}
function objectJson(text: string): Record<string, unknown> {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected a JSON object containing one JustDial lead.');
  return value as Record<string, unknown>;
}
export const JUSTDIAL_URL_EXAMPLE = 'http://prodapi.extraaedge.com/api/leads/addRawLead?leadid=JDE5A3DE0D8DED&leadtype=Online&prefix=Mr&name=Test&mobile=19377770653&phone=&email=&date=2020-04-11&category=Degree+courses&area=Chakan&city=Pune&brancharea=AP-ATP-DN-ENCS-879&dncmobile=0&dncphone=0&company=Narayana+E-Techno+School&pincode=410501&time=15%3A51%3A30&branchpin=411005&parentid=PXX11.XX11.180115160958.SE21';

export function parseJustDialRequest(input: string): JDRequest {
  const text = input.trim();
  if (/^https?:\/\//i.test(text)) {
    const url = new URL(text);
    const fields = Object.fromEntries(url.searchParams);
    return { method: 'GET', url: text, headers: {}, queryParams: fields, body: '', fields };
  }
  if (!text) throw new Error('Enter an HTTP request, cURL command or JSON object.');
  if (text.startsWith('{'))
    return {
      method: 'POST',
      url: '',
      headers: {},
      queryParams: {},
      body: text,
      fields: objectJson(text),
    };
  let method = '',
    url = '',
    body = '';
  const headers: Record<string, string> = {};
  let get = false;
  const raw = text.match(/^([^\s]+)\s+(\S+)\s+HTTP\/\d(?:\.\d)?\r?\n/);
  if (raw) {
    method = raw[1];
    url = raw[2];
    const parts = text.split(/\r?\n\r?\n/);
    body = parts.slice(1).join('\n\n');
    parts[0]
      .split(/\r?\n/)
      .slice(1)
      .forEach((line) => {
        const i = line.indexOf(':');
        if (i > 0) headers[line.slice(0, i).toLowerCase()] = line.slice(i + 1).trim();
      });
  } else {
    const tokens = tokenize(text);
    if (!/^curl(?:\.exe)?$/i.test(tokens.shift() ?? ''))
      throw new Error('Expected cURL, raw HTTP or a JSON object.');
    const data: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const equal = t.startsWith('--') ? t.indexOf('=') : -1;
      const flag = equal > 0 ? t.slice(0, equal) : t;
      const value = () => {
        const v = equal > 0 ? t.slice(equal + 1) : tokens[++i];
        if (v === undefined) throw new Error(`Missing value for ${flag}.`);
        return v;
      };
      if (flag === '-X' || flag === '--request') method = value();
      else if (/^-X.+/.test(t)) method = t.slice(2);
      else if (flag === '--url') url = value();
      else if (flag === '-H' || flag === '--header') {
        const h = value(),
          n = h.indexOf(':');
        if (n < 1) throw new Error('Invalid request header.');
        headers[h.slice(0, n).toLowerCase()] = h.slice(n + 1).trim();
      } else if (
        [
          '-d',
          '--data',
          '--data-raw',
          '--data-binary',
          '--data-urlencode',
          '--json',
          '-F',
          '--form',
          '--form-string',
        ].includes(flag)
      ) {
        let v = value();
        if (v.startsWith('@') || (/^--form$|^-F$/.test(flag) && /=[@<]/.test(v)))
          throw new Error('File uploads require inline field values; local files are not read.');
        if (flag === '--data-urlencode') {
          const n = v.indexOf('=');
          v =
            n < 0
              ? encodeURIComponent(v)
              : `${v.slice(0, n)}=${encodeURIComponent(v.slice(n + 1))}`;
        }
        if (['-F', '--form', '--form-string'].includes(flag)) {
          const n = v.indexOf('=');
          if (n < 1) throw new Error('Form fields must use name=value.');
          v = `${encodeURIComponent(v.slice(0, n))}=${encodeURIComponent(v.slice(n + 1))}`;
        }
        data.push(v);
        if (flag === '--json') headers['content-type'] = 'application/json';
      } else if (flag === '-G' || flag === '--get') get = true;
      else if (flag === '-I' || flag === '--head') method = 'HEAD';
      else if (
        [
          '-u',
          '--user',
          '-A',
          '--user-agent',
          '--connect-timeout',
          '--max-time',
          '-o',
          '--output',
          '-b',
          '--cookie',
        ].includes(flag)
      )
        value();
      else if (/^https?:\/\//i.test(t)) {
        if (url) throw new Error('Parse one request URL at a time.');
        url = t;
      } else if (
        ![
          '-s',
          '-S',
          '-sS',
          '--silent',
          '--show-error',
          '-L',
          '--location',
          '-k',
          '--insecure',
          '--compressed',
          '-v',
          '--verbose',
          '--http1.1',
          '--http2',
        ].includes(flag)
      )
        throw new Error(
          `Unsupported cURL option: ${flag}. Paste the raw HTTP request or inline JSON instead.`
        );
    }
    body = data.join('&');
    method ||= get ? 'GET' : data.length ? 'POST' : 'GET';
  }
  if (!url) throw new Error('Request URL is missing.');
  const parsedUrl = new URL(url, 'https://justdial.local');
  if (!['http:', 'https:'].includes(parsedUrl.protocol))
    throw new Error('Only HTTP(S) request URLs are supported.');
  const queryParams = Object.fromEntries(parsedUrl.searchParams);
  let fields: Record<string, unknown> = { ...queryParams };
  if (body.trim()) {
    const json = headers['content-type']?.includes('json') || /^[{[]/.test(body.trim());
    if (json) fields = { ...fields, ...objectJson(body) };
    else if (body.includes('='))
      fields = { ...fields, ...Object.fromEntries(new URLSearchParams(body)) };
    else throw new Error('Unsupported body format. Provide JSON or URL-encoded form fields.');
  }
  return { method: method.toUpperCase(), url, headers, queryParams, body, fields };
}
export const JD_RULES = [
  ['EeSourceId', 'Constant: 10'],
  ['FirstName', 'Name'],
  ['LastName', 'LastName (otherwise null)'],
  ['Email', 'Email'],
  ['MobileNumber', 'Mobile'],
  ['IsInNDNC', 'DncMobile: 1 / true → true'],
  ['LeadSource', 'Constant: JustDial'],
  ['Remarks', 'LeadId'],
  ['Address', 'Area'],
  ['City', 'City'],
  ['PinCode', 'Pincode'],
  ['LeadChannel', 'Constant: ONLINE INQUIRY'],
  ['LeadCampaign', 'Constant: Justdial Lead'],
  ['FailedMessage', 'Validation error or empty string'],
];
export function mapJustDial(fields: Record<string, unknown>) {
  const get = (key: string) =>
    fields[Object.keys(fields).find((k) => k.toLowerCase() === key.toLowerCase()) ?? key] ?? null;
  const mobile = get('Mobile');
  const error = !get('Name')
    ? 'Name is required.'
    : !mobile
      ? 'Mobile is required.'
      : !/^\+?[\d ()-]{10,20}$/.test(String(mobile)) ||
          !/^\d{10,15}$/.test(String(mobile).replace(/\D/g, ''))
        ? 'Mobile number is invalid.'
        : get('Email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(get('Email')))
          ? 'Email is invalid.'
          : '';
  return {
    EeSourceId: 10,
    FirstName: get('Name'),
    LastName: get('LastName'),
    Email: get('Email'),
    MobileNumber: mobile,
    IsInNDNC: [true, 1, '1', 'true'].includes(get('DncMobile') as string | number | boolean),
    LeadSource: 'JustDial',
    Remarks: get('LeadId'),
    Address: get('Area'),
    City: get('City'),
    PinCode: get('Pincode'),
    LeadChannel: 'ONLINE INQUIRY',
    LeadCampaign: 'Justdial Lead',
    FailedMessage: error,
  };
}
