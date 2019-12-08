import cheerio from "cheerio";

import {getParsed} from "./helpers";
import buildMathML from "../src/buildMathML";
import Style from "../src/Style";
import Options from "../src/Options";



const getMathMLObject = function(expr) {
    const options = new Options({
        style: Style.TEXT,
        maxSize: Infinity,
    });
    const built = buildMathML(getParsed(expr), expr, options);
    return cheerio.load(built.children[0].toMarkup());
};

describe("The MathML builder", function() {
    it("should render MathML", function() {
        const tex = "x";
        const mathMl = getMathMLObject(tex);
        expect(mathMl('mi:contains(x)')).toHaveLength(1);
    });

    it("should annotate symbols with index, start, and end", function() {
        const tex = "x";
        const mathMl = getMathMLObject(tex);
        const x = mathMl("mi:contains(x)");
        expect(x.attr("s2:index")).not.toBeNull();
        expect(x.attr("s2:start")).not.toBeNull();
        expect(x.attr("s2:end")).not.toBeNull();
    });
});
