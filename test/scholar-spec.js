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

    it("produces mtext for text in the 'text' command", function() {
        const tex = "\\text{Text}";
        const mathMl = getMathMLObject(tex);
        expect(mathMl("mtext:contains(Text)")).toHaveLength(1);
    });

    it("produces mi elements for symbols in equations in 'text' commands", function() {
        const tex = "\\text{$x$}";
        const mathMl = getMathMLObject(tex);
        const x = mathMl("mi:contains(x)");
        expect(x).toHaveLength(1);
        expect(x.attr("s2:start")).toBe("7");
        expect(x.attr("s2:end")).toBe("8");
    });

    it("parses text and symbols in 'mbox's", function() {
        const tex = "\\mbox{Text $x$}";
        const mathMl = getMathMLObject(tex);
        expect(mathMl("mtext:contains(Text)")).toHaveLength(1);
        expect(mathMl("mi:contains(x)")).toHaveLength(1);
    });
});
