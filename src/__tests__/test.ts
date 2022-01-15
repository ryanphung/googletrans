/* eslint-disable @typescript-eslint/no-require-imports */
import { getUserAgent, getRandom } from "../utils";
import { isSupported, getCode } from "../languages";
import { googletrans, translate, getResult, getResultFromObj } from "../googletrans";
const responseTest = require("./responseTest.json");
const responseTest2 = require("./responseTest2.json");
const responseTest3 = require("./responseTest3.json");
const responseTest4 = require("./responseTest4.json");
const responseTest5 = require("./responseTest5.json");

describe("translate Methods Test", () => {
  test("translate without any options", () => {
    return googletrans("vue").then((res) => {
      expect(res.src).toBe("fr");
      expect(res.hasCorrectedLang).toBe(false);
      expect(res.hasCorrectedText).toBe(false);
    });
  });

  test("translate some misspelled English text to German ", () => {
    return googletrans("I spea Dutch", { from: "en", to: "de" }).then((res) => {
      expect(res.text).toBe("ich spreche Niederländisch");
      expect(res.src).toBe("en");
      expect(res.hasCorrectedText).toBe(true);
      expect(res.correctedText).toBe("I <b><i>speak</i></b> Dutch");
    });
  });

  test("translate English text setting the source language as Portuguese", () => {
    return googletrans("Hero", { from: "pt", to: "nl" })
      .then((res) => {
        expect(res.text).toBe("Held");
        expect(res.hasCorrectedLang).toBe(true);
        expect(res.src).toBe("en");
        expect(res.hasCorrectedText).toBe(false);
      })
  });

  test("async", async () => {
    const res = await googletrans("Hero", { to: "zh" });
    expect(res.text).toBe("英雄");
    expect(res.hasCorrectedText).toBe(false);
  });

  test("translate from an unsupported language", () => {
    return googletrans("Green", { from: "Green", to: "de" })
      .then((res) => {
        expect(res.text).toBe("Grün");
        expect(res.src).toBe("en");
        expect(res.hasCorrectedLang).toBe(true);
        expect(res.hasCorrectedText).toBe(false);
      })
      .catch((err) => {
        expect(err.message).toMatch(/not/);
      });
  });

  test("translate to an unsupported language", () => {
    return googletrans("Green", { from: "en", to: "Green" })
      .then((res) => {
        expect(res.text).toBe("Green");
        expect(res.hasCorrectedText).toBe(false);
      })
      .catch((err) => {
        expect(err.message).toMatch(/not/);
      });
  });

  test("translate from dutch to english using language names instead of codes", () => {
    return googletrans("iets", { from: "dutch", to: "english" }).then((res) => {
      expect(res.text).toBe("something");
      expect(res.src).toBe("nl");
    });
  });

  test("zh-hk", async () => {
    const res = await googletrans("media", "zh-hk");
    expect(res.text).toBe("媒體");
    expect(res.hasCorrectedText).toBe(false);
  });

  test("zh-sg", async () => {
    const res = await googletrans("Game console", "zh-sg");
    expect(res.text).toBe("游戏机");
    expect(res.hasCorrectedText).toBe(false);
  });

  test("batch translation through array without empty string.", async () => {
    const res = await googletrans(["blue", "green", "yellow"], "nl");
    expect(res.text).toBe("blauw\ngroente\ngeel");
    expect(res.textArray).toContainEqual("blauw");
    expect(res.textArray).toContainEqual("groente");
    expect(res.textArray).toContainEqual("geel");
  });

  test("batch translation through an element of array.", async () => {
    const res = await googletrans(["green"], "nl");
    expect(res.text).toBe("groente");
    expect(res.textArray).toContain("groente");
    expect(res.textArray).not.toContain("geel");
    expect(res.textArray).not.toContain("blauw");
  });

  test("translation through a string.", async () => {
    const res = await googletrans("yellow", "nl");
    expect(res.textArray).toContain("geel");
    expect(res.textArray).not.toContain("groen");
    expect(res.textArray).not.toContain("blauw");
  });

  test("batch translation through an empty element of array.", async () => {
    try {
      const res = await googletrans([""], "nl");
      expect(res.text).toBe("");
      expect(res.textArray).toContainEqual("");
    } catch (error) {
      expect(error.message).toMatch(/empty/);
    }
  });

  test("translation through an empty string.", async () => {
    try {
      const res = await googletrans("", "nl");
      expect(res.text).toBe("");
      expect(res.textArray).toContainEqual("");
    } catch (error) {
      expect(error.message).toMatch(/empty/);
    }
  });

  test("batch translation by an array with an empty string.", async () => {
    const res = await googletrans(
      ["yellow", "green", "", "", "blue", ""],
      "zh"
    );
    expect(res.text).toBe("黄色的\n绿色\n\n\n蓝色");
    expect(res.textArray).toContainEqual("");
    expect(res.textArray).toContainEqual("黄色的");
    expect(res.textArray).toContainEqual("绿色");
    expect(res.textArray).toContainEqual("蓝色");
  });

  test("batch translation by an array with empty string, and an empty string is the first element.", async () => {
    try {
      const res = await googletrans(["", "Hello"], "nl");
    } catch (error) {
      expect(error.message).toMatch(/empty/);
    }
  });

  test("The text is over the maximum character limit ( 15k )", () => {
    let str = "";
    for (let i = 0; i < 750; i++) {
      const a = "HelloWorld!HelloWorld!";
      str += a;
    }

    return googletrans(str, "fr")
      .then((res) => {})
      .catch((error) => {
        console.log(error.message);
        expect(error.message).toMatch(/maximum/);
      });
  });
});

describe("isSupported method Test", () => {
  test("supported language by code", () => {
    expect(isSupported("en")).toBe(true);
  });

  test("not supported language by code", () => {
    expect(isSupported("python")).toBe(false);
  });

  test("supported language by name", () => {
    expect(isSupported("Haitian Creole")).toBe(true);
  });

  test("not supported language by name", () => {
    expect(isSupported("JavaScript")).toBe(false);
  });
});

describe("getCode method Test", () => {
  test("get code a supported language by code", () => {
    expect(getCode("fr")).toBe("fr");
  });

  test("get code a not supported language by code/name", () => {
    expect(getCode("Nova")).toBe("UNSUPPORTED");
  });

  test("get code a supported language by name ", () => {
    expect(getCode("English")).toBe("en");
  });

  test("get code with 'undefined' ", () => {
    expect(getCode("undefined")).toBe("UNSUPPORTED");
  });

  test("get code with 'null' ", () => {
    expect(getCode("null")).toBe("UNSUPPORTED");
  });

  test("get code with empty string", () => {
    expect(getCode("")).toBe("UNSUPPORTED");
  });
});

describe("random number method Test", () => {
  test("get number by int", () => {
    expect(getRandom(0, 30)).toBeLessThanOrEqual(30);
  });
  test("get number by float", () => {
    expect(getRandom(0.2, 0.3)).toBeLessThanOrEqual(1);
    expect(getRandom(0.5, 0.8)).toBeLessThanOrEqual(1);
  });
});

describe("getUserAgent", () => {
  test("get user agent", () => {
    expect(getUserAgent()).toBeDefined();
  });
});

describe("getResult method Test", () => {
  test("getResult of translation of 'most' from 'en' to 'pt'", () => {
    const result = getResultFromObj(responseTest);
    expect(result.text).toBe("a maioria");
    expect(result.pronunciation).toBe("mōst");
  });
  test("getResult of translation of 'I spea Dutch' from 'en' to 'nl'", () => {
    const result = getResultFromObj(responseTest2);
    expect(result.text).toBe("ich spreche Niederländisch");
    expect(result.pronunciation).toBe(null);
  });
  test("getResult of translation of 'translator' from 'en' to 'nl'", () => {
    const result = getResultFromObj(responseTest3);
    expect(result.text).toBe("vertaler");
    expect(result.pronunciation).toBe("ˈtranzˌlādər");
  });
  test("getResult of translation of 'hello' from 'en' to 'zh'", () => {
    const result = getResultFromObj(responseTest4);
    expect(result.text).toBe("你好");
    expect(result.pronunciation).toBe("həˈlō");
  });

  test("getResult of translation of '故事，应该从那一面墙开始说起。' from 'zh' to 'en'", () => {
    const result = getResultFromObj(responseTest5);
    expect(result.text).toBe("The story should start from that wall.");
    expect(result.pronunciation).toBe("Gùshì, yīnggāi cóng nà yīmiàn qiáng kāishǐ shuō qǐ.");
  });
});
