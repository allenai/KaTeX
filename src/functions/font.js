// @flow
// TODO(kevinb): implement \\sl and \\sc

import {binrelClass} from "./mclass";
import defineFunction from "../defineFunction";
import utils from "../utils";

import * as html from "../buildHTML";
import * as mml from "../buildMathML";

import type {ParseNode} from "../parseNode";

const htmlBuilder = (group: ParseNode<"font">, options) => {
    const font = group.font;
    const newOptions = options.withFont(font);
    return html.buildGroup(group.body, newOptions);
};

const mathmlBuilder = (group: ParseNode<"font">, options) => {
    const font = group.font;
    const newOptions = options.withFont(font);
    const mmlGroup = mml.buildGroup(group.body, newOptions);

    /*
     * S2: If a node is styled with a font, adjust its character offsets
     * to include the macro that styles it.
     */
    const fontLoc = group.loc;
    const mmlGroupStart = mmlGroup.getAttribute("s2:start");
    const mmlGroupEnd = mmlGroup.getAttribute("s2:end");
    if (
        mmlGroupStart !== undefined &&
        mmlGroupEnd !== undefined &&
        fontLoc !== undefined &&
        fontLoc !== null
    ) {
        const adjustedStart = Math.min(Number(mmlGroupStart), fontLoc.start);
        const adjustedEnd = Math.max(Number(mmlGroupEnd), fontLoc.end);
        mmlGroup.setAttribute("s2:style-start", String(adjustedStart));
        mmlGroup.setAttribute("s2:style-end", String(adjustedEnd));
    }

    return mmlGroup;
};

const fontAliases = {
    "\\Bbb": "\\mathbb",
    "\\bold": "\\mathbf",
    "\\frak": "\\mathfrak",
    "\\bm": "\\boldsymbol",
};

defineFunction({
    type: "font",
    names: [
        // styles, except \boldsymbol defined below
        "\\mathrm", "\\mathit", "\\mathbf", "\\mathnormal",

        // families
        "\\mathbb", "\\mathcal", "\\mathfrak", "\\mathscr", "\\mathsf",
        "\\mathtt",

        // aliases, except \bm defined below
        "\\Bbb", "\\bold", "\\frak",
    ],
    props: {
        numArgs: 1,
        greediness: 2,
    },
    handler: ({parser, funcName, token}, args) => {
        const body = args[0];
        let func = funcName;
        if (func in fontAliases) {
            func = fontAliases[func];
        }
        return {
            type: "font",
            mode: parser.mode,
            font: func.slice(1),
            body,
            loc: token !== undefined ? token.loc : undefined,
        };
    },
    htmlBuilder,
    mathmlBuilder,
});

defineFunction({
    type: "mclass",
    names: ["\\boldsymbol", "\\bm"],
    props: {
        numArgs: 1,
        greediness: 2,
    },
    handler: ({parser, token}, args) => {
        const body = args[0];
        const isCharacterBox = utils.isCharacterBox(body);
        // amsbsy.sty's \boldsymbol uses \binrel spacing to inherit the
        // argument's bin|rel|ord status
        return {
            type: "mclass",
            mode: parser.mode,
            mclass: binrelClass(body),
            body: [
                {
                    type: "font",
                    mode: parser.mode,
                    font: "boldsymbol",
                    body,
                    loc: token !== undefined ? token.loc : undefined,
                },
            ],
            isCharacterBox: isCharacterBox,
            loc: token !== undefined ? token.loc : undefined,
        };
    },
});

// Old font changing functions
defineFunction({
    type: "font",
    names: ["\\rm", "\\sf", "\\tt", "\\bf", "\\it", "\\cal"],
    props: {
        numArgs: 0,
        allowedInText: true,
    },
    handler: ({parser, funcName, breakOnTokenText, token}, args) => {
        const {mode} = parser;
        const body = parser.parseExpression(true, breakOnTokenText);
        const style = `math${funcName.slice(1)}`;

        return {
            type: "font",
            mode: mode,
            font: style,
            body: {
                type: "ordgroup",
                mode: parser.mode,
                body,
            },
            loc: token !== undefined ? token.loc : undefined,
        };
    },
    htmlBuilder,
    mathmlBuilder,
});
