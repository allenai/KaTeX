import cheerio from "cheerio";
import buildMathML from "../src/buildMathML";
import Options from "../src/Options";
import Settings from "../src/Settings";
import Style from "../src/Style";
import {getParsed} from "./helpers";

const getMathMLObject = function(expr) {
    const settings = new Settings();
    settings.throwOnError = false;
    const options = new Options({
        style: Style.TEXT,
        maxSize: Infinity,
    });
    const built = buildMathML(getParsed(expr, settings), expr, options);
    return cheerio.load(built.children[0].toMarkup());
};

describe("The MathML builder", function() {
    it("should render MathML", function() {
        const tex = "x";
        const mathMl = getMathMLObject(tex);
        expect(mathMl("mi:contains(x)")).toHaveLength(1);
    });

    it("annotates symbols with index, start, and end", function() {
        const tex = "x";
        const mathMl = getMathMLObject(tex);
        const x = mathMl("mi:contains(x)");
        expect(x.attr("s2:index")).not.toBeNull();
        expect(x.attr("s2:start")).not.toBeNull();
        expect(x.attr("s2:end")).not.toBeNull();
    });

    it("annotates ticks with character offsets", function() {
        const tex = "x'";
        const mathMl = getMathMLObject(tex);
        const tick = mathMl("mo:contains(')");
        expect(tick.attr("s2:start")).toBe("1");
        expect(tick.attr("s2:end")).toBe("2");
    });

    it("annotates \\textrm strings with character offsets", function() {
        const tex = "\\textrm{term}";
        const mathMl = getMathMLObject(tex);
        const text = mathMl("mtext");
        expect(text.attr("s2:start")).toBe("8");
        expect(text.attr("s2:end")).toBe("12");
    });

    fit("annotations multi-digit numbers with character offsets", function() {
        const tex = "1000";
        const mathMl = getMathMLObject(tex);
        const num = mathMl("mn");
        expect(num.attr("s2:start")).toBe("0");
        expect(num.attr("s2:end")).toBe("4");
    });

    it("makes <mtext> for text in the 'text' command", function() {
        const tex = "\\text{Text}";
        const mathMl = getMathMLObject(tex);
        expect(mathMl("mtext:contains(Text)")).toHaveLength(1);
    });

    it("makes <mi> for symbols in equations of 'text' commands", function() {
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
