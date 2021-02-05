// @flow
import defineFunction, {ordargument} from "../defineFunction";
import buildCommon from "../buildCommon";
import SourceLocation from "../SourceLocation";

import * as html from "../buildHTML";
import * as mml from "../buildMathML";

// Non-mathy text, possibly in a font
const textFontFamilies = {
    "\\text": undefined, "\\textrm": "textrm", "\\textsf": "textsf",
    "\\texttt": "texttt", "\\textnormal": "textrm",
};

const textFontWeights = {
    "\\textbf": "textbf",
    "\\textmd": "textmd",
};

const textFontShapes = {
    "\\textit": "textit",
    "\\textup": "textup",
};

const optionsWithFont = (group, options) => {
    const font = group.font;
    // Checks if the argument is a font family or a font style.
    if (!font) {
        return options;
    } else if (textFontFamilies[font]) {
        return options.withTextFontFamily(textFontFamilies[font]);
    } else if (textFontWeights[font]) {
        return options.withTextFontWeight(textFontWeights[font]);
    } else {
        return options.withTextFontShape(textFontShapes[font]);
    }
};

defineFunction({
    type: "text",
    names: [
        // Font families
        "\\text", "\\textrm", "\\textsf", "\\texttt", "\\textnormal",
        // Font weights
        "\\textbf", "\\textmd",
        // Font Shapes
        "\\textit", "\\textup",
        // S2: Aliases other commands that aren't equivalent, but should be
        // parsed in a similar way
        "\\hbox", "\\mbox",
    ],
    props: {
        numArgs: 1,
        argTypes: ["text"],
        greediness: 2,
        allowedInText: true,
    },
    handler({parser, funcName, token}, args) {
        const body = args[0];

        /*
         * S2: Adjust the location of a text element to include both the macro
         * (stored in the 'token' object) and the argument to the text macro
         * (stored in the 'body' variable).
         */
        let loc;
        if (token !== undefined) {
            const tokenLoc = token.loc;
            const bodyLoc = body.loc;
            if (
                tokenLoc !== undefined &&
                tokenLoc !== null &&
                bodyLoc !== undefined &&
                bodyLoc !== null
            ) {
                loc = new SourceLocation(
                    parser.gullet.lexer,
                    tokenLoc.start,
                    bodyLoc.end
                );
            }
        }

        return {
            type: "text",
            mode: parser.mode,
            body: ordargument(body),
            font: funcName,
            loc,
        };
    },
    htmlBuilder(group, options) {
        const newOptions = optionsWithFont(group, options);
        const inner = html.buildExpression(group.body, newOptions, true);
        return buildCommon.makeSpan(
            ["mord", "text"], buildCommon.tryCombineChars(inner), newOptions);
    },
    mathmlBuilder(group, options) {
        const newOptions = optionsWithFont(group, options);
        return mml.buildExpressionRow(group.body, newOptions);
    },
});
