// @flow
import defineFunction from "../defineFunction";
import buildCommon from "../buildCommon";
import mathMLTree from "../mathMLTree";

import * as html from "../buildHTML";
import * as mml from "../buildMathML";

defineFunction({
    type: "overline",
    names: ["\\overline"],
    props: {
        numArgs: 1,
    },
    handler({parser, token}, args) {
        const body = args[0];
        return {
            type: "overline",
            mode: parser.mode,
            body,
            loc: token !== undefined ? token.loc : undefined,
        };
    },
    htmlBuilder(group, options) {
        // Overlines are handled in the TeXbook pg 443, Rule 9.

        // Build the inner group in the cramped style.
        const innerGroup = html.buildGroup(group.body,
            options.havingCrampedStyle());

        // Create the line above the body
        const line = buildCommon.makeLineSpan("overline-line", options);

        // Generate the vlist, with the appropriate kerns
        const defaultRuleThickness = options.fontMetrics().defaultRuleThickness;
        const vlist = buildCommon.makeVList({
            positionType: "firstBaseline",
            children: [
                {type: "elem", elem: innerGroup},
                {type: "kern", size: 3 * defaultRuleThickness},
                {type: "elem", elem: line},
                {type: "kern", size: defaultRuleThickness},
            ],
        }, options);

        return buildCommon.makeSpan(["mord", "overline"], [vlist], options);
    },
    mathmlBuilder(group, options) {
        const operator = new mathMLTree.MathNode(
            "mo", [new mathMLTree.TextNode("\u203e")]);
        operator.setAttribute("stretchy", "true");

        const node = new mathMLTree.MathNode(
            "mover",
            [mml.buildGroup(group.body, options), operator]);
        node.setAttribute("accent", "true");

        const overlineLoc = group.loc;
        const argumentLoc = group.body.loc;
        if (overlineLoc !== undefined && overlineLoc !== null) {
            operator.setAttribute("s2:start", String(overlineLoc.start));
            operator.setAttribute("s2:end", String(overlineLoc.end));
            if (argumentLoc !== undefined && argumentLoc !== null) {
                const overStart = Math.min(overlineLoc.start, argumentLoc.start);
                const overEnd = Math.max(overlineLoc.end, argumentLoc.end);
                node.setAttribute("s2:start", String(overStart));
                node.setAttribute("s2:end", String(overEnd));
            }
        }

        return node;
    },
});
