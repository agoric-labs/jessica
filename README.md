# Jessica - Jessie (secure distributed Javascript) Compiler Architecture

[![CircleCI](https://circleci.com/gh/michaelfig/jessica.svg?style=svg)](https://circleci.com/gh/michaelfig/jessica)

**NOTE: Not yet production ready.  Jessica is still being bootstrapped now, but you are welcome to contribute and discuss!**

This directory contains Jessica, a compiler architecture implementing [Jessie](https://github.com/Agoric/Jessie).  In short, Jessie is a secure subset of Javascript that enables interconnected distributed applications running on different targets (such as other threads, OS processes, device drivers, networked hosts).  It does this without granting excess authority to any Jessie submodule.

Jessica is a metacircular Jessie: it is a library designed to compile or interpret itself.  Jessica consists of is its own Jessie submodules in `lib`, and language platform-specific sources in `lang/*`.  For each target, Jessica is an extension language library, as well as `jesspipe`, an executable (based on the Jessica library) for running Jessie modules.

The goal of Jessica is to be broad: providing the minimal Jessie environment for as many different language platforms as possible.

## Implementations

It is intended for you to use Jessica's extension language library in your favourite language to add Jessie scripting capabilities in an idiomatic way.

Try running `check.bat` to verify all the combinations of Jessica that are supported by your operating system and build tools.

Here are notes for how to use the Jessica API for a given language platform, including how to develop the Jessica library using its source code and the `jesspipe` interpreter.

### Node.js 8.5+

Node.js 8.5 and above can use Jessica directly as ES Modules (since Jessie is a subset of Javascript, with some additional endowed modules).

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

This is how to bootstrap Jessica for an interpreted language:

1. Create a new `./lang/NEWLANG` directory, and adapt all the files in a similar `./lang/OLDLANG` directory.

2. Edit the main entry point, `./lang/NEWLANG/jesspipe.bat`.

3. Run the combinatorial `check.bat` to verify that your new implementation works with all the Jessica features:

```sh
$ ./check.bat NEWLANG
```

4. Commit all the files in `./lang/NEWLANG` to version control.

## Bootstrapping Jessica for Compiled Languages

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

5. Run the combinatorial `check.bat` to verify that your new implementation works with all the Jessica features:

```sh
$ ./check.bat
```

6. Be sure to commit all the `./lang/NEWLANG/*.SRC` source files into version control (including `jessica.SRC` but not compiler output files), so that you can provide these bootstrap files to people who only have your language's compiler to bootstrap Jessica.


# Acknowledgements

Much appreciation to Mark S. Miller (@erights) and the [Agoric team](https://agoric.com/) for spearheading the work on secure Javascript standards and Jessie in particular.

Inspiration and a lot of implementation ideas taken from Ian Piumarta's [Maru](http://piumarta.com/software/maru/) project, as well as other work from the [Viewpoints Research Institute team](http://vpri.org/).

Have fun!
[Michael FIG](mailto:michael+jessica@fig.org), 2019-01-03
