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
    it("renders MathML", function() {
        const tex = "x";
        const mathMl = getMathMLObject(tex);
        expect(mathMl("mi:contains(x)")).toHaveLength(1);
    });

    describe("creates identifiers", function() {
        it("annotated with index, start, and end", function() {
            const tex = "x";
            const mathMl = getMathMLObject(tex);
            const x = mathMl("mi:contains(x)");
            expect(x.attr("s2:index")).not.toBeNull();
            expect(x.attr("s2:start")).not.toBeNull();
            expect(x.attr("s2:end")).not.toBeNull();
        });

        it("for symbols that appear in text macros", function() {
            const tex = "\\text{$x$}";
            const mathMl = getMathMLObject(tex);
            const x = mathMl("mi:contains(x)");
            expect(x).toHaveLength(1);
            expect(x.attr("s2:start")).toBe("7");
            expect(x.attr("s2:end")).toBe("8");
        });

        it("from style macros without braces", function() {
            const tex = "\\mathcal{X}";
            const mathMl = getMathMLObject(tex);
            const X = mathMl("mi:contains(X)");
            expect(X.attr("mathvariant")).toBe("script");
            expect(X.attr("s2:start")).toBe("0");
            expect(X.attr("s2:end")).toBe("11");
        });

        it("from style macros with braces", function() {
            const tex = "\\mathcal X";
            const mathMl = getMathMLObject(tex);
            const X = mathMl("mi:contains(X)");
            expect(X.attr("s2:start")).toBe("0");
            expect(X.attr("s2:end")).toBe("10");
        });

        it("from the '\\bm' style macro)", function() {
            const tex = "\\bm x";
            const mathMl = getMathMLObject(tex);
            const x = mathMl("mi:contains(x)");
            expect(x.attr("s2:start")).toBe("0");
            expect(x.attr("s2:end")).toBe("5");
        });

        it("from the '\\rm' style macro)", function() {
            const tex = "\\rm x";
            const mathMl = getMathMLObject(tex);
            const x = mathMl("mi:contains(x)");
            expect(x.attr("s2:start")).toBe("0");
            expect(x.attr("s2:end")).toBe("5");
        });
    });

    describe("creates compound symbols", function() {
        it("annotated with character offsets", function() {
            const tex = "{x}_{i}";
            const mathMl = getMathMLObject(tex);
            const msub = mathMl("msub");
            expect(msub.attr("s2:start")).toBe("0");
            expect(msub.attr("s2:end")).toBe("7");
        });

        it("annotated with offsets containing list children", function() {
            const tex = "x_{n,i}";
            const mathMl = getMathMLObject(tex);
            const msub = mathMl("msub");
            expect(msub.attr("s2:start")).toBe("0");
            expect(msub.attr("s2:end")).toBe("7");
        });

        it("annotated with offsets containing compound children", function() {
            const tex = "x^{n_i}";
            const mathMl = getMathMLObject(tex);
            const msup = mathMl("msup");
            expect(msup.attr("s2:start")).toBe("0");
            expect(msup.attr("s2:end")).toBe("7");
        });

        it("annotated with offsets for primes", function() {
            const tex = "x'";
            const mathMl = getMathMLObject(tex);
            const msup = mathMl("msup");
            expect(msup.attr("s2:start")).toBe("0");
            expect(msup.attr("s2:end")).toBe("2");
        });

        it("annotated with offsets for primes with superscripts", function() {
            const tex = "x'^n";
            const mathMl = getMathMLObject(tex);
            const msup = mathMl("msup");
            expect(msup.attr("s2:start")).toBe("0");
            expect(msup.attr("s2:end")).toBe("4");
        });

        it("annotated with offsets including style macros", function() {
            const tex = "\\mathcal{x_i}";
            const mathMl = getMathMLObject(tex);
            /*
             * Positions of the subscript node should take into account the
             * style macro...
             */
            const msub = mathMl("msub");
            expect(msub.attr("s2:start")).toBe("0");
            expect(msub.attr("s2:end")).toBe("13");
            /*
             * But the positions of the sub-symbols ('x' and 'i') should not. This
             * is because the positions are meant to serve as an index into the
             * standalone parts of the TeX string that can be formatted
             * independently (i.e., bolded or colored).
             */
            const x = mathMl("mi:contains(x)");
            expect(x.attr("s2:start")).toBe("9");
            expect(x.attr("s2:end")).toBe("10");
            const i = mathMl("mi:contains(i)");
            expect(i.attr("s2:start")).toBe("11");
            expect(i.attr("s2:end")).toBe("12");
        });
    });

    describe("creates ticks", function() {
        it("annotated with character offsets", function() {
            const tex = "x'";
            const mathMl = getMathMLObject(tex);
            const tick = mathMl("mo:contains(')");
            expect(tick.attr("s2:start")).toBe("1");
            expect(tick.attr("s2:end")).toBe("2");
        });
    });

    describe("creates text", function() {
        it("annotated with character offsets", function() {
            const tex = "\\textrm{term}";
            const mathMl = getMathMLObject(tex);
            const text = mathMl("mtext");
            expect(text.attr("s2:start")).toBe("8");
            expect(text.attr("s2:end")).toBe("12");
        });

        it("from text in a '\\text' macro", function() {
            const tex = "\\text{Text}";
            const mathMl = getMathMLObject(tex);
            expect(mathMl("mtext:contains(Text)")).toHaveLength(1);
        });

        it("from '\\mbox's", function() {
            const tex = "\\mbox{Text $x$}";
            const mathMl = getMathMLObject(tex);
            expect(mathMl("mtext:contains(Text)")).toHaveLength(1);
            expect(mathMl("mi:contains(x)")).toHaveLength(1);
        });
    });

    describe("creates numbers", function() {
        it("annotated with character offsets", function() {
            const tex = "1000";
            const mathMl = getMathMLObject(tex);
            const num = mathMl("mn");
            expect(num.attr("s2:start")).toBe("0");
            expect(num.attr("s2:end")).toBe("4");
        });
    });

    describe("creates accents", function() {
        it("with character offsets for <mo> nodes", function() {
            const tex = "\\bar x";
            const mathMl = getMathMLObject(tex);
            const bar = mathMl("mo:contains(ˉ)");
            expect(bar).toHaveLength(1);
            expect(bar.attr("s2:start")).toBe("0");
            expect(bar.attr("s2:end")).toBe("5");
        });

        it("with character offsets for <mover> nodes", function() {
            const tex = "\\bar x";
            const mathMl = getMathMLObject(tex);
            const over = mathMl("mover");
            expect(over).toHaveLength(1);
            expect(over.attr("s2:start")).toBe("0");
            expect(over.attr("s2:end")).toBe("6");
        });

        it("from accent macros that use braces", function() {
            const tex = "\\bar{x}";
            const mathMl = getMathMLObject(tex);
            const over = mathMl("mover");
            expect(over).toHaveLength(1);
            expect(over.attr("s2:start")).toBe("0");
            expect(over.attr("s2:end")).toBe("7");
        });

        it("from '\\overline' macros", function() {
            const tex = "\\overline x";
            const mathMl = getMathMLObject(tex);
            const over = mathMl("mover");
            expect(over).toHaveLength(1);
            expect(over.attr("s2:start")).toBe("0");
            expect(over.attr("s2:end")).toBe("11");
            const line = mathMl("mo:contains(‾)");
            expect(line).toHaveLength(1);
            expect(line.attr("s2:start")).toBe("0");
            expect(line.attr("s2:end")).toBe("10");
        });
    });
});
