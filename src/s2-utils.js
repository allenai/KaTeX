// @flow
import type Options from "./Options";
import type {MathNode} from "./mathMLTree";

export const setFontAttribute = function(node: MathNode, options: Options): void {
    const fontMacros = [
        options.font,
        options.fontFamily,
        options.fontWeight,
        options.fontShape,
    ].filter(f => f !== "");
    node.setAttribute("s2:font-macros", fontMacros.join("&"));
};
