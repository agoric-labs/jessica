# Jessica - Jessie (secure Javascript subset) Compiler Architecture

[![CircleCI](https://circleci.com/gh/michaelfig/jessica.svg?style=svg)](https://circleci.com/gh/michaelfig/jessica)

Jessica is a library for interpreting the [Jessie](https://github.com/Agoric/Jessie) secure subset of Javascript.  Jessica's `lib` directory contains its entire implementation, composed of modules written in Jessie.  That makes the implementation as a whole secure through Jessie's guarantees.

`lib` is designed to be interpreted by or translated into other, non-Jessie language implementations.  This mechanism provides multiple independent implementations all capable of evaluating Jessie scripts.  This diversity forms an interlocking trusted computing base (TCB) that provides all of Jessie's safety guarantees to the modules that run on it.

## Implementations

It is intended for you to use Jessica's extension language library in your favourite language to add Jessie scripting capabilities in an idiomatic way.

Jessica is a Jessie runtime environment created using only Jessie modules, containing also translators from Jessie to other languages.  `jesspipe` is the command-line tool (implemented by hand for different language platforms) that allows you to invoke standalone Jessie modules, such as the Jessie translators.

Here are notes for how to use the Jessica API (TODO: document when settled) on your language system, including how to develop the Jessica library using the `jesspipe` interpreter.

### Node.js 8.5+

Node.js 8.5 and above can use Jessica directly as an ES Module library (since Jessie is a subset of Javascript, with some additional libraries).

Until Node.js API documents are completed, you can read `lang/nodejs/jesspipe.mjs` for an example of how to use the Jessie API.

To run a `jesspipe` module, do:

```sh
$ ./lang/nodejs/jesspipe.bat MODULE -- INFILES...
```

or on Windows:

```sh
C:\> lang\nodejs\jesspipe.bat MODULE -- INFILES...
```

### C99

FIXME: not yet

The C programming language, (ISO standard C 9899:1999) is a target language for the Jessica library.

Read `lang/c/jessica.h` for information on the C programming API provided by `lang/c/jessica.c`.

To run a `jesspipe` module, do:

```sh
$ ./lang/c/jesspipe.bat MODULE -- INFILES...
```

### Another language not listed

See the next sections for instructions on how to bootstrap Jessica for a new language.

## Bootstrapping Jessica for Interpreted Languages

FIXME: not yet

## Bootstrapping Jessica for Compiled Languages

FIXME: not yet

This is how to bootstrap Jessica for a compiled language
implementation from a related language (or itself):

1. Create a new `./lib/emit-NEWLANG.mjs` file, based off of an existing similar `./lib/emit-OLDLANG.mjs`.

2. Run your existing `jesspipe` to execute your emitter to translate the Jessica `./lib` master sources into a library in your new language's syntax, where `SRC` is the source file suffix for your language:

```sh
$ mkdir ./lang/NEWLANG
$ ./lang/OLDLANG/jesspipe.bat ./lib/emit-NEWLANG.mjs -- ./lib/*.mjs > ./lang/NEWLANG/jessica.SRC
```

3. Write a `./lang/NEWLANG/jesspipe.SRC` main program, along with any support files in `./lang/NEWLANG` designed for linking against `./lang/NEWLANG/jessica.SRC`.

4. Create an executable `./lang/NEWLANG/jesspipe.bat` script to compile and link the`./lang/NEWLANG/jesspipe.exe` main program from `./lang/NEWLANG/*.SRC` using your new language's default compiler if the executable it is out-of-date, and then have `jesspipe.bat` run it.

5. Be sure to check all the `./lang/NEWLANG/*.SRC` source files into version control (including `jessica.SRC` but not compiler output files), so that you can provide these bootstrap files to people who only have your language's compiler to bootstrap Jessica.


# Acknowledgements

Much appreciation to Mark S. Miller (@erights) and the [Agoric team](https://agoric.com/) for spearheading the work on secure Javascript standards and Jessie in particular.

Inspiration and a lot of implementation ideas taken from Ian Piumarta's [Maru](http://piumarta.com/software/maru/) project, as well as other work from the [Viewpoints Research Institute team](http://vpri.org/).

Have fun!
[Michael FIG](mailto:michael+jessica@fig.org), 2019-01-03
