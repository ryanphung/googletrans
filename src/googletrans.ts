import qs from "qs";
import axios from "axios";
import adapter from "axios/lib/adapters/http";
import { isSupported, getCode } from "./languages";
import { getUserAgent } from "./utils";
interface Options {
  from?: string;
  to?: string;
  tld?: string;
  client?: string;
}
interface Result {
  text: string;
  textArray: string[];
  pronunciation: string;
  hasCorrectedLang: boolean; // has correct source language?
  src: string; // source language
  hasCorrectedText: boolean; // has correct source text?
  correctedText: string; // correct source text
  translations: []; // multiple translations
  raw: [];
}

/**
 * Translation
 * @param text - The text to be translated.
 * @param options - The  translation options. If the param is string, mean the language you want to translate into. If the param is object，can set more options.
 */
function googletrans(text: string | string[], options?: string | Options) {
  let a: any;
  if (typeof options === "string") {
    a = { to: options };
  } else {
    a = options;
  }
  return translate(text, a);
}

/**
 * @param {string} text - The text to be translated
 * @param {Object} opts - Options
 * @return {Promise} - Axios Promise
 */
async function translate(text: string | string[], opts?: Options) {
  let _opts = opts || {};
  let _text = text;
  let e: Error;
  const FROMTO = [_opts["from"], _opts["to"]];
  FROMTO.forEach((lang) => {
    if (lang && !isSupported(lang)) {
      e = new Error(`The language 「${lang}」is not supported!`);
      throw e;
    }
  });

  if (Array.isArray(_text)) {
    let str = "";
    for (let i = 0; i < _text.length; i++) {
      const t = _text[i];
      if (t.length === 0 && i === 0) {
        const e = new Error(
          "The first element of the text array is an empty string."
        );
        throw e;
      } else {
        str += t + "\n";
      }
    }
    _text = str;
  }

  if (_text.length === 0) {
    e = new Error(`The text to be translated is empty!`);
    throw e;
  }
  if (_text.length > 15000) {
    e = new Error(`The text is over the maximum character limit ( 15k )!`);
    throw e;
  }

  _opts.from = _opts.from || "auto";
  _opts.to = _opts.to || "en";
  _opts.tld = _opts.tld || "com";
  _opts.client = _opts.client || "t";

  _opts.from = getCode(_opts.from);
  _opts.to = getCode(_opts.to);
  const URL = "https://translate.google." + _opts.tld + "/_/TranslateWebserverUi/data/batchexecute";

  const RPCIDS = 'MkEWBc'; // RPC ID of the translation service

  const PARAMS = {
  };

  const data = 'f.req=' + JSON.stringify(
    [[[
      RPCIDS,
      JSON.stringify(
        [
          [
            _text,
            _opts.from,
            _opts.to,
            true
          ],
          [null]
        ],
      ),
      null,
      "generic"
    ]]]
  )

  const HEADERS = {
    "User-Agent": getUserAgent(),
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
  };

  const res = await axios({
    method: 'post',
    adapter,
    url: URL,
    params: PARAMS,
    headers: HEADERS,
    data: encodeURI(data),
    timeout: 3 * 1000,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "repeat" });
    },
  });
  return getResult(res);
}

function getObjFromRes(res: any): any {
  const body = res.data;
  let obj = JSON.parse(body.split('\n\n')[1]);
  return JSON.parse(obj[0][2])
}

function getResultFromObj(obj: any): Result {
  // console.log('obj:', JSON.stringify(obj))
  let result: Result = {
    text: "",
    textArray: [],
    pronunciation: "",
    hasCorrectedLang: false,
    src: "",
    hasCorrectedText: false,
    correctedText: "",
    translations: [],
    raw: [],
  };

  result.src = obj[1][3];
  result.pronunciation = obj[0][0];
  const correction = obj[0][1];

  if (correction?.length) {
    const textCorrection = correction[0]
    if (textCorrection?.length) {
      result.hasCorrectedText = true;
      result.correctedText = textCorrection[0][1];
    }

    const languageCorrection = correction[1]
    if (languageCorrection?.length) {
      result.hasCorrectedLang = true;
      result.src = languageCorrection[0];
    }
  }

  const translation = obj[1][0][0][5];
  result.text = translation.map(v => v[0]).join('');
  result.textArray = result.text.split('\n');

  return result;
}

function getResult(res: any): Result {
  let result: Result = {
    text: "",
    textArray: [],
    pronunciation: "",
    hasCorrectedLang: false,
    src: "",
    hasCorrectedText: false,
    correctedText: "",
    translations: [],
    raw: [],
  };

  if (res === null) return result;
  if (res.status === 200) result.raw = res.data;
  const obj = getObjFromRes(res);
  return getResultFromObj(obj);

  // body.split('\n').forEach((line: string) => {
  //   if (line.include(RPCIDS)) {
  //     obj = line.split(',')[1];
  //     if (!obj.length)
  //
  //   }

    // if (obj[0]) {
    //   result.text += obj[0];
    // }
    // if (obj[2]) {
    //   result.pronunciation += obj[2];
    // }
  // });

  // if (body[2] === body[8][0][0]) {
  //   result.src = body[2];
  // } else {
  //   result.hasCorrectedLang = true;
  //   result.src = body[8][0][0];
  // }
  //
  // if (body[1] && body[1][0][2]) result.translations = body[1][0][2];
  //
  // if (body[7] && body[7][0]) {
  //   let str = body[7][0];
  //   str = str.replace(/<b><i>/g, "[");
  //   str = str.replace(/<\/i><\/b>/g, "]");
  //   result.correctedText = str;
  //
  //   if (body[7][5]) result.hasCorrectedText = true;
  // }
}

export default googletrans;
export { googletrans, translate, getResult, getResultFromObj };
